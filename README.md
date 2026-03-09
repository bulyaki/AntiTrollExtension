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
