# ada-flo.github.io

Minkyung Cho's personal academic site. Static, no build step, no dependencies:
one HTML page, one stylesheet, one script, one JSON content file.

## Files

```
index.html        page skeleton + static prose (bio, research statement, Other)
content.json      publications + updates, the file you edit day to day
assets/style.css  all styling
assets/main.js    renders content.json into the page
assets/img/       portrait.jpg, favicon.svg, one figure per paper
assets/docs/      CV.pdf
serve.py          local dev server, never deployed
.nojekyll         tells GitHub Pages to serve assets/ untouched
```

## Local preview

```sh
./serve.py          # http://localhost:8731
./serve.py 3000     # or any port
```

A server is required. `main.js` fetches `content.json`, and opening `index.html`
straight off disk trips CORS. The page detects that case and prints a hint rather
than failing silently.

`serve.py` exists because stdlib `python3 -m http.server` sends `Last-Modified`,
so the browser 304s your edits and you refresh into a stale page. This one sends
`Cache-Control: no-store`, binds `127.0.0.1` only, and logs nothing but 4xx/5xx.

## Design references

The layout went through three versions. Recording the reasoning so it does not get
re-litigated, and so the next change is made against the same intent.

**Rejected v1, sidebar layout.** Modelled too closely on one specific site.
The tells were a sticky 1:2 sidebar, a gradient-masked scrolling news box, and
pill-shaped chips. Genre-standard elements are fine to share; those three were
that site's fingerprint, not the genre's.

**Rejected v2, narrow single column.** Correct instinct, wrong proportions. At
640px with no figures it read as one long undifferentiated scroll, nothing to
anchor the eye. Surveying live CS/NLP homepages showed the convention is wider
(well-known researcher homepages sit around 760 to 800px) and that a teaser
figure per paper is near universal in vision and ML.

**Current, cards.** Two structural ideas taken from a widely-read researcher
homepage in the same genre:

1. Every paper preview in a *fixed* aspect-ratio box. This is what makes a grid of
   heterogeneous research figures look like a grid at all. Ours range from 1.17:1
   to 3.20:1 and would otherwise stagger the rows.
2. An `Other` section for non-research life, in plain prose, instead of a
   collapsible widget.

One deliberate departure: he uses `object-fit: cover`, which is safe because his
previews are already 16:9. Ours are real paper figures, and centre-cropping one
destroys the thing it is meant to show. We use `contain` with a little padding,
so wide figures letterbox inside the box. **That letterboxing is the intended
trade, not a bug to fix.**

**No light/dark toggle.** Tried one, dropped it after surveying four reference
sites in the genre: none of them have
a toggle, they each commit to a single palette. We now do the same, light only.

**Page width 800px to 1056px, masthead is a row not a float.** At 5 papers the
2-up card grid ran 3 rows deep and felt like a long scroll before it read as a
set. Rather than add a sidebar (that is v1's mistake again) we widened `.page`
to match the reference homepage's content column (measured directly off the
page, not guessed) and turned the masthead into a flex row, portrait left and name/bio
right, instead of a small floated circle. Cards are still 2-up; they just have
much more room each, so figures that are dense (tables, Sankey diagrams) are
actually legible instead of shrinking to illegible text.

**Preview crops: maximize content, do not pad to force a ratio.** Early pass at
this widening added white canvas padding to force every thumbnail to exactly
16:9. Wrong trade: it shrank the actual figure to make room for blank space.
Better rule: crop tight to the real content (use `ImageChops.difference` against
white to find the true bounding box, not eyeballed margins), let the box
letterbox or pillarbox via `object-fit: contain` if the figure's native ratio
does not match, and set `object-position: bottom` so any gap lands above the
figure rather than splitting it top and bottom.

Top nav is genre-standard on researcher homepages; several well-known ones use one.

## Writing rules

- No em dashes anywhere, in prose or code comments. Commas or full stops instead.
- Link labels name the destination: `ACL Anthology`, `arXiv`, `OpenReview`, `Code`,
  `Models`. Never a generic `Website`, which says nothing about what you get.
- Prose is first person and plain. No throat-clearing, no "delve", no tricolons.

## Adding a publication

Entries render **in file order**, the list is not sorted. Newest first is the convention.

```json
{
  "title": "Paper title",
  "venue": "ACL 2026",
  "workshop": "Workshop on Something",
  "toappear": true,
  "award": "Best Paper Honorable Mention",
  "tags": ["pretraining", "korean"],
  "tldr": "One sentence a non-specialist could repeat back.",
  "thumb": "assets/img/paper.jpg",
  "authors": [
    { "name": "Minkyung Cho", "me": true, "cofirst": true },
    { "name": "Someone Else", "cofirst": true, "url": "https://..." },
    { "name": "KyungTae Lim" }
  ],
  "links": { "anthology": "...", "arxiv": "...", "openreview": "...",
             "pdf": "...", "doi": "...", "code": "...", "models": "...",
             "project": "...", "video": "...", "slides": "...", "poster": "..." }
}
```

