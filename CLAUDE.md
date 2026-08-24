# Notes for Claude

Read `README.md` first. It has the file map, the JSON schema, and the **Design
references** section explaining why the layout is what it is. This file only
carries the things that are easy to get wrong.

## Hard constraints

- **No em dashes.** Anywhere, prose or code comments. This has come up repeatedly.
  Also avoid the rest of the register: "delve", "it's not just X, it's Y",
  three-item rhetorical lists, hedging preambles.
- **The two papers currently under anonymous review are not listed and must not be added** (their names must not appear in this public repo either, review anonymity).
- **Never guess a URL.** A wrong social handle or profile link went live once
  already. If a URL is not confirmed, leave a `TODO` comment rather than invent
  a plausible one, and say so.
- **Link labels name the destination.** `ACL Anthology`, `arXiv`, `OpenReview`,
  `Code`, `Models`. Never a generic `Website`.
- **`assets/docs/CV.pdf` and `CV.tex` are in the repo, so they are public.** The
  current versions carry no date of birth and no phone number. Keep it that way,
  the original source CV had both.

## Watch out for

- `.preview img` uses `object-fit: contain`, not `cover`. Wide figures letterbox.
  That is deliberate, see README. Do not "fix" it.
- **Light-only, no dark mode.** Tried a light/dark toggle, removed it: none of the
  genre references use one,
  they each commit to a single palette. Theme colours live in one `:root` block in
  `style.css`. Do not re-add a toggle or a `prefers-color-scheme` block.
- A new value in `tags` needs a matching `.t-<slug>` rule in `style.css` or it
  renders default blue.
- Node on this machine is broken (`libicui18n.74.dylib`). For a JS syntax check:
  ```sh
  /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc \
    -e 'new Function(readFile("assets/main.js"))'
  ```
- OpenReview's API and PDF attachments return `ChallengeRequiredError` to scripted
  requests. That is bot detection. Do not work around it. Ask for the file instead.
