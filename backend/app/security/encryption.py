import hvac
import os
import base64
from cryptography.fernet import Fernet

vault_client = hvac.Client(
    url=os.environ['VAULT_ADDR'],
    token=os.environ['VAULT_TOKEN'],
    namespace=os.environ['VAULT_NAMESPACE'],
)

KEK_NAME = "saludhogar-kek"

FERNET_KEY = os.environ["FERNET_KEY"]
fernet = Fernet(FERNET_KEY)

def encrypt_secret(secret: str) -> str:
    return fernet.encrypt(secret.encode()).decode()

def decrypt_secret(encrypted: str) -> str:
    return fernet.decrypt(encrypted.encode()).decode()

def generate_and_encrypt_dek() -> tuple[bytes, str]:
    # Generate a new, random 256-bit key locally. This is very fast.
    plaintext_dek = Fernet.generate_key()
    
    encrypt_response = vault_client.secrets.transit.encrypt_data(
        name=KEK_NAME,
        plaintext=base64.b64encode(plaintext_dek).decode('utf-8'),
    )
    
    # Get the result from Vault. This is the "wrapped" or "enveloped" key.
    encrypted_dek = encrypt_response['data']['ciphertext']
    
    return plaintext_dek, encrypted_dek

def decrypt_dek(encrypted_dek: str) -> bytes:
    # Tell vault to decrypt the DEK.
    decrypt_response = vault_client.secrets.transit.decrypt_data(
        name=KEK_NAME,
        ciphertext=encrypted_dek,
    )
    
    dek_b64 = decrypt_response['data']['plaintext'] # Decode the Base64 plaintext response from Vault to get the raw key bytes.
    return base64.b64decode(dek_b64)

def encrypt_with_dek(plaintext: str, dek: bytes) -> str:
    # Encrypts a string value using a provided plaintext DEK.
    if not isinstance(plaintext, str):
        plaintext = str(plaintext)
    f = Fernet(dek)
    encrypted_data = f.encrypt(plaintext.encode('utf-8'))
    return base64.b64encode(encrypted_data).decode('utf-8')

def decrypt_with_dek(encrypted_b64: str, dek: bytes) -> str:
    # Decrypts a string value using a provided plaintext DEK.
    encrypted_data = base64.b64decode(encrypted_b64)
    f = Fernet(dek)
    decrypted_data = f.decrypt(encrypted_data)
    return decrypted_data.decode('utf-8')