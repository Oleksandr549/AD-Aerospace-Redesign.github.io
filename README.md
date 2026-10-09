<p align="center">
  <img width="100%"  alt="image" src="https://github.com/user-attachments/assets/4fa30873-6852-4728-aeb7-2e2ad2e2a3d3" />

</p>

# AD Aerospace: website redesign

A full redesign of the website for **AD Aerospace**, a British manufacturer of aircraft video surveillance systems for civil aviation. The brief covered a new visual identity and information architecture, a product catalogue the client can edit on their own, and a site in four languages.

**[Live demo](https://oleksandr549.github.io/AD-Aerospace-Redesign.github.io/)**

This repository is a static copy of the finished WordPress build, so it can be browsed without a server and hosted on GitHub Pages.

## Highlights

- **48 pages**: home, about, products, systems, line-replaceable units (LRUs) with category pages and spec sheets, aircraft pages, 4K IP camera, certificates, resources and contact
- **Interactive 3D viewer** of the 4K camera (Three.js, GLB model), loaded only when it scrolls into view
- **Aircraft hotspot map** that links each point on the airframe to the matching product range
- **Four languages**: English, 中文, Русский and العربية with a full right-to-left layout
- **Self-hosted media**: video, fonts, PDFs and datasheets are served from the site itself, with no third-party embeds
- **Hand-written front end**: one stylesheet and one small script, no framework

## Design and front end

- Design system built on CSS custom properties: colour, type scale, spacing and component states in one place
- CSS grid and flexbox layouts that adapt from phone to wide desktop, with RTL-aware styles for Arabic
- Montserrat and Lato served as local WOFF2 files, images as WebP with `srcset`
- Keyboard-accessible navigation, visible focus states, labelled controls and reduced-motion support, built toward WCAG 2.0 level A
- Heavy assets are loaded lazily: the 3D library and model are fetched only when the viewer is about to appear

## How it was built

The production site runs on WordPress with a custom theme and a content plugin that defines post types for systems, LRUs, aircraft, videos, documents and certificates. The client edits every page, product and document from the admin, and block patterns let them assemble new pages from the same design.

| Layer | Tools |
| --- | --- |
| CMS | WordPress, custom theme (PHP templates), custom post types |
| Fields | Secure Custom Fields |
| Languages | Polylang, with translations loaded from structured data |
| Front end | Vanilla JavaScript, CSS, Three.js |
| Hosting | Cloudways, with page and object caching |

This repository contains only the rendered output of that build.

## About this copy

- The language switcher is live on the home page, which is available in all four languages. The other pages are English only, so choosing a language anywhere opens the translated home page.
- Forms (brochure request, contact) are switched off because there is no back end here.
- The 3D viewer needs a browser with WebGL. It also works when `index.html` is opened straight from disk.
- All text, images, videos and brand assets belong to AD Aerospace and its partners.

## Author

Oleksandr Vyshnevskyi, front-end developer. [Portfolio](https://vyshnevsky.com)
