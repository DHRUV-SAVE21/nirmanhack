import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# The key should be a 32-byte base64-encoded string
# If not present in ENV, we use a default (but in production always use ENV)
FERNET_KEY = os.getenv("FERNET_KEY", "nU9jcnQGAjZDlPzbBpy1_TH-HTccWxQTbgs0abIQh798=")

def get_cipher():
    try:
        return Fernet(FERNET_KEY.encode())
    except Exception as e:
        print(f"❌ Security Error: Invalid FERNET_KEY: {e}")
        # Return none or raise, but for this app we should always have a valid key
        return None

def encrypt_data(data: str) -> str:
    """Encrypt a string (like a Base64 image) and return the encrypted string."""
    if not data or not isinstance(data, str):
        return data
    
    # Check if it's already encrypted (optional, but good for safety)
    if data.startswith("enc_"):
        return data

    try:
        cipher = get_cipher()
        if cipher:
            encrypted_bytes = cipher.encrypt(data.encode())
            return "enc_" + encrypted_bytes.decode()
    except Exception as e:
        print(f"❌ Encryption Error: {e}")
    return data

def decrypt_data(data: str) -> str:
    """Decrypt a string if it starts with 'enc_'."""
    if not data or not isinstance(data, str) or not data.startswith("enc_"):
        return data

    try:
        cipher = get_cipher()
        if cipher:
            # Remove the 'enc_' prefix before decrypting
            encrypted_payload = data[4:]
            decrypted_bytes = cipher.decrypt(encrypted_payload.encode())
            return decrypted_bytes.decode()
    except Exception as e:
        print(f"❌ Decryption Error (Might be wrong key or corrupted data): {e}")
    return data
