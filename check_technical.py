import pathlib

fpath = r"d:/VSCode/hrdb-lenard/TECHNICAL.md"
d = pathlib.Path(fpath).read_text(encoding="utf-8", errors="replace")

# Check for remaining mojibake
mojibake_count = d.count("â€—")
print(f"Remaining â€— (mojibake): {mojibake_count}")

# Check for proper em-dash
em_dash_count = d.count("—")
print(f"Proper — (em-dash) count: {em_dash_count}")