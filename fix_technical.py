import pathlib

fpath = r"d:/VSCode/hrdb-lenard/TECHNICAL.md"
d = pathlib.Path(fpath).read_text(encoding="utf-8", errors="replace")

# Replace the em-dash mojibake sequence with proper em-dash
d = d.replace("â€—", "—")

pathlib.Path(fpath).write_text(d, encoding="utf-8")
print("Done replacing â€— with — in TECHNICAL.md")