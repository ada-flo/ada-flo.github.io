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
    anthology:   "Anthology",
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
      if (h.url.charAt(0) === "#") {
        /* in-page link to a publication entry; data-pub lets the list switch
           to All when the target is not in Selected */
        var a = el("a", "news-link", h.text);
        a.href = h.url;
        a.setAttribute("data-pub", h.text);
        frag.appendChild(a);
      } else {
        frag.appendChild(externalLink(h.url, h.text, "news-link"));
      }
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
        /* noteLinks phrases are linked wherever they occur, title or note */
        what.appendChild(linkifyNote(item.title, noteLinks));
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
    /* One publication is a horizontal row: a small fixed-width figure on the
       left, text on the right. Entries without a figure just omit the box. */
    var li = el("li", pub.thumb ? "paper has-thumb" : "paper");
    li.id = "pub-" + slug(pub.title.split(/[\s:]/)[0]);
    var body = el("div", "paper-body");

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
          base.setAttribute("aria-label", pub.title);
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
        frame.setAttribute("aria-label", pub.title);
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
    body.appendChild(title);

    if (pub.tags && pub.tags.length) {
      var tags = el("div", "tags");
      tags.setAttribute("aria-label", "Categories");
      pub.tags.forEach(function (t) {
        tags.appendChild(el("span", "tag t-" + slug(t), t));
      });
      body.appendChild(tags);
    }

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
      body.appendChild(authors);
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
    if (meta.childNodes.length) body.appendChild(meta);

    /* tldr stays in content.json but is not rendered in the row layout;
       the title plus venue line carries enough, and rows stay compact. */
    var actions = el("p", "links-row");
    if (pub.links) {
      LINK_ORDER.forEach(function (key) {
        if (pub.links[key]) {
          actions.appendChild(
            externalLink(pub.links[key], LINK_LABELS[key] || key, null));
        }
      });
    }
    if (actions.childNodes.length) {
      /* [arXiv . Code] framing, after a well-known homepage's style */
      actions.insertBefore(document.createTextNode("["), actions.firstChild);
      actions.appendChild(document.createTextNode("]"));
    } else {
      /* Linkless entries keep the row as an invisible spacer so every entry
         ends at the same rhythm and the gaps between papers stay even. */
      actions.className = "links-row links-row-empty";
      actions.appendChild(document.createTextNode("\u00a0"));
    }
    body.appendChild(actions);

    li.appendChild(body);
    return li;
  }

  function renderPapers(pubs) {
    var section = document.getElementById("papers");
    var list = document.getElementById("paper-list");
    if (!pubs || !pubs.length) return;

    function fill(subset) {
      list.textContent = "";
      subset.forEach(function (pub) {
        list.appendChild(renderPaper(pub));
      });
    }

    var selected = pubs.filter(function (p) { return p.selected; });
    var showAll = function () { fill(pubs); };
    if (selected.length && selected.length < pubs.length) {
      var toggle = document.getElementById("pub-toggle");
      var btnSel = el("button", "pub-mode", "Selected");
      var btnAll = el("button", "pub-mode", "All");
      btnSel.type = btnAll.type = "button";
      function show(mode) {
        btnSel.className = "pub-mode" + (mode === "selected" ? " is-active" : "");
        btnAll.className = "pub-mode" + (mode === "all" ? " is-active" : "");
        btnSel.setAttribute("aria-pressed", String(mode === "selected"));
        btnAll.setAttribute("aria-pressed", String(mode === "all"));
        fill(mode === "selected" ? selected : pubs);
      }
      btnSel.addEventListener("click", function () { show("selected"); });
      btnAll.addEventListener("click", function () { show("all"); });
      toggle.appendChild(btnSel);
      toggle.appendChild(btnAll);
      toggle.hidden = false;
      showAll = function () { show("all"); };
      show("selected");
    } else {
      fill(pubs);
    }

    // Citations work even when there is no Selected/All toggle.
    var activeCite = null;
    var citationCards = new Map();
    var closeTimer;
    function closeCard() {
      clearTimeout(closeTimer);
      if (!activeCite) return;
      citationCards.get(activeCite).classList.remove("is-open");
      activeCite.setAttribute("aria-expanded", "false");
      activeCite = null;
    }
    function openCard(a) {
      closeCard();
      var card = citationCards.get(a);
      var rect = a.getBoundingClientRect();
      var width = document.documentElement.clientWidth;
      var height = window.innerHeight;
      card.style.left = "12px";
      card.style.top = "12px";
      var box = card.getBoundingClientRect();
      var left = Math.max(12, Math.min(rect.left + rect.width / 2 - box.width / 2,
        width - box.width - 12));
      var top = rect.top - box.height - 8;
      if (top < 12) top = rect.bottom + 8;
      top = Math.max(12, Math.min(top, height - box.height - 12));
      card.style.left = left + "px";
      card.style.top = top + "px";
      card.classList.add("is-open");
      a.setAttribute("aria-expanded", "true");
      activeCite = a;
    }
    document.querySelectorAll("a[data-pub]").forEach(function (a, index) {
      var pub = pubs.find(function (p) {
        return p.title.indexOf(a.getAttribute("data-pub")) === 0;
      });
      if (!pub) return;
      a.href = "#pub-" + slug(pub.title.split(/[\s:]/)[0]);
      if (a.classList.contains("cite")) {
        var card = el("span", "cite-card");
        card.id = "citation-preview-" + index;
        card.setAttribute("role", "region");
        card.setAttribute("aria-label", "Publication preview");
        a.setAttribute("aria-controls", card.id);
        a.setAttribute("aria-expanded", "false");
        a.setAttribute("aria-label", "View publication: " + pub.title);
        var titleLink = el("a", "cite-card-title", pub.title);
        titleLink.href = a.href;
        titleLink.addEventListener("click", function () {
          if (!document.getElementById(a.hash.slice(1))) showAll();
          closeCard();
        });
        card.appendChild(titleLink);
        card.appendChild(el("span", "cite-card-venue",
          pub.venue + (pub.toappear ? " · To appear" : "")));
        if (pub.tldr) card.appendChild(el("span", "cite-card-tldr", pub.tldr));
        // Keep the preview beside the citation: links cannot nest inside links.
        a.insertAdjacentElement("afterend", card);
        citationCards.set(a, card);
        card.addEventListener("pointerenter", function () { clearTimeout(closeTimer); });
        card.addEventListener("pointerleave", function (event) {
          if (event.pointerType === "mouse") closeTimer = setTimeout(closeCard, 150);
        });
        card.addEventListener("focusout", function (event) {
          if (!card.contains(event.relatedTarget) && event.relatedTarget !== a) closeCard();
        });
        var activationPointer = null;
        a.addEventListener("pointerdown", function (event) {
          activationPointer = event.pointerType;
        });
        a.addEventListener("keydown", function () {
          activationPointer = null;
        });
        a.addEventListener("pointerenter", function (event) {
          if (event.pointerType === "mouse") openCard(a);
        });
        a.addEventListener("pointerleave", function (event) {
          if (event.pointerType === "mouse") closeTimer = setTimeout(closeCard, 150);
        });
        a.addEventListener("focus", function () {
          openCard(a);
        });
        a.addEventListener("blur", function (event) {
          if (!card.contains(event.relatedTarget)) closeCard();
        });
        a.addEventListener("click", function (event) {
          // Touch opens the preview; a desktop mouse click follows the citation.
          // Fall back to device capabilities when click has no pointer metadata.
          var pointer = event.pointerType || activationPointer;
          var previewOnly = pointer ? pointer !== "mouse" :
            window.matchMedia("(hover: none), (pointer: coarse)").matches;
          if (previewOnly) {
            event.preventDefault();
            openCard(a);
          } else {
            closeCard();
          }
        });
      }
      a.addEventListener("click", function (event) {
        if (!event.defaultPrevented && !document.getElementById(a.hash.slice(1))) showAll();
      });
    });
    document.addEventListener("pointerdown", function (event) {
      if (activeCite && !activeCite.contains(event.target) &&
          !citationCards.get(activeCite).contains(event.target)) closeCard();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeCard();
    });
    window.addEventListener("scroll", closeCard, { passive: true });
    window.addEventListener("resize", closeCard);

    section.hidden = false;

    // Fragment navigation may happen before the asynchronous list exists,
    // or via Back/Forward after its target was filtered out.
    function followFragment() {
      var id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
      if (!id) return;
      if (!document.getElementById(id) && pubs.some(function (pub) {
        return id === "pub-" + slug(pub.title.split(/[\s:]/)[0]);
      })) showAll();
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    }
    window.addEventListener("hashchange", followFragment);
    followFragment();
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
