import os
import firebase_admin
from firebase_admin import credentials
from dotenv import find_dotenv, load_dotenv

def get_firebase_app():
    try:
        return firebase_admin.get_app() # Check if app already initialized
    except ValueError:
        dotenv_path = find_dotenv()
        if not dotenv_path:
            raise FileNotFoundError(
                "Could not find the .env file. "
                "Ensure it is in your project root directory."
            )
        
        load_dotenv(dotenv_path)

        key_filename = os.environ.get('FIREBASE_KEY_FILENAME')

        if not key_filename:
            raise ValueError(
                "The FIREBASE_KEY_FILENAME variable is not set in your .env file."
            )

        project_dir = os.path.dirname(dotenv_path)
        
        # Assumes the key file is located in the backend folder.
        cred_path = os.path.join(project_dir, 'backend', key_filename)

        if not os.path.exists(cred_path):
             raise FileNotFoundError(
                 f"Firebase key file not found at the expected path: {cred_path}. "
                 "Please ensure the file exists and the FIREBASE_KEY_FILENAME in your .env is correct."
             )

        cred = credentials.Certificate(cred_path)
        return firebase_admin.initialize_app(cred)