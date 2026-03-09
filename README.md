# FB Name Marker Extension

This extension highlights specific profile names on Facebook. It works across Chrome, Edge, Firefox, and Safari using Manifest V3.

## Installation Instructions

### Google Chrome & Microsoft Edge
1. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. Enable **Developer mode** (toggle in the top right or bottom left).
3. Click **Load unpacked**.
4. Select the `fb-name-marker` directory.
5. You can now pin the extension to your toolbar, click the icon, and add names to highlight!

### Mozilla Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file inside the `fb-name-marker` directory.
4. The extension is now active for this session! To package it permanently, you can zip the directory contents and submit it to the Firefox Add-on Developer Hub.

### Apple Safari
Safari requires a web extension to be packaged inside a native macOS app via Xcode.
1. Open Terminal and run the official Apple Safari converter tool against this directory:
   ```bash
   xcrun safari-web-extension-converter /path/to/fb-name-marker
   ```
2. Xcode will open with an automatically generated project wrapper.
3. Build and Run the project (`Cmd + R`).
4. Safari will launch. Go to Settings > Extensions and enable the `FB Name Marker` extension.
**(Note: You may need to enable "Allow Unsigned Extensions" in Safari's Develop menu if you aren't using an Apple Developer account).**

---

# FB Név Kiemelő Bővítmény (FB Name Marker Extension)

Ez a bővítmény meghatározott profilneveket emel ki a Facebookon. Működik Chrome, Edge, Firefox és Safari böngészőkben a Manifest V3 használatával.

## Telepítési útmutató

### Google Chrome és Microsoft Edge
1. Nyissa meg a böngészőt, és navigáljon a bővítmények vagy kiegészítők oldalra:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
2. Engedélyezze a **Fejlesztői módot** (Developer mode - kapcsoló a jobb felső vagy a bal alsó sarokban).
3. Kattintson a **Kicsomagolt bővítmény betöltése** (Load unpacked) gombra.
4. Válassza ki a bővítmény mappáját (például a `TrollMarker` mappát).
5. Most már rögzítheti a bővítményt az eszköztárra, rákattinthat az ikonra, és hozzáadhatja a kiemelni kívánt neveket vagy profil linkeket!

### Mozilla Firefox
1. Nyissa meg a Firefoxot, és navigáljon az `about:debugging#/runtime/this-firefox` oldalra.
2. Kattintson az **Ideiglenes kiegészítő betöltése...** (Load Temporary Add-on...) gombra.
3. Válassza ki a `manifest.json` fájlt a bővítmény mappáján belül.
4. A bővítmény most már aktív ebben a munkamenetben! A végleges telepítéshez tömörítheti a mappa tartalmát (zip formátumban), és beküldheti a Firefox Add-on Developer Hubba.

### Apple Safari
A Safari megköveteli, hogy a webes kiegészítő egy natív macOS alkalmazásba legyen csomagolva az Xcode segítségével.
1. Nyissa meg a Terminált, és futtassa a hivatalos Apple Safari konvertáló eszközt ezen a mappán:
   ```bash
   xcrun safari-web-extension-converter /utvonal/a/bovitmenyhez
   ```
2. Az Xcode ezután megnyílik egy automatikusan generált projekt kerettel.
3. Építse fel és futtassa a projektet a `Cmd + R` billentyűkombinációval.
4. A Safari elindul. Menjen a Beállítások > Bővítmények (Settings > Extensions) menübe, és engedélyezze az `FB Name Marker` bővítményt.
**(Megjegyzés: Előfordulhat, hogy engedélyeznie kell az "Aláíratlan kiegészítők engedélyezése" opciót a Safari Fejlesztés menüjében, ha nem rendelkezik Apple Developer fiókkal).**
