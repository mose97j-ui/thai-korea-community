## Deploy

After code changes in a session, run `npm run build` then `npm run deploy:prod` unless the user asked for no deploy.

Production: https://thai-korea-community.vercel.app

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deploy

Production URL: https://thai-korea-community.vercel.app

After user-facing code changes, run build → deploy → git sync:

```bash
npm run build
npm run deploy:prod
git add -A && git reset -- .cursor/
git commit -m "…"
git push origin main
```

Vercel CLI deploy does not require push, but **push `main` after each deploy** so GitHub and Vercel Git stay in sync (project default). If push fails here, tell the user the commit hash and that they should run `git push origin main` locally (one-time `gh auth login` or HTTPS token may be needed).
