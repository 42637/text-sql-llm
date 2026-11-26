"""
TextSQL-GPT Application Launcher.
Starts the FastAPI backend and serves the compiled React production frontend.
Automatically handles port conflicts and opens the browser.
"""
import os
import sys
import time
import socket
import webbrowser
import threading
import uvicorn


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0


def kill_process_on_port(port: int):
    """Frees the port if an orphan process is holding it on Windows."""
    if sys.platform == "win32":
        try:
            import subprocess
            cmd = f'netstat -ano | findstr :{port}'
            output = subprocess.check_output(cmd, shell=True).decode()
            for line in output.strip().splitlines():
                parts = line.split()
                if len(parts) >= 5 and "LISTENING" in line:
                    pid = parts[-1]
                    if pid and pid != str(os.getpid()):
                        print(f"Terminating conflicting process PID {pid} on port {port}...")
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                        time.sleep(1)
        except Exception:
            pass


def open_browser_delayed(url: str, delay: float = 1.5):
    def _open():
        time.sleep(delay)
        webbrowser.open(url)
    t = threading.Thread(target=_open, daemon=True)
    t.start()


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")

    port = 8000
    host = "0.0.0.0"

    print("=" * 65)
    print("  TextSQL-GPT — Natural Language to SQL AI Studio")
    print("  Loaded strictly from local checkpoint: phase16E_step_38007.pt")
    print("  Exact Architecture: 34,423,808 parameters (8 layers, 8 heads)")
    print("=" * 65)

    if is_port_in_use(port, "127.0.0.1"):
        print(f"Port {port} is in use. Freeing port...")
        kill_process_on_port(port)
        time.sleep(1)

    url = f"http://127.0.0.1:{port}"
    print(f"\n[OK] Local Access URL:   http://localhost:{port} (or {url})")
    print(f"[OK] Network Access URL: http://192.168.10.57:{port} (for Mobile / Tablet)")
    print("[OK] Opening web browser...\n")
    open_browser_delayed(url, 2.0)

    uvicorn.run(
        "app:app",
        app_dir=backend_dir,
        host=host,
        port=port,
        log_level="info",
    )
