# Book & Table

A React/Vite website with MDX-managed page content and a development-only local editor.

## Start locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. Visit `/edit` to edit and save the MDX content in `src/content`. The editor is available only while the Vite development server is running.

## Production check

```bash
npm run build
npm run preview
```

The production build is written to `dist/`. The `/edit` route redirects to the homepage in production.

## Before launch

- Replace the temporary hero photograph with a licensed Book & Table photograph.
- Substack is connected to The Garden Dish; see `docs/substack-feed.md` for refresh commands and configuration.
- Connect the Join page to the chosen newsletter provider.
- Add real event dates and About page details in `/edit`.

## GitHub connection

If this folder is not yet a Git repository:

```bash
git init
git add .
git commit -m "Build initial Book & Table website"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

If the repository already contains files or commits, share its URL before connecting it so the histories can be reconciled safely.