Everything except `title` is optional.

- `me: true` bolds that author. Mark exactly one.
- `cofirst: true` appends `*` and reveals the "equal contribution" footnote. The
  footnote stays hidden if no author is marked.
- `award` and `toappear` render in the accent colour on the venue line.
- `tags` are free text. Each gets a colour from `.t-<slug>` in `style.css`, so a
  **new tag needs a new rule there** or it falls back to the default blue. One
  `--tag-h` hue per tag is all a rule contains.
- The title links to `anthology`, else `arxiv`, `openreview`, `pdf`, `doi`,
  `project`, else stays plain text. Order lives in `TITLE_TARGETS` in `main.js`.
- Link chip order is fixed by `LINK_ORDER` in `main.js`, not by JSON key order.

### Figures

Crop to something in the 1.5:1 to 2:1 range and export at roughly 900px wide, JPEG
quality around 80. A figure needs to survive being 380px wide on the rendered card,
so pick one with few enough elements to read at that size. A main architecture
diagram or headline result plot works; a dense multi-panel appendix figure does not.

To pull a page out of a paper PDF as an image, `sips` only ever renders page 1.
`scratchpad/pdfpage.py` from the build session worked around this by rewriting the
PDF's root `/Kids` in place, padded to the original byte length so the xref table
stays valid. Not kept in this repo. Screenshotting is fine too.

## Adding an update

```json
{ "date": "2026.08", "title": "What happened", "note": "optional trailing clause" }
```

The whole Updates section stays hidden if `news` is empty.

An update can carry links, two ways:

```json
{ "date": "...", "title": "TReX accepted", "link": "https://..." }
```

puts the link on the title. When the linkable things are named inside the note
instead, use `noteLinks`, which wraps each phrase it finds:

```json
{ "date": "...", "title": "Started my M.S.", "note": "MLP Lab, advised by Prof. X",
  "noteLinks": [ { "text": "MLP Lab", "url": "https://..." },
                 { "text": "Prof. X", "url": "https://..." } ] }
```

If `noteLinks` is present, the title stays plain even if `link` is also set.
Phrases that don't appear verbatim in the note are silently skipped.

## Content decisions

- **Two papers under anonymous review are deliberately excluded.** Do not add them, and do not name them anywhere in this repo while review anonymity holds.
- Author names are normalised to the non-KORMo spelling: SeungWoo Song,
  KyungTae Lim, HanGyeol Yoo. Note the KORMo paper itself spells three coauthors
  the other way, so the site differs from that paper's author list on purpose.
- TReX links to ACL Anthology, not OpenReview.
- Publications are accurate as of August 2026.
- The research paragraph in `index.html` is now Minkyung's own wording. It leads with
  **alignment and interpretability of language and multimodal models** and AI safety,
  not with "Korean and multilingual language models", which was the drafted version and
  undersold the actual focus. The five `tldr` lines are still drafts written from the
  papers and should end up in her voice too.
- The site says **Multimodal Language Processing Lab**, spelled out, not "MLP Lab", and
  no longer fronts "Graduate School of Culture Technology". The degree is administratively
  in Culture Technology but the research is NLP, and leading with the school misrepresented
  that. `assets/docs/CV.tex` keeps "M.S. in Culture Technology" as the formal degree line.

## CV

`assets/docs/CV.pdf` is generated from `assets/docs/CV.tex` with **`xelatex`**
(not `pdflatex`, the font loading needs it):

```sh
cd assets/docs && xelatex -interaction=nonstopmode CV.tex
```

### Font: Geist

The CV is set in **Geist**, Vercel's open-source typeface. This matches the
reference CV the layout follows, confirmed by running `pdffonts` on it, which is
why nothing else looked right. Approximating it with Helvetica Neue and then
Avenir Next both read as generic.

Geist is not a system font. On a fresh machine, install it first:

```sh
./assets/docs/install-geist.sh
```

That fetches Vercel's official release (SIL OFL) into `~/Library/Fonts`, no sudo.
`CV.tex` loads the `.otf` files by absolute path, because `fontspec` could not
resolve `Geist SemiBold` by family name even with the fonts registered in
fontconfig:

```tex
\setmainfont{Geist}[Path = /Users/flo/Library/Fonts/, Extension = .otf,
  UprightFont = Geist-Regular, BoldFont = Geist-SemiBold, ...]
```

**That `Path` is machine-specific.** Anyone else rebuilding this has to point it at
their own font directory.

