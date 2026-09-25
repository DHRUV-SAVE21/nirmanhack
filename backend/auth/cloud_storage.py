import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from cryptography.fernet import Fernet
import sys
import base64

load_dotenv()

class CloudinaryManager:
    def __init__(self):
        self.cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        self.api_key = os.getenv("CLOUDINARY_API_KEY")
        self.api_secret = os.getenv("CLOUDINARY_API_SECRET")
        self.encryption_key = self.get_encryption_key()
        self.cipher = Fernet(self.encryption_key)
        
    def configure(self):
        try:
            print("  Configuring Cloudinary...")
            if not all([self.cloud_name, self.api_key, self.api_secret]):
                 print(" Cloudinary credentials missing in environment variables")
                 return False

            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret
            )
            print(" Cloudinary configured successfully!")
            return True
        except Exception as e:
            print(f" Cloudinary configuration failed: {e}")
            return False
    
    def get_encryption_key(self):
        # First try to get from environment variable (BEST for production)
        env_key = os.getenv("ENCRYPTION_KEY")
        if env_key and env_key.strip():  # Check if not empty
            try:
                return env_key.encode() if isinstance(env_key, str) else env_key
            except Exception:
                pass  # Fall through to file-based key
            
        # Fallback to local file (OK for local dev)
        key_file = os.path.join("core", "encryption.key")
        try:
            if os.path.exists(key_file):
                with open(key_file, 'rb') as f:
                    return f.read()
            else:
                key = Fernet.generate_key()
                # Only write to file if we can (might fail in read-only file systems)
                try:
                    with open(key_file, 'wb') as f:
                        f.write(key)
                    print(" New encryption key generated and saved locally")
                except Exception:
                    print(" Could not save encryption key locally (read-only filesystem?)")
                    print(f" SAVE THIS KEY TO YOUR ENV VARS: {key.decode()}")
                return key
        except Exception as e:
            print(f" Encryption key error: {e}")
            # DANGEROUS fallback: generate new key every time (data loss on restart)
            return Fernet.generate_key()
    
    def encrypt_image(self, image_data):
        try:
            encrypted_data = self.cipher.encrypt(image_data)
            return encrypted_data
        except Exception as e:
            print(f" Image encryption failed: {e}")
            return None
    
    def decrypt_image(self, encrypted_data):
        try:
            decrypted_data = self.cipher.decrypt(encrypted_data)
            return decrypted_data
        except Exception as e:
            print(f" Image decryption failed: {e}")
            return None
    
    def upload_encrypted_face(self, user_id, image_data):
        try:
            print(f" Encrypting and uploading face for user {user_id}...")
            
            encrypted_data = self.encrypt_image(image_data)
            if not encrypted_data:
                return None
            
            encrypted_filename = f"encrypted_faces/{user_id}_face.enc"
            
            upload_result = cloudinary.uploader.upload(
                encrypted_data,
                public_id=encrypted_filename,
                resource_type="raw",
                folder="face_auth",
                overwrite=True
            )
            
            print(f" Encrypted face uploaded directly to Cloudinary for user {user_id}")
            return {
                "secure_url": upload_result["secure_url"],
                "public_id": upload_result["public_id"],
                "format": "encrypted"
            }
        except Exception as e:
            print(f" Face upload failed: {e}")
            return None
    
    def download_and_decrypt_face(self, public_id):
        try:
            print(f" Downloading and decrypting face from Cloudinary: {public_id}")
            
            download_result = cloudinary.api.resource(public_id, resource_type="raw")
            encrypted_url = download_result["secure_url"]
            
            import requests
            response = requests.get(encrypted_url)
            encrypted_data = response.content
            
            decrypted_data = self.decrypt_image(encrypted_data)
            return decrypted_data
        except Exception as e:
            print(f" Face download/decryption failed: {e}")
            return None

cloudinary_manager = CloudinaryManager()
