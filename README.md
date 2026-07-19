# Tradel homepage

An Astro implementation of the supplied homepage reference, branded as
Tradel. The project is frontend-only and intentionally includes
`noindex, nofollow` metadata for local learning use.

## Run locally

```sh
npm install
npm run dev
```

Astro serves the page at `http://localhost:4321`.

## Verify

```sh
npm run check
npm run build
npm test
```

The Playwright suite covers desktop, tablet, and mobile layouts, visual
baselines, interactive controls, the four-stage scroll sequence, and the
autoplay support canvas.
