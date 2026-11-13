/*
 * Minimal stand-in for the boards' missing ./support.js runtime, used only to
 * screenshot design/fresh/*.dc.html. screenshots.mjs rewrites <sc-for> and
 * <sc-if> into <template data-sc-*> (templates survive table and select
 * parsing), then this renders them from the board's Component.renderVals().
 */
(() => {
  class DCLogic {
    constructor(props) {
      this.props = props;
      this.state = {};
    }
    setState(next) {
      Object.assign(this.state, next);
      render();
    }
  }
  window.DCLogic = DCLogic;

  let host, source, comp;

  // {{a.b}} lookups against the current scope; {{true}} / {{false}} literals.
  const lookup = (expr, scope) => {
    expr = expr.trim();
    if (expr === "true") return true;
    if (expr === "false") return false;
    return expr.split(".").reduce((v, k) => (v == null ? undefined : v[k]), scope);
  };
  const ONE = /^\s*\{\{([^}]+)\}\}\s*$/;
  const ANY = /\{\{([^}]+)\}\}/g;

  function fill(node, scope) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.data.includes("{{")) child.data = child.data.replace(ANY, (_, e) => lookup(e, scope) ?? "");
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      if (child.tagName === "TEMPLATE" && child.hasAttribute("data-sc-for")) {
        const list = lookup(child.getAttribute("list").match(ONE)[1], scope) || [];
        const as = child.getAttribute("as");
        const frag = document.createDocumentFragment();
        for (const item of list) {
          const part = child.content.cloneNode(true);
          fill(part, { ...scope, [as]: item });
          frag.append(part);
        }
        child.replaceWith(frag);
        continue;
      }
      if (child.tagName === "TEMPLATE" && child.hasAttribute("data-sc-if")) {
        const on = lookup(child.getAttribute("value").match(ONE)[1], scope);
        if (on) {
          const part = child.content.cloneNode(true);
          fill(part, scope);
          child.replaceWith(part);
        } else child.remove();
        continue;
      }
      for (const attr of [...child.attributes]) {
        if (!attr.value.includes("{{")) continue;
        const whole = attr.value.match(ONE);
        if (whole) {
          const v = lookup(whole[1], scope);
          if (typeof v === "function") {
            child.removeAttribute(attr.name);
            child.addEventListener(attr.name.replace(/^on/i, "").toLowerCase(), v);
          } else if (v === false || v == null) child.removeAttribute(attr.name);
          else child.setAttribute(attr.name, v === true ? "" : String(v));
        } else child.setAttribute(attr.name, attr.value.replace(ANY, (_, e) => lookup(e, scope) ?? ""));
      }
      fill(child, scope);
      if (child.tagName === "SELECT" && child.hasAttribute("value")) child.value = child.getAttribute("value");
    }
  }

  function render() {
    const root = source.content.cloneNode(true);
    fill(root, comp.renderVals());
    host.replaceChildren(root);
  }

  document.addEventListener("DOMContentLoaded", () => {
    host = document.querySelector("x-dc");
    const script = document.querySelector('script[type="text/x-dc"]');
    if (!host || !script) return;
    source = document.createElement("template");
    source.innerHTML = host.innerHTML;
    const props = JSON.parse(script.dataset.props || "{}");
    const Component = new Function("DCLogic", `${script.textContent}\nreturn Component;`)(DCLogic);
    comp = new Component(props);
    render();
    document.documentElement.dataset.boardReady = "1";
  });
})();
