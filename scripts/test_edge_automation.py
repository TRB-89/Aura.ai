import os
import sys
import time
import ctypes
import winreg
import subprocess
from pathlib import Path
import psutil

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

def find_edge_windows():
    edge_pids = set(
        p.info["pid"] for p in psutil.process_iter(["pid", "name"])
        if p.info.get("name") and "msedge" in p.info["name"].lower()
    )
    results = []
    def enum_cb(hwnd, _):
        if user32.IsWindowVisible(hwnd):
            pid = ctypes.c_ulong()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value in edge_pids:
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buf = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buf, length + 1)
                    title = buf.value
                    c_buf = ctypes.create_unicode_buffer(256)
                    user32.GetClassNameW(hwnd, c_buf, 256)
                    cls = c_buf.value
                    if cls == "Chrome_WidgetWin_1" and title:
                        results.append((hwnd, pid.value, title))
        return True

    WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
    return results

print("Checking existing Edge windows...")
windows = find_edge_windows()
print(f"Existing windows: {len(windows)}")

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
print(f"Launching Edge with {edge_exe} --new-window edge://newtab ...")
p = subprocess.Popen([edge_exe, "--new-window", "edge://newtab"], shell=False)
print("Spawned:", p.pid)
time.sleep(3)

windows_after = find_edge_windows()
print(f"Windows after launch: {len(windows_after)}")
for h, pid, t in windows_after:
    print(f"  -> HWND={h}, PID={pid}, Title='{t}'")
