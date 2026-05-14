# 🎵 Music SmartLink

A premium, cinematic smart-link landing page for musicians — comparable to Linkfire, Feature.fm, and Universal Music Group campaign pages.

Built with **React 19**, **Vite**, **Tailwind CSS**, and **Framer Motion**. Fully static, deployable to GitHub Pages, Netlify, or Vercel in minutes.

---

## ✨ Features

- **JSON-driven** — all content loaded from a remote or local config file
- **Google Drive config support** — update your campaign without redeploying
- **Cinematic dark aesthetic** — glassmorphism, gradient orbs, mouse parallax
- **Framer Motion animations** — staggered entrances, hover lifts, glow pulses
- **Instagram-safe navigation** — `window.location.href` triggers the native "Open in app?" prompt
- **Mobile-first** — optimised for in-app browsers (Instagram, TikTok, Facebook)
- **Accessible** — ARIA labels, keyboard navigation, reduced-motion support
- **SEO-ready** — Open Graph + Twitter Card meta tags injected dynamically

---

## 🚀 Quick Start

### 1. Create the project

```bash
# Clone this repo or create a new Vite project
git clone https://github.com/YOUR_USERNAME/music-smartlink.git
cd music-smartlink

# Install dependencies
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Configuration

All page content is defined in a JSON file. By default it loads from `public/config.json`.

### Local config (default)

Edit `public/config.json`:

```json
{
  "bandName": "Your Band Name",
  "tagline": "New Album — Out Now",
  "description": "Your band bio or release description here.",
  "heroImage": "https://example.com/album-cover.jpg",
  "backgroundImage": "https://example.com/background.jpg",
  "theme": {
    "accentColor": "#c9a96e",
    "backgroundOverlay": "rgba(4,4,12,0.82)"
  },
  "links": [
    {
      "title": "Listen on Spotify",
      "url": "https://open.spotify.com/album/YOUR_ALBUM_ID",
      "color": "#1DB954",
      "iconSvg": "<svg>...</svg>"
    }
  ]
}
```

### Google Drive config (remote)

1. Upload your `config.json` to Google Drive
2. Right-click → **Share** → set to "Anyone with the link" → **Copy link**
3. Extract the `FILE_ID` from the URL: `https://drive.google.com/file/d/FILE_ID/view`
4. Open `src/configLoader.js` and update:

```js
const GDRIVE_FILE_ID = 'YOUR_GOOGLE_DRIVE_FILE_ID_HERE'
const GDRIVE_CONFIG_URL = `https://drive.google.com/uc?export=download&id=${GDRIVE_FILE_ID}`

// Change this line:
export const CONFIG_URL = GDRIVE_CONFIG_URL
```

Now you can update your campaign (links, artwork, copy) by editing the Google Drive file — **no redeployment needed**.

---

## 🖼 Uploading Assets

### Option A: Host on a CDN (recommended)
Upload images to [Cloudinary](https://cloudinary.com), [ImageKit](https://imagekit.io), or any static host and use the public URL in your config.

### Option B: Host with the app (GitHub Pages)
Place images in the `public/` folder and reference them as `./your-image.jpg` in the config.

### Option C: Unsplash (demo)
Use Unsplash URLs for quick prototyping: `https://images.unsplash.com/photo-ID?w=800&q=80`

---

## 🏗 Build

```bash
npm run build
```

Output is in the `dist/` folder — a fully static SPA ready for deployment.

---

## 🌐 Deploy to GitHub Pages

### Method A: Manual deploy (gh-pages)

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

# Build and deploy
npm run build
npm run deploy
```

### Method B: GitHub Actions (auto-deploy on push)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

> **Note:** If deploying to a GitHub project page (e.g. `username.github.io/music-smartlink`), update `vite.config.js`:
> ```js
> base: '/music-smartlink/'
> ```

---

## 🌐 Deploy to Netlify

1. Drag the `dist/` folder to [netlify.com/drop](https://netlify.com/drop)
2. Or connect your GitHub repo — Netlify auto-detects Vite

Build command: `npm run build`  
Publish directory: `dist`

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## 🎨 Customisation

### Theme colors
Update `accentColor` in `config.json` — all glows, borders, and highlights update automatically.

### Background overlay darkness
Adjust `backgroundOverlay` in `config.json`. Example values:
- `"rgba(4,4,12,0.75)"` — lighter, shows more background image
- `"rgba(0,0,0,0.90)"` — very dark, nearly silhouetted

### Fonts
Edit `tailwind.config.js` and the Google Fonts link in `index.html`. Current pairing:
- **Display:** Playfair Display (serif)
- **Body:** DM Sans
- **Mono:** DM Mono

---

## 📁 Project Structure

```
music-smartlink/
├── public/
│   ├── config.json          # Page content config
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AnimatedBackground.jsx
│   │   ├── DescriptionSection.jsx
│   │   ├── ErrorScreen.jsx
│   │   ├── Footer.jsx
│   │   ├── HeroSection.jsx
│   │   ├── LoadingScreen.jsx
│   │   └── SmartLinkButton.jsx
│   ├── App.jsx              # Root component + meta injection
│   ├── configLoader.js      # Fetch + validate config
│   ├── index.css            # Tailwind + global styles
│   └── main.jsx             # React entry point
├── index.html               # Shell HTML + meta tags
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 📄 License

MIT — use freely for your band, label, or project.
