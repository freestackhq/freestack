#!/usr/bin/env python3
"""File every ### heading in docs/issues/README.md as a GitHub issue.

Usage: python3 scripts/file-issues.py [--dry-run]
Needs the gh CLI, signed in, run from the repo root.
Skips issues whose title already exists, so it is safe to re-run.
"""
import json, re, subprocess, sys

DRY = '--dry-run' in sys.argv
text = open('docs/issues/README.md', encoding='utf-8').read()

existing = set()
if not DRY:
    out = subprocess.run(['gh', 'issue', 'list', '--state', 'all', '--limit', '500', '--json', 'title'],
                         capture_output=True, text=True, check=True).stdout
    existing = {i['title'] for i in json.loads(out)}

phase = None
issues = []
for block in re.split(r'\n(?=##+ )', text):
    head, _, body = block.partition('\n')
    if head.startswith('## Phase'):
        phase = head[3:].split(':')[0].strip().lower().replace(' ', '-')  # "phase-0"
    elif head.startswith('### ') and phase:
        title = head[4:].replace('**parallel**', '').strip()
        labels = [phase] + (['parallel'] if '**parallel**' in head else [])
        body = body.strip() + '\n\nSee `docs/SCREENS.md` and `CLAUDE.md`.'
        issues.append((title, labels, body))

for title, labels, body in issues:
    if title in existing:
        print('skip', title)
        continue
    print('file', title, labels)
    if DRY:
        continue
    for l in labels:
        subprocess.run(['gh', 'label', 'create', l, '--force'], capture_output=True)
    cmd = ['gh', 'issue', 'create', '--title', title, '--body', body]
    for l in labels:
        cmd += ['--label', l]
    subprocess.run(cmd, check=True)
