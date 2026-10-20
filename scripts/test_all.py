"""
Full system verification test for AURA.
Runs backend integration suite and checks desktop build.
"""
import sys
import subprocess
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent

def run_step(name: str, cmd: list, cwd: Path):
    print(f"\n[Running Step] {name}...")
    res = subprocess.run(cmd, cwd=str(cwd), text=True)
    if res.returncode != 0:
        print(f"FAILED: {name} exited with code {res.returncode}")
        sys.exit(res.returncode)
    print(f"PASSED: {name}")

if __name__ == "__main__":
    print("=" * 60)
    print("AURA FULL VERIFICATION SUITE")
    print("=" * 60)
    
    # 1. Backend Integration Tests
    run_step("Backend Unit & Integration Tests", [sys.executable, "backend/tests/test_backend.py"], root_dir)
    
    # 2. Frontend TypeScript Typecheck
    run_step("Frontend TypeScript Type Check", ["npm.cmd", "run", "type-check"], root_dir / "apps" / "desktop")
    
    # 3. Frontend Vite Build
    run_step("Frontend Vite & Electron Build", ["npm.cmd", "run", "vite:build"], root_dir / "apps" / "desktop")

    print("\n" + "=" * 60)
    print("ALL AURA VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
