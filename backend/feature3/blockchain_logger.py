import hashlib
import json
from datetime import datetime
from .database import db

class BlockchainLogger:
    def create_hash(self, data):
        """Generates SHA-256 hash of the data."""
        encoded = json.dumps(data, sort_keys=True).encode()
        return hashlib.sha256(encoded).hexdigest()

    def log_event(self, user_id, event_type, details):
        """Logs an event to the immutable DB ledger."""
        
        # 1. Get previous hash (User-Isolated Chain)
        history = db.get_ledger(user_id)
        previous_hash = history[0]["hash"] if history else "GENESIS_BLOCK"
        
        timestamp = datetime.utcnow().isoformat()
        
        # 2. Block Data
        event_data = {
            "timestamp": timestamp,
            "event_type": event_type,
            "details": details,
            "previous_hash": previous_hash
        }
        
        # 3. Create Hash
        event_hash = self.create_hash(event_data)
        
        # 4. Upsert to DB
        db.log_event(event_hash, user_id, event_type, details, timestamp, previous_hash)
        
        return {
            "hash": event_hash, 
            "data": event_data
        }

    def get_history(self, user_id):
        return db.get_ledger(user_id)

# Singleton instance
ledger = BlockchainLogger()
