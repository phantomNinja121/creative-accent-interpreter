#!/usr/bin/env python3
"""Read the edited Word doc back in and rewrite copy.js from it.

Usage:  python3 apply-copy-doc.py "Creative Accent Interpreter - Copy.docx"

Matches on the ID in the left column, so rows can be reordered or the doc
reformatted without breaking the import. Rows whose text is DELETE are
removed. Anything after a NOTE: marker is stripped from the value and
reported so it can be read rather than shipped.
"""
import json
import re
import sys
from pathlib import Path

from docx import Document

HERE = Path(__file__).parent
COPY_JS = HERE / "copy.js"

doc_path = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "Creative Accent Interpreter - Copy.docx"
if not doc_path.exists():
    sys.exit(f"Cannot find {doc_path}")

# ---- pull key/value pairs out of every table in the doc ----
edits, notes, deletes = {}, [], []
KEY_RE = re.compile(r"^[a-z][\w.]*$", re.I)

for table in Document(str(doc_path)).tables:
    for row in table.rows:
        if len(row.cells) < 2:
            continue
        # the ID cell may carry a red flag line underneath; the key is line 1
        key = row.cells[0].text.strip().splitlines()[0].strip() if row.cells[0].text.strip() else ""
        value = row.cells[1].text.strip()
        if not KEY_RE.match(key) or key.lower() in ("id", "id (do not change)"):
            continue
        if value.upper() == "DELETE":
            deletes.append(key)
            continue
        if "NOTE:" in value:
            value, note = value.split("NOTE:", 1)
            notes.append((key, note.strip()))
            # drop a dash/colon used only to separate the note from the text
            value = re.sub(r"[\s\u2013\u2014:;,-]+$", "", value.strip())
        # Word turns straight quotes into curly ones; put them back
        value = (value.replace("“", '"').replace("”", '"')
                      .replace("‘", "'").replace("’", "'")
                      .replace("—", ",").replace(" ", " "))
        edits[key] = value

# ---- rewrite copy.js in place, preserving comments, order and alignment ----
src = COPY_JS.read_text()
pair_re = re.compile(r'("([\w.]+)"\s*:\s*)("(?:[^"\\]|\\.)*")')

seen, changed, missing = set(), [], []


def sub(match):
    prefix, key, old = match.group(1), match.group(2), match.group(3)
    seen.add(key)
    if key in deletes:
        return match.group(0)  # handled separately below
    if key not in edits:
        missing.append(key)
        return match.group(0)
    new = json.dumps(edits[key], ensure_ascii=False)
    if new != old:
        changed.append((key, json.loads(old), edits[key]))
    return prefix + new


out = pair_re.sub(sub, src)

if deletes:
    kept = []
    for line in out.splitlines():
        m = re.match(r'\s*"([\w.]+)"\s*:', line)
        if m and m.group(1) in deletes:
            continue
        kept.append(line)
    out = "\n".join(kept) + "\n"

COPY_JS.write_text(out)

# ---- report ----
print(f"rows read from doc : {len(edits)}")
print(f"strings changed    : {len(changed)}")
for key, old, new in changed:
    print(f"  {key}\n    - {old}\n    + {new}")
if deletes:
    print(f"deleted            : {', '.join(deletes)}")
if notes:
    print("notes for me:")
    for key, note in notes:
        print(f"  {key}: {note}")
unmatched = [k for k in edits if k not in seen]
if unmatched:
    print(f"WARNING unknown ids in doc: {', '.join(unmatched)}")
if missing:
    print(f"WARNING ids in copy.js with no row in doc: {', '.join(missing)}")
