# AD Aerospace — website redesign (static showcase)

Redesign of the AD Aerospace website, aircraft video surveillance systems for civil aviation. This repository is a static copy of the finished WordPress build, so it can be browsed without a server (GitHub Pages).

**Live demo:** `https://<username>.github.io/<repository>/`

## What the site includes

- 48 pages: home, about, products, systems, LRUs with category filters and spec sheets, aircraft pages, 4K IP camera page, certificates, resources, contact
- Interactive aircraft hotspot map and a 3D camera viewer (Three.js, GLB model)
- Self-hosted video with poster images, no third-party embeds
- Responsive layout, keyboard-accessible navigation and focus states, built toward WCAG 2.0 A
- Self-hosted fonts (Montserrat, Lato) with `font-display` handling, WebP images with `srcset`
- Single hand-written stylesheet and one small script, no front-end framework

## How it was built

The live site runs on WordPress with a custom theme and a custom-post-type content plugin, so the client edits every page, product and document from the admin. This repository contains only the rendered output of that build.

- Stack: WordPress, custom theme (PHP templates, one CSS file, vanilla JS), Secure Custom Fields, Polylang (EN / 中文 / Русский / العربية on the live site)
- Front-end: CSS custom properties, CSS grid and flexbox, RTL-aware styles, Three.js for the camera viewer

## Notes on this copy

- The 3D viewer needs a browser with WebGL. It also works when `index.html` is opened straight from disk.
- Forms (brochure request, contact) are switched off here because there is no back end.
- Language switcher: the home page is available in English, 中文, Русский and العربية (RTL). In this copy the other pages are English only, so choosing a language on any page opens the translated home page.
- All text, images, videos and brand assets belong to AD Aerospace and its partners.

## Run locally

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Publish on GitHub Pages

Repository **Settings → Pages → Deploy from a branch → `main` / root**. The `.nojekyll` file is already included. All links are relative, so the site works from `https://<username>.github.io/<repository>/`.
