# Local Runbook (Mac + Windows)

Use this when you just want to open the app again after a reboot, sleep, or closing your laptop.

## What This Is
- The site at `http://localhost:3001` is a **local dev server**.
- It only works while a terminal process is running.
- If you close your computer, you must restart the server.

## One-Time Setup (per computer)
1. Install Node.js 20+.
2. Open terminal in the project folder.
3. Run:
```bash
npm install
```

## Daily Start (Mac and Windows)
1. Open terminal in project root (`New project` folder).
2. Run:
```bash
npm run -w @mvp/web dev
```
3. Open browser to:
```text
http://localhost:3001
```

Keep that terminal window open while using the app.

## Daily Stop
In the terminal running the server, press:
- `Ctrl + C`

## If It Fails After Sleep/Reboot

### Problem: "address already in use :::3001"
Another process is still holding port 3001.

Mac/Linux:
```bash
lsof -ti :3001 | xargs kill -9
npm run -w @mvp/web dev
```

Windows PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
npm run -w @mvp/web dev
```

### Problem: page opens but looks unstyled/plain
Clear Next cache and restart:

Mac/Linux:
```bash
rm -rf apps/web/.next
npm run -w @mvp/web dev
```

Windows PowerShell:
```powershell
Remove-Item -Recurse -Force apps/web/.next
npm run -w @mvp/web dev
```

Then hard refresh browser:
- Mac Safari/Chrome: `Cmd + Shift + R`
- Windows Chrome/Edge: `Ctrl + F5`

## Quick Health Check
From project root:
```bash
npm run doctor
```

## Optional: Run on a Different Port
If you want port 3002:
```bash
npm run -w @mvp/web dev -- -p 3002
```
Then open `http://localhost:3002`.

## Important
- Do not put secrets in git.
- Localhost is only local to your machine.
- For outside access, deploy (Vercel guide: `docs/DEPLOYMENT_VERCEL.md`).
