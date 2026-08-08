# The Chandralok Palace

Ultra-premium, scroll-driven cinematic website for a fictional Indian lake-palace hotel.

**Tone:** soft + royal  
**Name:** The Chandralok Palace (Realm of the Moonlight)

Live concept · Apple product pages × Aman Resorts × royal Indian palace.

---

## Quick start

```bash
# Clone
git clone https://github.com/Gltichhhhhh-101/chandralok-palace.git
cd chandralok-palace

# Serve (required for video in most browsers)
npx serve .
# or
python3 -m http.server 8000
```

Open the URL shown (usually `http://localhost:3000`).

---

## Project structure

```
chandralok-palace/
├── index.html
├── css/styles.css
├── js/main.js
├── assets/
│   ├── video/
│   │   ├── 01-hero-aerial.mp4      (scroll-scrub)
│   │   ├── 02-arrival-gate.mp4     (scroll-scrub)
│   │   ├── 03-durbar-lobby.mp4     (loop)
│   │   ├── 04-royal-suite.mp4      (loop)
│   │   ├── 05-pool-gardens.mp4     (loop)
│   │   └── 06-night-finale.mp4     (scroll-scrub)
│   └── images/
│       ├── poster.jpg
│       └── mobile-hero.jpg
├── .gitignore
└── README.md
```

---

## Features

- Preloader with restrained gold progress line
- Custom gold-dot cursor + magnetic CTA (desktop)
- Lenis smooth scroll synced with GSAP ScrollTrigger
- Scroll-scrubbed videos (01, 02, 06) on desktop / wide viewports
- Autoplay muted loops (03, 04, 05) via IntersectionObserver
- Mobile ≤768 px: Ken Burns on hero image + frozen first-frame videos, loops still play
- `prefers-reduced-motion` fully respected
- Section indicator (01–06) that cross-fades
- Nav hides on scroll-down / reappears on scroll-up
- Soft royal typography (Fraunces + Inter)
- Sapphire `#0A0E1A` · Ivory `#F5F0E8` · Gold `#C9A96E`
- Zero layout shift (aspect-ratio reserved media)

---

## Tweaking scrub distance

In `js/main.js` find the `ScrollTrigger.create` blocks for hero / arrival / finale and change:

```js
end: "+=160%",   // longer = more scroll to finish the clip
```

Typical range: `+=120%` (snappy) → `+=200%` (slow cinematic).

---

## Optional ffmpeg re-encode

```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k -movflags +faststart -pix_fmt yuv420p output.mp4
```

Recommended: 1920×1080, H.264, 8–12 s clips.

---

## Test checklist

- [ ] Chrome desktop — scrubbing + Lenis
- [ ] Safari desktop — pinning + Lenis
- [ ] iOS Safari — mobile fallback (Ken Burns, no scrub, loops play)
- [ ] Reduced-motion OS setting — static content
- [ ] Lighthouse desktop ≥ 90 (only hero video preloaded)

---

## Stack

Vanilla HTML / CSS / JS  
GSAP 3 + ScrollTrigger (CDN)  
Lenis (CDN)  
Google Fonts (Fraunces, Inter)

No build step. GitHub Pages ready.

---

A fictional concept property — designed with quiet grandeur.
