# Striped McCoy site

Plain static site (no build step) hosted on GitHub Pages.

- `index.html`: landing page, logo, stream links, Spotify player
- `free.html`: free packs index + optional newsletter
- `about.html`: bio + discography
- `assets/style.css`: colours live at the top (`--c`, `--m`, `--y`)
- `assets/main.js`: ASCII background + mouse parallax

## Editing

- **Logo**: replace `assets/logo.svg` (or drop in `logo.png` and change the `<img src>` in `index.html`).
- **Packs**: one `<tr>` per pack in `free.html`. Put zips in a `packs/` folder (each under 100MB) or link to Drive/Dropbox.
- **Newsletter**: add the signup URL from Buttondown/Mailchimp/etc. as `action="..."` on the form in `free.html`. Until then it shows "coming soon".
- **Socials**: footer block at the bottom of each page.

## Custom domain

Add the domain under repo Settings -> Pages -> Custom domain, then point DNS at GitHub Pages
(`CNAME` record to `markcastaldo.github.io` for a subdomain, or the four GitHub `A` records for an apex domain).
