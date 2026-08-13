# Public assets

Files in this directory are served from the site root. For example,
`public/images/landing/dashboard-mockup.png` is statically imported by the
home-page hero.

## Directory structure

- `brand/` — Tradel marks, lockups, and favicon artwork.
- `fonts/<family>/` — self-hosted font files grouped by font family.
- `icons/` — small interface icons grouped by feature or surface.
- `images/articles/` — editorial and academy thumbnails.
- `images/landing/` — landing-page illustrations, device images, and QR artwork.
- `images/partners/` — press and partner logos.
- `videos/` — video assets with descriptive, version-independent names.
- `vendor/nextjs/` — unused Next.js starter assets retained for reference.

## Conventions

- Use lowercase kebab-case names.
- Prefer descriptive names over source CDN IDs or export version numbers.
- Put new files in the narrowest relevant directory; do not add assets to the
  `public/` root.
- Reference runtime assets with an absolute URL beginning at `/`.
- Import assets directly only when Next.js image metadata or asset hashing is
  needed.
