import os

html_path = r"f:\Codes\web-app\quantum-qbit\index.html"
with open(html_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Indexing starts from 0 in Python.
# Line 44 in 1-based index is line 43 in 0-based index.
# Line 48 in 1-based index is line 47 in 0-based index.
# We want the content inside <script> (lines 45-47 in 1-based, which is 44-46 in 0-based index)
script_content = "".join(lines[44:47])

print("Line 43 (0-based 42):", repr(lines[42]))
print("Line 44 (0-based 43):", repr(lines[43]))
print("Line 48 (0-based 47):", repr(lines[47]))

scripts_dir = r"f:\Codes\web-app\quantum-qbit\public\scripts"
os.makedirs(scripts_dir, exist_ok=True)

js_path = os.path.join(scripts_dir, "hilltop-popup.js")
with open(js_path, "w", encoding="utf-8") as f:
    f.write(script_content)

print("Extracted script and saved to:", js_path)
