# PM VibeKit

A tiny, **useful** Product Manager toolbox you can run locally or deploy to GitHub Pages.

- ✳️ **RICE/ICE Prioritization** — sortable table, inline editing, JSON import/export, one-click **Markdown/CSV** export.
- 🧾 **PRD Generator** — fill concise fields → export **Markdown PRD** with live preview.
- 🗂️ **Local‑first** — no backend, all data in your browser.

https://user-images.githubusercontent.com/placeholder/demo.gif

## Quickstart

```bash
npm i
npm run dev
```

> First time setup?
>
> ```bash
> npm install
> npm run dev
> ```

### Import sample data

Go to **Prioritize → Import JSON** and pick `data/mock-prioritization.json`.

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages )

Option 1 — via npm script:
```bash
# one-time: set the homepage & repo in package.json if you fork
npm run deploy
```

Option 2 — GitHub Actions (recommended):
Create `.github/workflows/deploy.yml` with the content in this repo, then push to `main`. It will build and publish to Pages automatically on every push to main.

## Screenshots

> Add your screenshots/gif here. Some suggested shots:
> - Prioritization table with RICE mode
> - Export menu (MD/CSV)
> - PRD Generator filled + Preview pane

## Why this exists

I wanted a **practical PM companion** that:
- helps me prioritize ideas quickly (RICE/ICE),
- turns meeting notes into a clean **PRD** in minutes,
- and can be shown off as a simple, open-source repo.

## Roadmap

- [ ] Shareable URLs (encode state in querystring)
- [ ] Team presets for RICE weights / impact scale
- [ ] Export PRD as **PDF** (client-side)
- [ ] Confluence / Notion copy helpers
- [ ] Dark/Light theme toggle

## Contributing

PRs welcome! If you add features, keep it **local-first** and **zero-config**.

1. Fork → create a feature branch
2. `npm run dev` and hack away
3. Add a short demo gif in the PR

## Tech

- React + TypeScript + Vite
- TailwindCSS
- No server, no database

## License

[MIT](./LICENSE)