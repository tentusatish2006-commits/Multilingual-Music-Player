# Fix: songs stopped at ~30 seconds

## Cause
Jamendo free API often returns a 30-second preview in the `audio` field.
Full-length audio is in `audiodownload` when `audiodownload_allowed` is true.

## Fix applied in music.ts
1. streamUrl prefers audiodownload when allowed
2. Search filters audiodownload_allowed=true

Redeploy the API after pulling this change.
