# wubu2 site

Plain static site (no build step) hosted on GitHub Pages.

- `index.html`: landing page, logo, stream links, Spotify player
- `free.html`: free packs index + optional newsletter
- `about.html`: bio
- `assets/style.css`: colours live at the top (`--c`, `--m`, `--y`)
- `assets/main.js`: ASCII background + mouse parallax

## Editing

- **Logo**: replace `assets/logo.svg` (or drop in `logo.png` and change the `<img src>` in `index.html`).
- **Packs**: one `<section class="win pack">` per pack in `free.html`. Zips go on a GitHub Release (`gh release create <tag> pack.zip`), not in the repo.
- **Newsletter**: add the signup URL from Buttondown/Mailchimp/etc. as `action="..."` on the form in `free.html`. Until then it shows "coming soon".
- **Socials**: footer block at the bottom of each page.

## Custom domain

Add the domain under repo Settings -> Pages -> Custom domain, then point DNS at GitHub Pages
(`CNAME` record to `markcastaldo.github.io` for a subdomain, or the four GitHub `A` records for an apex domain).
