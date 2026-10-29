# Fix: songs stopped at ~30 seconds

## Cause
Jamendo’s free API often returns a **30-second preview** in the `audio` field.
Full-length audio is available in `audiodownload` only when `audiodownload_allowed` is true.

This is **not** a bug in the HTML5 player. The player was playing the URL it received.

## What we changed (only in `music.ts`)
1. **streamUrl** prefers `audiodownload` when download is allowed (full track).
2. Catalog search requests `audiodownload_allowed=true` so the list focuses on full-length tracks.

## How to apply on your deployed app
Replace this file in your project:

`artifacts/api-server/src/routes/music.ts`

Then restart / redeploy the API server (Replit, Vercel, etc.).

Keep your existing `JAMENDO_CLIENT_ID` secret.

## Limits
- Tracks that Jamendo does **not** allow for download will still only have previews (or may not appear in search after this filter).
- Full commercial streaming of all Jamendo tracks requires a commercial license from Jamendo.
