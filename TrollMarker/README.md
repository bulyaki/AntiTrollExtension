# TrollMarker Extension

This extension highlights specific profile names on Facebook. It works across Chrome, Edge, Firefox, and Safari using Manifest V3.

## Installation Instructions

### Google Chrome & Microsoft Edge
1. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. Enable **Developer mode** (toggle in the top right or bottom left).
3. Click **Load unpacked**.
4. Select the `TrollMarker` directory.
5. You can now pin the extension to your toolbar, click the icon, and add names to highlight!

### Mozilla Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file inside the `TrollMarker` directory.
4. The extension is now active for this session! To package it permanently, you can zip the directory contents and submit it to the Firefox Add-on Developer Hub.

### Apple Safari
Safari requires a web extension to be packaged inside a native macOS app via Xcode.
1. Open Terminal and run the official Apple Safari converter tool against this directory:
   ```bash
   xcrun safari-web-extension-converter /path/to/TrollMarker
   ```
2. Xcode will open with an automatically generated project wrapper.
3. Build and Run the project (`Cmd + R`).
4. Safari will launch. Go to Settings > Extensions and enable the `TrollMarker` extension.
**(Note: You may need to enable "Allow Unsigned Extensions" in Safari's Develop menu if you aren't using an Apple Developer account).**
