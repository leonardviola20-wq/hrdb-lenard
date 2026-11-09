# Arya Persian Restaurant - Landing Page

Static HTML/CSS/JS landing page. No build step required.

## Run locally
Open `index.html` in any browser, or serve the folder:

```powershell
cd "d:\VSCode\Landing Page"
python -m http.server 8080
```
Then visit http://localhost:8080

## Edit content (admin in office)
- **Full menu (PDF)**: `assets/menu.pdf` (official, latest). Embedded + downloadable on the Menu page.
- **Curated highlights**: `data/menu.json` (subset for the HTML menu). Keep in sync with the PDF when prices change.
- **Branches**: edit `data/branches.json` (name, address, phone, hours, map link).
- **Photos**: replace `Sample.png`, `Sample - Copy.png`, `Sample.bmp` with your own and keep filenames, or update references in `index.html`.
- **Reservations email**: change `reservations@aryapersianrestaurant.com` in `js/main.js`.
- **Colors/text**: `css/styles.css` and `index.html`.

## Deploy
Drop the whole folder on any static host: GitHub Pages, Netlify, Vercel, Apache, Nginx. No Node required.

## Notes
- Menu/branch data sourced from public listings; verify prices with the restaurant before publishing.
- For a login-protected CMS, migrate to a backend stack (Next.js + DB) as a separate project.
