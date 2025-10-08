# In /main.py

import webview
import subprocess
import os
import sys
import time
import requests

# This is a flag from the Windows API to hide the console window for a subprocess
CREATE_NO_WINDOW = 0x08000000

# --- THIS FUNCTION IS NOW UPDATED ---
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    # If the _MEIPASS attribute exists, use it. Otherwise, use the current directory.
    base_path = getattr(sys, '_MEIPASS', os.path.abspath("."))
    return os.path.join(base_path, relative_path)
# ------------------------------------

# --- Your Secrets ---
SECRETS = {
    'MONGO_URI': '',
    'NODE_ENV': 'production',
    'PORT': '',
    'JWT_SECRET': '',
    'CLOUDINARY_CLOUD_NAME': '',
    'CLOUDINARY_API_KEY': '',
    'CLOUDINARY_API_SECRET': ''
}

# --- Environment and Paths Setup ---
server_env = os.environ.copy()
server_env.update(SECRETS)

# Define paths using the resource_path function
node_executable_path = resource_path(os.path.join('bin', 'node-v22.18.0-win-x64', 'node.exe'))
server_entry_file = resource_path(os.path.join('server', 'server.js'))

# --- Start the Node.js Server ---
server_process = subprocess.Popen(
    [node_executable_path, server_entry_file],
    env=server_env,
    creationflags=CREATE_NO_WINDOW
)

# --- Start the Application Window ---
app_url = f"http://localhost:{SECRETS['PORT']}"

# --- NEW HEALTH CHECK FUNCTION ---
def is_server_ready(url):
    try:
        response = requests.get(url)
        # If we get a 200 OK, the server is ready
        if response.status_code == 200:
            print("Server is ready!")
            return True
    except requests.ConnectionError:
        # Server is not ready yet
        return False
    return False
# --------------------------------

if __name__ == '__main__':
    # --- NEW HEALTH CHECK LOOP ---
    # Wait for the server to be ready before creating the window
    while not is_server_ready(app_url):
        print("Waiting for server to start...")
        time.sleep(1) # Wait 1 second before checking again
    # ---------------------------

    webview.create_window(
        'Academic Vault',
        app_url,
        width=1360,
        height=768,
        resizable=True,
        min_size=(360, 640)
    )
    webview.start()

    server_process.kill()