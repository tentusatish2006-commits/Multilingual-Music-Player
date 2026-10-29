# Multilingual Music Player (Aurora + Jamendo)

Full project from your zip, plus the **30-second preview fix**.

## 30-second songs — fixed

Jamendo free API often returns a **30s preview** in `audio`.
Full tracks use `audiodownload` when `audiodownload_allowed` is true.

**Already fixed in:**
`artifacts/api-server/src/routes/music.ts`

Redeploy/restart the API after you pull.

## Get the complete source on this repo

The full zip has ~190 source files. Fastest way to put them all on GitHub:

### Option A — Upload on GitHub website
1. Extract your original zip (or the clean export)
2. Open https://github.com/tentusatish2006-commits/Multilingual-Music-Player
3. **Add file → Upload files**
4. Drag folders: `artifacts`, `lib`, `scripts`, and root files (`package.json`, etc.)
5. Commit to `main`

### Option B — From computer
```bash
cd Multilingual-Music-Player
git init
git remote add origin https://github.com/tentusatish2006-commits/Multilingual-Music-Player.git
git add .
git commit -m "Full project from zip + full-length stream fix"
git branch -M main
git push -u origin main --force
```

## Secrets
Set `JAMENDO_CLIENT_ID` in Replit / host secrets.
