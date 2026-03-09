---
description: Final Launch & Leave Checklist - Validate the app for long-term maintenance-free operation
---

# 🚀 Skill: The Launch & Leave Validation

**Objective:** Validate that the HQ Movie application is completely self-sufficient, resilient to external failures (like CDN drops or API changes), and well-documented enough that a developer can return to it after years and run it immediately without complex setup.

## Workflow Steps

### 1. 🌐 Zero External Dependencies (Vendoring Check)
Verify that the app can run 100% offline without fetching scripts from CDNs.
- Check `index.html` for any `https://unpkg.com` or `https://cdnjs.cloudflare.com` links.
- If they exist, download the files (Dexie, jsPDF, html2canvas, JSZip) to a `vendor/` folder and link locally.
- Check if Google Fonts are used and implement a robust local fallback or download them.

### 2. 🔌 True Offline Mode (PWA & Service Worker)
Test the Service Worker caching and offline capabilities.
1. Start the local server: `python3 serve-nocache.py`
2. Open the app in the browser.
3. Turn off Wi-Fi / Disconnect from the internet.
4. Hard refresh the page (Ctrl+F5 / Cmd+Shift+R). The app must load normally.
5. Create a project, add local images, split audio, and export video.
6. The entire flow must work without network requests.

### 3. 💾 Data Resilience & Export
Ensure the user has control over their data outside the browser's IndexedDB.
1. Check if the "Export Project" (to `.hq` or `.zip`) feature works correctly.
2. Check if the "Import Project" feature works correctly.
3. Open DevTools -> Application -> Storage -> Clear site data.
4. Refresh the page (Dashboard should be empty).
5. Import the previously exported project. All pages, audio splits, and settings should be restored perfectly.

### 4. 🛠️ Environment Reproducibility
Verify that the development and build environment is simple and documented.
1. Read `README.md`. Are the instructions to run the project clear? (e.g., just `python3 serve-nocache.py`).
2. Verify that there is no mandatory complex build step (`npm run build`) required just to run the frontend in development/production.
3. Check `serve-nocache.py` to ensure it sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers, crucial for FFmpeg `SharedArrayBuffer` support.

### 5. 📚 "Time Capsule" Documentation
Ensure future developers (or yourself with amnesia) can understand the codebase.
- Verify `ARCHITECTURE.md` exists and explains where state, UI, and video export logic reside.
- Verify `DATA_MODEL.md` exists, explaining the Dexie.js schema and the JSON project structure.

## Success Criteria
- [ ] No CDNs in `index.html`.
- [ ] App works perfectly 100% offline.
- [ ] Projects can be exported to a physical file and imported back.
- [ ] Running the project requires zero `npm install` for the core frontend.
- [ ] Architecture and Data Model documentation are present.
- [ ] Video export works locally with correct COOP/COEP headers.
