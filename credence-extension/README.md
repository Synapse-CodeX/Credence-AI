# CredenceAI Browser Extension

Select any text on any webpage and instantly fact-check it with your CredenceAI backend.

## How to Install

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select this `credence-extension` folder
5. The CredenceAI icon will appear in your Chrome toolbar

## How to Use

1. Make sure your backend is running: `uvicorn app.main:app --reload --port 8000`
2. Go to any webpage (Wikipedia, news, blogs, etc.)
3. Select any text you want to fact-check
4. A **"FACT CHECK"** floating button appears above your selection
5. Click it — a sidebar slides in with the full fact-check report

## Files

- `manifest.json` — Extension config
- `content.js` — Main logic (FAB + sidebar + API calls)
- `content.css` — All styles for the FAB and sidebar
- `background.js` — Service worker
- `popup.html` — Toolbar icon popup

## Notes

- Backend must be running on `http://localhost:8000`
- If you run backend on a different port, update `BACKEND_URL` in `content.js` line 3
- Allow the extension on all sites when Chrome asks for permissions
