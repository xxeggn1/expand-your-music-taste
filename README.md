# Expand Your Music Taste 🎧

A 10-question quiz that pulls **real, live album recommendations** from the [Last.fm API](https://www.last.fm/api) — no hand-picked album lists, no static data.

**Live demo:** _add your GitHub Pages link here after deploying_

## How it works

1. **Question 1** — pick a genre or famous subgenre (40+ options, from Rock to Shoegaze to Reggaeton).
2. **Questions 2–10** — automatic follow-ups covering era, mood, vocals, popularity, production, tempo, discovery risk, listening context, and instrumentation.
3. Your answers are turned into Last.fm tags. The site queries `tag.gettopalbums`, scores every album against your answers, verifies era against the album's own tags, and enriches the survivors with `album.getinfo` for cover art, genre, year, and description.
4. Results are capped at **3 pages, 6 albums each (18 max)**. Every card links out to Last.fm, Spotify search, and YouTube search.

## Files

| File | Purpose |
|---|---|
| `index.html` | Hero, quiz, and results |
| `credits.html` | Credits page |
| `style.css` | Design system (fonts, colors, layout, the vinyl progress disc) |
| `script.js` | Quiz logic + Last.fm API integration |

## Stack

HTML5 · CSS3 · vanilla JavaScript (ES6+) · Fetch API · SVG · [Last.fm REST API](https://www.last.fm/api) · Google Fonts (Fraunces, IBM Plex Sans, IBM Plex Mono)

No build step, no dependencies — just static files.

## Running it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## A note on the API key

`script.js` calls the Last.fm API directly from the browser, so the API key is visible in the source. That's expected for a small client-side project like this one — Last.fm read-only keys are meant to be used this way — but don't reuse this pattern for a key that needs to stay private.

## Credits

Built by **Akira / xxeggn**. Album data via Last.fm. See [`credits.html`](credits.html) for the full breakdown.
