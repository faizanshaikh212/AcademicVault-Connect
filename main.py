# In /main.py

import webview
import subprocess
import os

# 1. Define your secrets here, taken from your .env file
# This is how you securely provide them to the packaged app
SECRETS = {
    'MONGO_URI': '',
    'NODE_ENV': 'production',
    'PORT': '',
    'JWT_SECRET':'',
    'CLOUDINARY_CLOUD_NAME':'',
    'CLOUDINARY_API_KEY':'',
    'CLOUDINARY_API_SECRET':''
    # Add any other required environment variables here
}

# 2. Prepare the environment for the Node.js process
server_env = os.environ.copy()
server_env.update(SECRETS)

# Define the path to your Node.js server's main file
server_entry_file = os.path.join(os.path.dirname(__file__), 'server', 'server.js')

# 3. Start the Node.js server with the secrets in its environment
server_process = subprocess.Popen(
    ['node', server_entry_file],
    env=server_env  # Pass the environment with your secrets
)

# Define the URL your server is running on
app_url = f"http://localhost:{SECRETS['PORT']}"

if __name__ == '__main__':
    webview.create_window(
        'Academic Vault',
        app_url,
        width=1280,
        height=720
    )
    webview.start()

    # When the window is closed, stop the Node.js server
    server_process.kill()