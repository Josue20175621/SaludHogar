from cryptography.fernet import Fernet
import os

FERNET_KEY = os.environ["FERNET_KEY"]
fernet = Fernet(FERNET_KEY)

def encrypt_secret(secret: str) -> str:
    return fernet.encrypt(secret.encode()).decode()

def decrypt_secret(encrypted: str) -> str:
    return fernet.decrypt(encrypted.encode()).decode()
