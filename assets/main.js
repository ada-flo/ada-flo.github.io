/* ============================================================
   Renders content.json into the page.
   Everything you edit day-to-day lives in content.json;
   this file only decides how those fields are laid out.
   ============================================================ */
(function () {
  "use strict";

  /* Name each link for what it actually is. A paper link says "arXiv" or
     "ACL Anthology", never a generic "Website". */
  var LINK_LABELS = {
    anthology:   "ACL Anthology",
    arxiv:       "arXiv",
    openreview:  "OpenReview",
    pdf:         "PDF",
    doi:         "DOI",
    code:        "Code",
    models:      "HuggingFace",
    sftData:     "SFT Data",
    midData:     "Midtraining Data",
    project:     "Project page",
    video:       "Video",
    slides:      "Slides",
    poster:      "Poster"
  };
  /* Controls the order the links appear in, regardless of JSON key order. */
  var LINK_ORDER = ["anthology", "arxiv", "openreview", "pdf", "doi",
                    "code", "models", "sftData", "midData", "project",
                    "video", "slides", "poster"];
  /* Where the title should point: the most citable version available. */
  var TITLE_TARGETS = ["anthology", "arxiv", "openreview", "pdf", "doi", "project"];

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function externalLink(href, label, className) {
    var a = el("a", className, label);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  }

  /* ---- updates ------------------------------------------- */
  /* Wrap each `noteLinks` phrase found in `text` in a link, leaving the rest as
     plain text. Phrases are linked in the order they appear; anything that
     overlaps an earlier link, or is not present at all, is skipped. */
  function linkifyNote(text, links) {
    var frag = document.createDocumentFragment();
    if (!links) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }

    var hits = [];
    links.forEach(function (l) {
      var i = text.indexOf(l.text);
      if (i !== -1) hits.push({ at: i, text: l.text, url: l.url });
    });
    hits.sort(function (a, b) { return a.at - b.at; });

    var pos = 0;
    hits.forEach(function (h) {
      if (h.at < pos) return;
      if (h.at > pos) frag.appendChild(document.createTextNode(text.slice(pos, h.at)));
      frag.appendChild(externalLink(h.url, h.text, "news-link"));
      pos = h.at + h.text.length;
    });
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    return frag;
  }

  function renderNews(items) {
    var section = document.getElementById("news");
    var list = document.getElementById("news-list");
    if (!items || !items.length) return;

    items.forEach(function (item) {
      var li = el("li", "news-item");
      var what = el("div", "what");

      /* A news item's link normally hangs off the title. `noteLinks` instead puts
         one or more links on phrases inside the note, for when the things worth
         linking are named there rather than in the title. */
      var noteLinks = item.noteLinks && item.noteLinks.length ? item.noteLinks : null;

      if (item.link && !noteLinks) {
        what.appendChild(externalLink(item.link, item.title, "news-link"));
      } else {
        what.appendChild(document.createTextNode(item.title));
      }

      if (item.note) {
        var note = el("span", "note");
        note.appendChild(linkifyNote(item.note, noteLinks));
        what.appendChild(note);
      }

      li.appendChild(what);
      li.appendChild(el("time", "when", item.date));
      list.appendChild(li);
    });

    section.hidden = false;
  }

  /* ---- one publication ----------------------------------- */
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  function renderPaper(pub) {
    var li = el("li", pub.thumb ? "paper has-thumb" : "paper");

    var target = null;
    if (pub.links) {
      TITLE_TARGETS.some(function (k) {
        if (pub.links[k]) { target = pub.links[k]; return true; }
        return false;
      });
    }

    /* 16:9 preview. The box is a fixed shape and the figure is cropped to
       fill it, so figures of any proportion line up across the grid. */
    if (pub.thumb) {
      var img = el("img");
      img.src = pub.thumb;
      img.alt = "";            /* decorative: the title beside it carries the meaning */
      img.loading = "lazy";
      if (pub.thumbmap && pub.thumbmap.length) {
        /* Regions of the figure link to their own destinations. Anchors
           can't nest, so the preview is a div with sibling overlay links:
           a full-area base link underneath, one band per region on top. */
        var mapped = el("div", "preview has-map");
        mapped.appendChild(img);
        if (target) {
          var base = externalLink(target, null, "zone zone-base");
          base.textContent = "";
          mapped.appendChild(base);
        }
        pub.thumbmap.forEach(function (z) {
          var a = externalLink(z.url, null, z.dim === false ? "zone no-dim" : "zone");
          a.textContent = "";
          a.setAttribute("aria-label", z.label || "figure link");
          a.style.top = z.top; a.style.height = z.height;
          a.style.left = z.left; a.style.width = z.width;
          mapped.appendChild(a);
        });
        li.appendChild(mapped);
      } else if (target) {
        var frame = externalLink(target, null, "preview");
        frame.textContent = "";
        frame.appendChild(img);
        li.appendChild(frame);
      } else {
        var plain = el("div", "preview");
        plain.appendChild(img);
        li.appendChild(plain);
      }
    }

    var title = el("div", "title");
    if (target) {
      title.appendChild(externalLink(target, pub.title, null));
    } else {
      title.textContent = pub.title;
    }
    li.appendChild(title);

    if (pub.tags && pub.tags.length) {
      var tags = el("div", "tags");
      tags.setAttribute("aria-label", "Categories");
      pub.tags.forEach(function (t) {
        tags.appendChild(el("span", "tag t-" + slug(t), t));
      });
      li.appendChild(tags);
    }

    /* venue line: "EMNLP 2026 - Workshop on X - To appear - Best Paper" */
    var meta = el("div", "meta");
    if (pub.venue) meta.appendChild(el("span", null, pub.venue));
    if (pub.workshop) {
      meta.appendChild(el("span", null,
        typeof pub.workshop === "string" ? pub.workshop : "Workshop"));
    }
    if (pub.toappear) meta.appendChild(el("span", "toappear", "To appear"));
    if (pub.award) meta.appendChild(el("span", "award", pub.award));
    if (meta.childNodes.length) li.appendChild(meta);

    if (pub.authors && pub.authors.length) {
      var authors = el("p", "authors");
      pub.authors.forEach(function (author, i) {
        if (i > 0) authors.appendChild(document.createTextNode(", "));
        var name = author.name + (author.cofirst ? "*" : "");
        if (author.url) {
          var link = el("a", author.me ? "me" : null, name);
          link.href = author.url;
          link.target = "_blank";
          link.rel = "noopener";
          authors.appendChild(link);
        } else {
          authors.appendChild(el("span", author.me ? "me" : null, name));
        }
      });
      li.appendChild(authors);
    }

    if (pub.tldr) {
      var tldr = el("p", "tldr");
      tldr.appendChild(el("b", null, "TL;DR:"));
      tldr.appendChild(document.createTextNode(" " + pub.tldr));
      li.appendChild(tldr);
    }

    if (pub.links) {
      var actions = el("p", "links-row");
      LINK_ORDER.forEach(function (key) {
        if (pub.links[key]) {
          actions.appendChild(
            externalLink(pub.links[key], LINK_LABELS[key] || key, null));
        }
      });
      if (actions.childNodes.length) li.appendChild(actions);
    }

    return li;
  }

  function renderPapers(pubs) {
    var section = document.getElementById("papers");
    var list = document.getElementById("paper-list");
    if (!pubs || !pubs.length) return;

    var anyCofirst = false;
    pubs.forEach(function (pub) {
      list.appendChild(renderPaper(pub));
      if (pub.authors && pub.authors.some(function (a) { return a.cofirst; })) {
        anyCofirst = true;
      }
    });

    section.hidden = false;
    if (anyCofirst) document.getElementById("cofirst-note").hidden = false;
  }

  /* ---- boot ---------------------------------------------- */
  fetch("content.json", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("content.json returned " + res.status);
      return res.json();
    })
    .then(function (data) {
      renderNews(data.news);
      renderPapers(data.publications);
      if (data.lastUpdated) {
        document.getElementById("last-updated").textContent =
          "Last updated " + data.lastUpdated;
      }
    })
    .catch(function (err) {
      console.error("Could not load content.json:", err);
      /* Opening index.html straight off disk trips CORS; fetch needs a server. */
      var hint = location.protocol === "file:"
        ? "Opening the file directly doesn't work. Run a local server: python3 -m http.server"
        : "Could not load content.json. Check the console.";
      var p = el("p", "noscript", hint);
      document.getElementById("papers").parentNode.appendChild(p);
    });
})();
