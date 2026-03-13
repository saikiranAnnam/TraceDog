# TraceDog — public assets

Static files served as-is (e.g. by Next.js, Vite, or linked from GitHub). **Drop your logo and diagrams here.**

## Folders

| Folder | Use for |
|--------|--------|
| **`icons/`** | Favicons, app icons, small UI marks (`.ico`, `.png`, `.svg`). |
| **`images/`** | Full logo, wordmark, hero images, screenshots. |
| **`images/architecture/`** | System diagrams, data-flow, deployment drawings. |

## Suggested filenames (optional)

| File | Purpose |
|------|--------|
| `icons/favicon.ico` | Browser tab |
| `icons/favicon.svg` | Scalable favicon |
| `icons/icon-512.png` | PWA / app icon |
| `images/tracedog-logo.svg` | Primary logo |
| `images/tracedog-wordmark.svg` | Text logo |
| `images/architecture/system-overview.png` | High-level architecture |
| `images/architecture/data-flow.svg` | Pipeline / trace flow |

Use whatever names you prefer—this repo just keeps **icons** vs **images** vs **architecture** separated so docs and the dashboard can link predictably.

## Using in README (example)

```markdown
![TraceDog](public/images/tracedog-logo.svg)
![Architecture](public/images/architecture/system-overview.png)
```

*(GitHub renders paths relative to the repo root.)*
