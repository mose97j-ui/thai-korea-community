## Deploy

After code changes in a session, run `npm run build` then `npm run deploy:prod` unless the user asked for no deploy.

Production: https://thai-korea-community.vercel.app

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deploy

Production URL: https://thai-korea-community.vercel.app

After user-facing code changes, commit when the user asks (or when they request auto-apply / 반영), then run:

```bash
npm run deploy:prod
```

GitHub push is optional for deploy (Vercel CLI uploads local files). Push to `origin main` when credentials are available so Vercel Git integration stays in sync.
