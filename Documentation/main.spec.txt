# In main.spec

# -*- mode: python ; coding: utf-8 -*-
import os

block_cipher = None

# Custom function to collect server files, excluding .env
def get_server_files():
    data_files = []
    server_dir = 'server'
    for root, dirs, files in os.walk(server_dir):
        for file_name in files:
            source_path = os.path.join(root, file_name)
            dest_path = os.path.relpath(source_path, '.')
            if dest_path == os.path.join('server', '.env'):
                print(f"INFO: Excluding {dest_path}")
                continue
            data_files.append((source_path, os.path.dirname(dest_path)))
    return data_files

# The Analysis block, updated to include the 'bin' folder
a = Analysis(
    ['dist_obfuscated/main.py'], # Points to your scrambled script
    pathex=[],
    binaries=[],
    datas=[
        ('client/dist', 'client/dist'),
        ('node_modules', 'node_modules'),
        ('bin', 'bin')  # <-- ADD THIS LINE TO INCLUDE NODE.JS
    ] + get_server_files(),
    hiddenimports=[
        'webview',
        'requests'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Academic Vault',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='favicon.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='Academic Vault',
)