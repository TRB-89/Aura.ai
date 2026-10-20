"""
Download official SQLite precompiled command-line tools bundle from sqlite.org
"""
import urllib.request
import zipfile
import io
import os
from pathlib import Path

url = "https://www.sqlite.org/2026/sqlite-tools-win-x64-3540100.zip"
print(f"Downloading SQLite Tools bundle from: {url}")

req = urllib.request.Request(
    url,
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
)

with urllib.request.urlopen(req) as resp:
    data = resp.read()

out_dir = Path("resources") / "sqlite"
out_dir.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(io.BytesIO(data)) as z:
    for member in z.infolist():
        filename = os.path.basename(member.filename)
        # Skip directories
        if not filename:
            continue
        source = z.open(member)
        target = out_dir / filename
        with open(target, "wb") as f:
            f.write(source.read())
        print(f"  Extracted: {filename}")

print(f"\nSQLite Tools successfully installed into: {out_dir.resolve()}")
