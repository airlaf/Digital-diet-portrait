# Listening-history portrait (Spotify)

Local-only page that builds the same mosaic “data portrait” as the browser-history version, using **recently played tracks** from the **Spotify Web API**.

## What you need

1. **Spotify developer app** — [Create an app](https://developer.spotify.com/dashboard), open it, copy the **Client ID**.
2. **Redirect URI** — In the app settings, under **Redirect URIs**, add the exact URL where you open `index.html`, for example:
   - `http://127.0.0.1:5500/listening-portrait-spotify/index.html` (Live Server–style port)
   - Your deployed `https://…/index.html` in production  

   Spotify compares this **character-for-character**. If login fails silently or with “INVALID_CLIENT”, mismatch here is the usual cause.

3. **HTTPS or loopback HTTP** — Do not open `index.html` as `file://`; OAuth redirects need a normal origin.

4. **Edit** `spotify-config.js` and set:

   ```js
   window.SPOTIFY_CLIENT_ID = "your_client_id_here";
   ```

## Run locally

From the `listening-portrait-spotify` directory (inside this repo):

```bash
cd listening-portrait-spotify
python3 -m http.server 5500
```

Then open `http://127.0.0.1:5500/index.html` and register **that exact URL** as a Redirect URI for your Spotify app if you used port `5500` at the repo root.

If your dev server nests this folder in a path (for example `/listening-portrait-spotify/index.html`), the Redirect URI must use that **same path**.

## Scopes & data

- **Scope:** `user-read-recently-played` — last ~50 items per API page; the sketch requests several pages (capped) to deepen history.
- **Tokens:** Stored in **`sessionStorage`** on your machine only; there is **no backend** in this project.
- **Mosaic:** Word frequencies come from track titles, album names, and artist names (with NLP filtering + a small music-metadata stoplist).
- **Listening mix sidebar:** Derived from Spotify’s **artist genre** tags mapped into coarse buckets (electronic, hip-hop, pop, etc.). Episodes increment the **Podcasts & speech** bucket.

## Troubleshooting

- **“Set SPOTIFY_CLIENT_ID…”** — Config file not filled in or typo.
- **Login works but portrait empty** — Private listening / no plays; try “Reload listening data” after listening to a track normally.
- **Refresh / session expired** — Click **Connect Spotify** again after clearing session storage or errors starting with `token_refresh`.
