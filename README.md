# minkyung.me

Personal academic homepage of Minkyung Cho, served by GitHub Pages at
[minkyung.me](https://minkyung.me/).

Static site with no build step: one HTML page, one stylesheet, one script.
Publications and updates live in `content.json` and are rendered client-side.

## Structure

```
index.html        page skeleton and bio
content.json      publications + updates
assets/style.css  styling
assets/main.js    renders content.json into the page
assets/img/       portrait, favicon, paper figures
assets/docs/      CV (PDF, built from CV.tex with xelatex)
```

## Local preview

```sh
./serve.py        # http://localhost:8731
```

A local server is needed because the page fetches `content.json`, which the
browser blocks over `file://`.
