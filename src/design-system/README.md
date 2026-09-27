# Freestack design system

Local, in-repo. Not a published package.

## Why here, not a shared lib yet

- One consumer (`freestack`). Extract a package when a second project needs the same tokens.
- Evolve intentional decisions in `tokens.css` + `components.css`.

## Tokens

| Token | Role |
| --- | --- |
| `bg` / `s1` / `s2` | page + raised surfaces |
| `b1` / `b2` | hairlines / stronger borders |
| `ink` / `ink-2` / `ink-3` | primary / secondary / tertiary text |
| `sand` | accent (active switch, hover name) |
| `ok` | live / available status |
| `--font-mono` | wordmark, chips, limits, tabs |
| `--font-sans` | body |

## Primitives

- `.ds-wrap` · `.ds-hairline` · `.ds-section-label`
- `.ds-btn` + `.ds-btn-filled` / `.ds-btn-outline`
- `.ds-input`
- `.ds-switch` + `.ds-chip` — exclusive filters (cost / who / commercial)
- `.ds-switch[data-variant="tabs"]` + `.ds-tab` — **single-select** category switch
- `.ds-badge` · `.ds-status` · `.ds-tool-row`

## Rules of thumb

1. One accent. No purple gradients, glow stacks, or pill-cluster heroes.
2. Limits live in mono, always visible.
3. Catalog tabs select one catalog. Category and field filters may combine.
4. Prefer rows + hairlines over card grids for the directory.
