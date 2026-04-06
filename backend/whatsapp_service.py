import json
import os
import signal
import subprocess
import time
import io
import base64
import random
from datetime import datetime, timezone
import qrcode
from typing import Optional, List, Dict, Any


class WhatsAppService:
    """
    Thin wrapper around the whatsapp-cli binary.

    Each user has an isolated Multi-Device session stored under:
        /sessions/{user_id}/store/
    """

    def __init__(self, sessions_base_path: str = "/sessions", cli_path: str = "/usr/local/bin/whatsapp-cli", redis_url: str = None):
        self.sessions_base_path = sessions_base_path
        self.cli_path = cli_path
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://redis:6379/0")

    def get_session_dir(self, user_id: str) -> str:
        # Each user has their own storage directory
        path = os.path.join(self.sessions_base_path, str(user_id))
        os.makedirs(path, exist_ok=True)
        # 🔑 Operational Integrity: Restrict permissions to owner only (chmod 700)
        try:
            os.chmod(path, 0o700)
        except Exception:
            pass
        return path

    def _is_pid_valid(self, pid: int) -> bool:
        """
        Checks if a PID exists and belongs to the whatsapp-cli process.
        This prevents PID collision issues in Docker.
        """
        try:
            # Check if process exists
            os.kill(pid, 0)
            
            # Check process name to be sure (Linux specific)
            proc_name_path = f"/proc/{pid}/comm"
            if os.path.exists(proc_name_path):
                with open(proc_name_path, "r") as f:
                    comm = f.read().strip()
                return "whatsapp-cli" in comm
            
            return True # Fallback if /proc is not available
        except (ProcessLookupError, PermissionError):
            return False

    def run_command(self, user_id: str, command: List[str]) -> Dict[str, Any]:
        """Runs a CLI command, temporarily pausing the listen daemon if active to avoid session conflicts."""
        session_dir = self.get_session_dir(user_id)
        
        # 1. Mutex: Check if listen daemon is running and stop it temporarily
        was_listening = self.is_listen_daemon_running(user_id)
        if was_listening:
            print(f"INFO: Pausing listen daemon for user {user_id} to execute command: {command[0]}")
            self.stop_listen_daemon(user_id)
            time.sleep(0.5) # Wait for session release

        # 2. Execute ephemeral command
        full_command = [self.cli_path, "--store", session_dir] + command

        try:
            result = subprocess.run(
                full_command,
                capture_output=True,
                text=True,
                check=False,
                timeout=30,
            )
            raw_output = (result.stdout or "").strip()
            
            # Robust JSON extraction: look for the first '{' and last '}'
            start_idx = raw_output.find('{')
            end_idx = raw_output.rfind('}')
            
            if start_idx == -1 or end_idx == -1:
                return {"success": False, "error": result.stderr or f"Invalid CLI output: {raw_output}"}
            
            clean_json = raw_output[start_idx:end_idx+1]
            payload = json.loads(clean_json)
            
            if payload.get("success"):
                data = payload.get("data") or {}
                if isinstance(data, dict):
                    data["success"] = True
                return data
            else:
                return {"success": False, "error": payload.get("error") or "Unknown CLI error"}
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "CLI command timed out"}
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            # 3. Mutex: Resume listen daemon if it was running before
            if was_listening:
                print(f"INFO: Resuming listen daemon for user {user_id}")
                self.start_listen_daemon(user_id, self.redis_url)

    def is_listen_daemon_running(self, user_id: str) -> bool:
        """Checks if the listen daemon PID file exists and the process is valid."""
        session_dir = self.get_session_dir(user_id)
        lock_file = os.path.join(session_dir, "listen.pid")
        if os.path.exists(lock_file):
            try:
                with open(lock_file, "r") as f:
                    pid = int(f.read().strip())
                return self._is_pid_valid(pid)
            except Exception:
                return False
        return False

    def send_message(self, user_id: str, phone: str, message: str) -> Dict[str, Any]:
        """Simple send message command."""
        # Use --to instead of --phone as per CLI readme
        return self.run_command(user_id, ["send", "--to", phone, "--message", message])

    def send_presence(self, user_id: str, phone: str, is_typing: bool = True) -> Dict[str, Any]:
        """Sets the typing indicator for a recipient."""
        presence_type = "typing" if is_typing else "paused"
        return self.run_command(user_id, ["presence", "--to", phone, "--type", presence_type])

    def check_number(self, user_id: str, phone: str) -> Dict[str, Any]:
        """Checks if a phone number is registered on WhatsApp."""
        return self.run_command(user_id, ["check-number", "--phone", phone])

    def is_sleep_time(self) -> bool:
        """Checks if current time is within 2 AM to 7 AM sleep window."""
        now = datetime.now()
        return 2 <= now.hour < 7

    def send_message_advanced(self, user_id: str, phone: str, message: str, settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends a message with Anti-Ban tactics applied:
        1. Randomized Delays
        2. Human Simulation (Typing indicator)
        3. Sleep Cycles
        4. Dynamic Data (Unique hash)
        """
        # 1. Sleep Cycles Check
        if settings.get("sleep_cycles") == "true" and self.is_sleep_time():
            return {"success": False, "error": "System is in sleep cycle (2 AM - 7 AM). Message queued or rejected."}

        # 2. Randomized Delay (Pre-send)
        if settings.get("account_protection") == "true":
            delay = random.uniform(5, 15) # Smaller initial delay
            print(f"DEBUG Anti-Ban: Delaying for {delay:.1f}s before sending to {phone}")
            time.sleep(delay)

        # 3. Human Simulation (Typing...)
        if settings.get("account_protection") == "true":
            print(f"DEBUG Anti-Ban: Simulating typing for {phone}...")
            self.send_presence(user_id, phone, True)
            time.sleep(random.uniform(3, 5)) # Simulate typing duration
            # We don't need to explicitly stop it as sending the message usually stops it, 
            # but we can call 'paused' if we want to be safe.

        # 4. Dynamic Data / Message Variation (Final payload)
        final_message = message
        if settings.get("account_protection") == "true":
            # Use invisible random variations instead of visible timestamps
            invis_chars = ["\u200B", "\u200C", "\u200D", "\uFEFF"]
            final_message += random.choice(invis_chars) * random.randint(1, 3)

        # 5. Execute Send
        return self.send_message(user_id, phone, final_message)

    def stop_auth(self, user_id: str, deep_clean: bool = False) -> bool:
        """
        Kills any running auth process and cleans up files.
        If deep_clean is True, it removes all session data (except logs) to fix corruption.
        """
        session_dir = self.get_session_dir(user_id)
        lock_file = os.path.join(session_dir, "auth.pid")
        qr_file = os.path.join(session_dir, "qr_code.txt")
        
        # Kill process
        if os.path.exists(lock_file):
            try:
                with open(lock_file, "r") as f:
                    pid = int(f.read().strip())
                os.kill(pid, signal.SIGTERM)
                time.sleep(1.0) # Wait for cleanup
                if self._is_pid_valid(pid):
                    os.kill(pid, signal.SIGKILL)
            except (ProcessLookupError, ValueError, PermissionError):
                pass
            
            if os.path.exists(lock_file):
                os.remove(lock_file)
            
        # Clean QR file
        if os.path.exists(qr_file):
            os.remove(qr_file)
            
        if deep_clean:
            # Delete everything except auth.log to ensure a fresh start
            print(f"DEBUG: Performing deep clean for user {user_id}")
            for item in os.listdir(session_dir):
                item_path = os.path.join(session_dir, item)
                if item != "auth.log":
                    try:
                        if os.path.isfile(item_path):
                            os.remove(item_path)
                        elif os.path.isdir(item_path):
                            import shutil
                            shutil.rmtree(item_path)
                    except Exception as e:
                        print(f"DEBUG: Deep clean error: {e}")
                else:
                    # Truncate auth.log instead of deleting to keep the file
                    try:
                        with open(item_path, "w") as f:
                            f.write("")
                    except Exception as e:
                        print(f"DEBUG: Log truncation error: {e}")
            
        return True

    def get_auth_qr(self, user_id: str, force_restart: bool = False) -> Dict[str, Any]:
        """
        Polls for QR code and monitors engine health. 
        If engine is stuck or crashed, it self-heals by restarting.
        """
        session_dir = self.get_session_dir(user_id)
        # 1. NEW TOP-LEVEL PID/LOG PATHS
        log_file = os.path.join(session_dir, "auth.log")
        lock_file = os.path.join(session_dir, "auth.pid")
        qr_file = os.path.join(session_dir, "qr_code.txt")
        
        # 2. Check if process is already running via PID (Moved Up)
        is_running = False
        if os.path.exists(lock_file):
            try:
                with open(lock_file, "r") as f:
                    pid = int(f.read().strip())
                if self._is_pid_valid(pid):
                    is_running = True
                else:
                    print(f"DEBUG: Stale PID file found for pid {pid}, cleaning up.")
                    os.remove(lock_file)
            except Exception:
                if os.path.exists(lock_file): os.remove(lock_file)

        if force_restart:
            self.stop_auth(user_id)
            is_running = False
            
        # 5. Check logs for Success/Crash
        if os.path.exists(log_file):
            try:
                with open(log_file, "r") as f:
                    lines = f.readlines()[-30:]
                    log_content = "".join(lines).lower()
                    
                    if '"authenticated":true' in log_content:
                        print(f"DEBUG: Engine log shows success for {user_id}")
                        return {"success": True, "status": "connected", "message": "WhatsApp connected successfully!"}

                    fatal_keywords = ["panic:", "fatal error", "failed to login", "connection refused", "rejected", "handshake", "logged out", "stream error", "disconnected"]
                    if any(k in log_content for k in fatal_keywords):
                        print(f"DEBUG: Internal engine error detected for {user_id}. Deep cleaning...")
                        self.stop_auth(user_id, deep_clean=True)
                        is_running = False
            except Exception as e:
                print(f"DEBUG: Error reading log: {e}")

        # 6. If QR exists, check its age
        if os.path.exists(qr_file):
            mtime = os.path.getmtime(qr_file)
            if (time.time() - mtime) > 60 and not is_running:
                print(f"DEBUG: Stale QR file found for {user_id} (not running), cleaning up.")
                os.remove(qr_file)
            elif (time.time() - mtime) > 90 and is_running:
                print(f"DEBUG: Stale QR file found for {user_id} (stuck engine?), restarting...")
                self.stop_auth(user_id, deep_clean=False)
                is_running = False

        # 6. Check for timeout/stuck engine BEFORE returning QR
        if is_running:
            # If running for > 20s without a QR file, OR if QR is very old, it's likely stuck
            is_stuck = False
            if os.path.exists(lock_file):
                mtime = os.path.getmtime(lock_file)
                if (time.time() - mtime) > 40 and not os.path.exists(qr_file):
                    is_stuck = True
            
            if os.path.exists(qr_file):
                qr_mtime = os.path.getmtime(qr_file)
                if (time.time() - qr_mtime) > 90: # QR is definitely stale after 90s
                    is_stuck = True

            if is_stuck:
                print(f"DEBUG: Engine for {user_id} seems stuck. Restarting...")
                self.stop_auth(user_id, deep_clean=False)
                is_running = False

        # 7. If QR exists and not stuck, return it
        if os.path.exists(qr_file) and is_running:
            try:
                with open(qr_file, "r") as f:
                    qr_text = f.read().strip()
                
                qr = qrcode.QRCode(version=1, box_size=10, border=5)
                qr.add_data(qr_text)
                qr.make(fit=True)
                img = qr.make_image(fill_color="black", back_color="white")
                
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()
                qr_base64 = f"data:image/png;base64,{img_str}"
                
                return {"success": True, "qr": qr_base64, "status": "qr_ready"}
            except Exception as e:
                print(f"DEBUG: Error generating QR image: {e}")

        if is_running:
            return {"success": True, "status": "authenticating", "message": "Establishing connection..."}
        
        # 4. Start new background process
        print(f"DEBUG: Starting fresh WhatsApp engine for user {user_id}")
        full_command = [self.cli_path, "--store", session_dir, "auth"]
        
        try:
            # Clean start for logs and QR to avoid reading old data
            if os.path.exists(qr_file): 
                os.remove(qr_file)
                
            with open(log_file, "w") as f:
                f.write(f"--- NEW AUTH SESSION: {time.ctime()} ---\n")
                f.flush()
            
            log_f = open(log_file, "a")
            process = subprocess.Popen(
                full_command,
                stdout=log_f,
                stderr=log_f,
                start_new_session=True # Detach
            )
            
            with open(lock_file, "w") as f:
                f.write(str(process.pid))
                
            return {"success": True, "status": "starting", "message": "Engine initializing..."}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to start engine: {str(e)}"}

    def get_status(self, user_id: str) -> Dict[str, Any]:
        """
        Gets the connection status. Optimized to avoid pausing the listen daemon 
        if it's already running (as it implies a connected state).
        """
        # If the listen daemon is running, it means the session is held and connected.
        if self.is_listen_daemon_running(user_id):
            return {"success": True, "status": "connected"}

        # Otherwise, run the CLI command (which requires a temporary pause if any other process exists)
        return self.run_command(user_id, ["status"])

    def sync_session(self, user_id: str) -> Dict[str, Any]:
        """
        Sync session to detect expiration/disconnection and fetch device info.
        """
        return self.run_command(user_id, ["sync"]) # Legacy: now we use start_sync

    def start_sync(self, user_id: str) -> Dict[str, Any]:
        """Starts a background sync process for the user."""
        session_dir = self.get_session_dir(user_id)
        lock_file = os.path.join(session_dir, "sync.pid")
        log_file = os.path.join(session_dir, "sync.log")

        # Check if already running
        if os.path.exists(lock_file):
            try:
                with open(lock_file, "r") as f:
                    pid = int(f.read().strip())
                if self._is_pid_valid(pid):
                    return {"success": True, "message": "Sync already running", "pid": pid}
            except Exception:
                pass

        # Start process
        print(f"DEBUG: Starting background sync for user {user_id}")
        full_command = [self.cli_path, "--store", session_dir, "sync"]
        try:
            log_f = open(log_file, "a")
            process = subprocess.Popen(
                full_command,
                stdout=log_f,
                stderr=log_f,
                start_new_session=True
            )
            with open(lock_file, "w") as f:
                f.write(str(process.pid))
            return {"success": True, "message": "Sync started", "pid": process.pid}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def stop_sync(self, user_id: str) -> bool:
        """Stops the background sync process."""
        session_dir = self.get_session_dir(user_id)
        lock_file = os.path.join(session_dir, "sync.pid")
        if os.path.exists(lock_file):
            try:
                with open(lock_file, "r") as f:
                    pid = int(f.read().strip())
                os.kill(pid, signal.SIGTERM)
                time.sleep(0.5)
                if self._is_pid_valid(pid):
                    os.kill(pid, signal.SIGKILL)
                os.remove(lock_file)
                return True
            except Exception:
                if os.path.exists(lock_file): os.remove(lock_file)
        return False

    def start_listen_daemon(self, user_id: str, redis_url: str) -> Dict[str, Any]:
        """
        Starts a background 'listen' daemon that pushes events to Redis.
        Used for real-time Interaction Strategy.
        """
        session_dir = self.get_session_dir(user_id)
        lock_file = os.path.join(session_dir, "listen.pid")
        log_file = os.path.join(session_dir, "listen.log")

        # Stop existing if any
        self.stop_listen_daemon(user_id)

        # Start process
        print(f"DEBUG: Starting Listen Daemon for user {user_id}")
        full_command = [
            self.cli_path, 
            "--store", session_dir, 
            "listen", 
            "--redis-url", redis_url,
            "--user-id", user_id
        ]
        try:
            log_f = open(log_file, "a")
            process = subprocess.Popen(
                full_command,
                stdout=log_f,
                stderr=log_f,
                start_new_session=True
            )
            with open(lock_file, "w") as f:
                f.write(str(process.pid))
            return {"success": True, "message": "Listen daemon started", "pid": process.pid}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def stop_listen_daemon(self, user_id: str) -> bool:
        """Stops the background listen daemon."""
        session_dir = self.get_session_dir(user_id)
        lock_file = os.path.join(session_dir, "listen.pid")
        if os.path.exists(lock_file):
            try:
                with open(lock_file, "r") as f:
                    pid = int(f.read().strip())
                os.kill(pid, signal.SIGTERM)
                time.sleep(0.5)
                if self._is_pid_valid(pid):
                    os.kill(pid, signal.SIGKILL)
                os.remove(lock_file)
                return True
            except Exception:
                if os.path.exists(lock_file): os.remove(lock_file)
        return False

    def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Fetches the authenticated user's profile info (name, jid, avatar)."""
        return self.run_command(user_id, ["profile"])

    def get_chats(self, user_id: str, limit: int = 50, page: int = 0) -> Dict[str, Any]:
        """Lists chats for the user."""
        return self.run_command(user_id, ["chats", "list", "--limit", str(limit), "--page", str(page)])

    def get_contacts(self, user_id: str, query: str = "") -> Dict[str, Any]:
        """Searches or lists contacts."""
        # Use a dot to list all if no query
        q = query if query else "."
        return self.run_command(user_id, ["contacts", "search", "--query", q])

    def get_messages(self, user_id: str, chat_jid: str, limit: int = 50, page: int = 0) -> Dict[str, Any]:
        """Lists messages for a specific chat."""
        return self.run_command(user_id, ["messages", "list", "--chat", chat_jid, "--limit", str(limit), "--page", str(page)])

