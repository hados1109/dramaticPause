# Dramatic Pause for YouTube

Pause a YouTube video and time stops. A cinematic ripple or an anime-style freeze plays over the frame. Pick the style from the toolbar button.

| Style | On pause | On play |
|---|---|---|
| Cinematic | Soft rings roll out from where you clicked (or the center) and fade to the edges | Plays normally |
| Anime | Black-and-white negative flash, snaps back, frozen halftone frame | Resume wave, colour returns |

**Works in:** Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi and other Chromium-based browsers (Manifest V3).
**Permissions:** `storage` only, to remember your on/off setting and chosen style. It runs on `youtube.com` and nowhere else.

---

## Installation

The extension isn't on the Chrome Web Store, so you install it in "unpacked" (developer) mode. It takes about a minute.

### Step 1: Get the files

**Option A: Download ZIP (easiest)**

1. At the top of this repository page, click the green **Code** button.
2. Click **Download ZIP**.
3. Unzip the file. You'll get a folder called `dramaticPause-main`.
4. Move that folder somewhere permanent, like your Documents folder.

> **Keep the folder where it is.** The browser loads the extension straight from this folder. If you delete or move it later, the extension stops working.

**Option B: Clone with Git**

```bash
git clone https://github.com/hados1109/dramaticPause.git
```

### Step 2: Load it into your browser

**Google Chrome**

1. Type `chrome://extensions` into the address bar and press Enter.
2. Turn on **Developer mode** using the switch in the top-right corner.
3. Click **Load unpacked** (top left).
4. Select the folder from Step 1: the one that has `manifest.json` directly inside it.
5. "Dramatic Pause for YouTube" now appears in your extensions list.

**Microsoft Edge**

1. Go to `edge://extensions`.
2. Turn on **Developer mode** (in the left sidebar, or at the bottom of the page).
3. Click **Load unpacked** and select the folder.

**Brave / Opera / Vivaldi**

Same steps as Chrome, using `brave://extensions`, `opera://extensions` or `vivaldi://extensions`.

### Step 3: Pin it and try it

1. Click the puzzle-piece icon in the toolbar and click the pin next to **Dramatic Pause**.
2. Open any YouTube video (if a YouTube tab was already open, refresh it).
3. Pause the video and watch the effect.
4. Click the toolbar icon to turn the effect on or off, switch between **Cinematic** and **Anime**, or preview a style with the eye icon.

---

## Updating

1. Get the new files: run `git pull` in the folder, or download the ZIP again and replace the old folder's contents.
2. Open `chrome://extensions` (or your browser's equivalent).
3. Click the circular **reload** arrow on the Dramatic Pause card.
4. Refresh any open YouTube tabs.

## Uninstalling

Open `chrome://extensions`, click **Remove** on the Dramatic Pause card, then delete the folder.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Manifest file is missing or unreadable" | You picked the wrong folder. Choose the one with `manifest.json` directly inside, not a parent folder. |
| Nothing happens when I pause | Refresh the YouTube tab after installing. Check the toolbar popup to make sure the effect is switched on. |
| No effect on some videos | Protected videos (rented films, some paid content) and ads are skipped on purpose. See Known limits. |
| Browser warns about developer-mode extensions | This is normal for extensions installed unpacked. Keep them enabled, or dismiss the warning. |
| Extension disappeared | The folder was probably moved or deleted. Put it back, or load it again from its new location. |

---

## How it works

- `content.js` runs on youtube.com. When the main video pauses, it lays a WebGL canvas exactly over YouTube's picture (inside the player, under the controls and captions) and draws the effect from the live video frame. The canvas is hidden whenever no effect is on screen.
- The canvas lives inside YouTube's player, so it follows theater mode, full screen and the mini player. Ring sizes scale with the picture width (tuned for 720 px), and an effect in progress carries over when the player changes size.
- Clicks always go to YouTube; the extension only listens. YouTube waits about 0.2 s after a click on the video before it pauses (in case it's a double-click for full screen), so the effect starts on the click itself and the pause lands under it. Anime's resume wave works the same way when you click a frozen video. A double-click cancels either one, since YouTube goes full screen instead.
- `popup.html` turns the effect on or off, picks the style, and previews each style over the popup itself (eye icon) without selecting it. Settings sync through `chrome.storage.sync`; the popup uses bundled fonts (Bodoni Moda, IBM Plex Mono and a small Dela Gothic One subset, all under the SIL Open Font License).

## Project structure

```
├── manifest.json       Extension manifest (MV3)
├── content.js          Effect engine injected into YouTube
├── content.css         Styles for the effect overlay
├── popup.html          Toolbar popup
├── popup.css
├── popup.js            Popup settings logic
├── popup-effect.js     Style previews inside the popup
├── icons/              16, 32, 48 and 128 px icons
├── fonts/              Bundled popup fonts (Bodoni Moda, IBM Plex Mono, Dela Gothic One subset)
└── docs/               Landing page with a live demo (not part of the extension)
```

## Website

`docs/` holds the landing page. Its demo runs the real effect on a looping video. To preview it:

```bash
python3 -m http.server 4321 --directory docs
```

Then open http://localhost:4321. GitHub Pages can serve the site straight from the `docs/` folder on `main`.

- `docs/content.js` and `docs/content.css` are copies of the extension's files. The demo player is marked up like YouTube's, so the script runs unchanged. Copy them again after changing the effect.
- The download buttons and the Chrome Web Store link are placeholders until the builds exist. Set them in `LINKS` at the top of `docs/site.js`.
- Demo footage: "Vibrant Shibuya Crossing in Tokyo" by Nightingale on [Pexels](https://www.pexels.com/video/vibrant-shibuya-crossing-in-tokyo-28783675/), used under the Pexels license.

## Known limits

- Protected videos (rented films, some paid content) can't be read by the browser, so they're left untouched. Ads are skipped too.
- Shorts and YouTube players embedded on other sites aren't covered yet.
- Browser picture-in-picture shows YouTube's plain video; the effect stays in the page.
- Firefox and Safari aren't supported.

---

Made by [Vinyas Pandey](https://vinyas.me/). YouTube is a trademark of Google LLC; this project isn't affiliated with or endorsed by Google.