**Weights matter as much as the family.** The reference CV embeds SemiBold, Medium,
Regular and ExtraLight. Setting *every* bold to SemiBold makes the page read thick
and cramped. The split we use:

- `Geist-ExtraLight` for body, which is what makes coauthor lists recede
- `Geist-Medium` as the `\bfseries` face: entry titles and paper titles
- `Geist-SemiBold` only for the name, `\cvsection` headers, and `\me`, via `\headfont`

That mapping is not guessed. `pdftohtml -xml` on the reference CV names the font
per run, and coauthor lines come back as `Geist-ExtraLight` while paper titles are
`Geist-Medium`. If author names ever look too heavy again, check the body font is
still ExtraLight rather than reaching for a gray:

```sh
pdftohtml -xml -f 1 -l 1 reference_cv.pdf out  # <fontspec> ids map runs to faces
```

Your own name is `\me`, which is `\headfont` (SemiBold) rather than `\textbf`.
`\textbf` is only Medium, and against ExtraLight body it reads as barely bold, so
the author list stops distinguishing you.

Size was matched by measurement, not by eye. `pdftotext -bbox` gives a modal word
height of **12.2pt** on the reference CV; ours was 14.2pt at `11pt`, which is what made
it feel dense. `10pt` plus `Scale = 0.94` on both faces lands exactly on 12.2pt.
`\linespread{1.10}` supplies the rest of the air. To re-check after any font change:

```sh
pdftotext -f 1 -l 1 -bbox CV.pdf out.html   # modal word height should be ~12.2
```

### Layout

An earlier pass used a serif, dense, numbered-papers format common among senior
researchers. It was rejected as too cramped. The current conventions, taken from
a student CV in the same genre:

- Sans-serif, generous vertical rhythm (`1.15em` between entries, `2.0em` before a
  section). Airy beats compact; the CV runs to 2 pages and that is fine.
- Section headers `\LARGE` bold, **indented to the content column**, no rules.
- Small gray year column at the far left (`\yearw`, 0.95in), muted `subgray`
  subsection labels, `venuegray` venue lines.
- **Education** right-aligns the institution (`\entry`, uses `\hfill`).
  **Experience and Scholarships do not**: they run inline, `\textbf{Role}, Institution`
  (`\ientry`). Mixing these up was a real bug; check the reference before changing it.
- Own name **bold** in author lists (`\me`), never underlined.
- Money reads `Granted 16M KRW ($\simeq$ 11.8K USD)`, converted at roughly
  1,350 KRW.
- `\raggedright` inside every body `minipage`. Without it, justification hyphenates
  names (`Kyung-Tae`, `Be-nign`), which looks broken.
- No paper-ID column (`P1`/`W2`-style cross-referencing); with five papers it is
  just noise.

`enumitem` and `titlesec` are **not installed** on this machine, so `\cvsection`,
`\entry`, `\ientry`, and `\paper` are hand-rolled with `minipage`. Output is
identical; do not add those packages back without checking `kpsewhich` first.

It intentionally has no phone number or date of birth, unlike the source CV it
was drafted from. Keep it that way, this file is public.

## Still to do

- [x] Rewrite the research paragraph in `index.html` in your own words
- [x] Add `assets/img/og-cover.png` (1200x630) for link previews. Generated with the
      site's own fonts and palette (Lora name, Figtree body, amber accent)
- [x] Set the real domain in `<link rel="canonical">` and the `og:` tags. The site
      lives at **minkyung.me** (bought at Porkbun, Aug 2026); the placeholder pointed
      at a `minkyungcho.github.io` that 404s
- [ ] Review the five `tldr` lines and the tag assignments

## Deploying

Push to `main`. Settings → Pages → Deploy from branch → `main` / root. The repo
must stay public, since Pages from a private repo needs a paid plan.

### Custom domain

The site serves at **https://minkyung.me** via the `CNAME` file in the repo root.
The domain is registered at Porkbun (Aug 2026, 2FA on, auto-renew on). DNS, at
Porkbun, replaces their default parking records with GitHub Pages:

```
A      @     185.199.108.153
A      @     185.199.109.153
A      @     185.199.110.153
A      @     185.199.111.153
CNAME  www   ada-flo.github.io
```

Porkbun's stock `ALIAS @ -> pixie.porkbun.com` and `CNAME * -> pixie.porkbun.com`
records must be deleted, or they answer ahead of the A records and the domain
keeps parking. After DNS resolves, Settings → Pages shows the domain check
passing; then tick **Enforce HTTPS** (the cert takes a few minutes to issue).
`ada-flo.github.io` 301-redirects to the custom domain from then on, so old links
keep working. The repo name no longer affects the URL, but there is no reason to
rename it.
