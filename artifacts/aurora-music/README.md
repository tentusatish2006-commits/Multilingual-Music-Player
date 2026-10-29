# Aurora Music

Aurora Music is a responsive music discovery player for Jamendo's independent catalog. It has separate Telugu, Hindi, and English lyric-language categories, song/artist search, full-length playback, playlists, favorites, and track-level attribution.

## Configure Jamendo

1. Create a Jamendo API client for this app in the [Jamendo Developer Portal](https://devportal.jamendo.com/signup).
2. Add its client ID in Replit **Tools → Secrets** as `JAMENDO_CLIENT_ID`. Never put the value in frontend code or commit it.
3. Run the API Server and Aurora Music web workflows. Without the secret, the app displays a configuration message instead of invented tracks.

The browser calls the app API; only the API server calls Jamendo. Full-length playback uses Jamendo's download stream when allowed.

## Run and check

- Web app: `pnpm --filter @workspace/aurora-music run dev`
- API server: `pnpm --filter @workspace/api-server run dev`
- Typecheck: `pnpm run typecheck`

## Publish

Add the Jamendo secret to the deployment environment before publishing.
