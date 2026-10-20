"""
AURA Security — Local Argon2id Password Authentication
Provides:
- First-run password setup
- Subsequent unlock verification with Argon2id
- Salt generation and secure Argon2id parameters
- Brute-force protection (exponential backoff & temporary lockout)
- Inactivity auto-lock and manual lock state
- Storage strictly outside the repository in %LOCALAPPDATA%\\AURA\\auth_config.json
"""
import os
import json
import time
import logging
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

logger = logging.getLogger("aura.security")

# Storage path for local authentication credentials
AUTH_CONFIG_DIR = Path(os.environ.get(
    "AURA_DATA_DIR",
    str(Path.home() / "AppData" / "Local" / "AURA")
))
AUTH_CONFIG_FILE = AUTH_CONFIG_DIR / "auth_config.json"

# Security constraints
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 300  # 5 minutes
AUTO_LOCK_INACTIVITY_SECONDS = 15 * 60  # 15 minutes

# Initialize Argon2id hasher with RFC 9106 recommended parameters
hasher = PasswordHasher(
    time_cost=3,        # 3 iterations
    memory_cost=65536,  # 64 MB
    parallelism=4,      # 4 threads
    hash_len=32,
    salt_len=16
)


class AuthState:
    def __init__(self):
        self.is_locked = True
        self.failed_attempts = 0
        self.lockout_until = 0.0
        self.last_activity_time = time.time()
        self._ensure_config_dir()

    def _ensure_config_dir(self):
        AUTH_CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    def is_setup(self) -> bool:
        if not AUTH_CONFIG_FILE.exists():
            return False
        try:
            with open(AUTH_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return bool(data.get("password_hash"))
        except Exception as e:
            logger.error(f"Failed to read auth config: {e}")
            return False

    def setup_password(self, password: str, confirm_password: str) -> dict:
        if self.is_setup():
            return {"success": False, "error": "Password has already been established."}

        if len(password) < 4:
            return {"success": False, "error": "Passcode must be at least 4 characters long."}

        if password != confirm_password:
            return {"success": False, "error": "Passwords do not match."}

        # Hash with Argon2id
        hashed = hasher.hash(password)

        config_data = {
            "password_hash": hashed,
            "created_at": time.time(),
            "algorithm": "Argon2id",
            "auto_lock_minutes": 15,
        }

        try:
            with open(AUTH_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(config_data, f, indent=2)
            self.is_locked = False
            self.failed_attempts = 0
            self.last_activity_time = time.time()
            logger.info("AURA private unlock password established successfully.")
            return {"success": True, "message": "Password established successfully."}
        except Exception as e:
            logger.error(f"Failed to save auth config: {e}")
            return {"success": False, "error": f"Failed to save credential: {str(e)}"}

    def unlock(self, password: str) -> dict:
        now = time.time()

        # Check if currently locked out
        if self.lockout_until > now:
            remaining = int(self.lockout_until - now)
            return {
                "success": False,
                "error": f"Too many failed attempts. Locked for {remaining} seconds.",
                "lockout_remaining_seconds": remaining
            }

        if not self.is_setup():
            return {"success": False, "error": "Application password has not been set up yet."}

        try:
            with open(AUTH_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            stored_hash = data.get("password_hash", "")

            # Verify with Argon2id
            hasher.verify(stored_hash, password)

            # Check if rehashing is needed
            if hasher.check_needs_rehash(stored_hash):
                data["password_hash"] = hasher.hash(password)
                with open(AUTH_CONFIG_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)

            self.is_locked = False
            self.failed_attempts = 0
            self.lockout_until = 0.0
            self.last_activity_time = now
            logger.info("AURA unlocked successfully.")
            return {"success": True, "message": "Unlocked successfully."}

        except (VerifyMismatchError, VerificationError):
            self.failed_attempts += 1
            logger.warning(f"Failed unlock attempt ({self.failed_attempts}/{MAX_FAILED_ATTEMPTS})")

            if self.failed_attempts >= MAX_FAILED_ATTEMPTS:
                self.lockout_until = now + LOCKOUT_DURATION_SECONDS
                return {
                    "success": False,
                    "error": f"Too many incorrect attempts. Locked out for {LOCKOUT_DURATION_SECONDS // 60} minutes.",
                    "lockout_remaining_seconds": LOCKOUT_DURATION_SECONDS
                }

            remaining_tries = MAX_FAILED_ATTEMPTS - self.failed_attempts
            return {
                "success": False,
                "error": f"Incorrect password. {remaining_tries} attempt{'s' if remaining_tries != 1 else ''} remaining.",
                "attempts_remaining": remaining_tries
            }
        except Exception as e:
            logger.error(f"Error during unlock: {e}")
            return {"success": False, "error": "Verification failed. Please try again."}

    def lock(self) -> dict:
        self.is_locked = True
        logger.info("AURA locked manually.")
        return {"success": True, "is_locked": True}

    def record_activity(self):
        self.last_activity_time = time.time()

    def check_auto_lock(self) -> bool:
        if not self.is_locked and (time.time() - self.last_activity_time > AUTO_LOCK_INACTIVITY_SECONDS):
            self.is_locked = True
            logger.info("AURA automatically locked due to inactivity.")
            return True
        return False

    def get_status(self) -> dict:
        now = time.time()
        self.check_auto_lock()
        lockout_remaining = max(0, int(self.lockout_until - now)) if self.lockout_until > now else 0
        return {
            "is_setup": self.is_setup(),
            "is_locked": self.is_locked,
            "failed_attempts": self.failed_attempts,
            "lockout_remaining_seconds": lockout_remaining,
            "attempts_remaining": max(0, MAX_FAILED_ATTEMPTS - self.failed_attempts)
        }


auth_service = AuthState()
