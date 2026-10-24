import pathlib

fpath = r"d:\VSCode\hrdb-lenard\components\SssReportsPage.tsx"
d = pathlib.Path(fpath).read_text(encoding="utf-8", errors="replace")

# Replace the mojibake sequences with proper characters
d = d.replace("â‚±", "₱")

pathlib.Path(fpath).write_text(d, encoding="utf-8")
print("Done replacing â‚± with ₱ in SssReportsPage.tsx")