# Install Dependencies:

`npm install`

`python -m venv venv`

`.\venv\Scripts\activate`

`pip install -r requirements.txt`

OR

`pip install pywebview pyinstaller pyarmor requests`

# Start Development Server:

`npm run dev`

# Build for Production:

`npm run build`

# Obfuscate and Package Python Code:

`pyarmor gen --output dist_obfuscated main.py`

# Create Executable with PyInstaller:

`pyinstaller main.spec`

`pyinstaller main.py --onefile --windowed --icon="favicon.ico" //old, no need to use this cmd.`

# Deactivate Virtual Environment:

`deactivate`

# Run the Application:

`dist\main.exe`/
`npm run start`/
`npm run dev`/
`npm run client`
