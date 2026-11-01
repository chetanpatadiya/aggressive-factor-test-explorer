# GitHub deployment guide — CAE V0.1

## Option A — GitHub website (straightforward)

1. Download and **extract** the repository ZIP; do not upload the ZIP as a single file and expect GitHub Pages to run it.
2. GitHub → **New repository** → name `comparative-aggressiveness-explorer` → create with an empty repository (no auto-generated README).
3. On the new repository page choose **Add file → Upload files**. Upload the extracted **contents**, preserving `src/`, `docs/`, `tests/`, `examples/`, and `.github/workflows/` paths. The root must contain `index.html`.
4. Commit to `main`.
5. **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
6. Visit the published GitHub Pages URL displayed in the Pages settings, check the synthetic example, and reimport a JSON export.

**Mobile note:** Uploading a repository tree from GitHub's iOS app or a mobile browser can be inconvenient; a desktop browser or a Git-capable coding environment is usually more practical. Keep the extracted folder hierarchy intact.

## Option B — Terminal / Codex after extracting the ZIP

From inside the extracted project directory:

```bash
git init
git add .
git commit -m "Initial Comparative Aggressiveness Explorer V0.1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/comparative-aggressiveness-explorer.git
git push -u origin main
```

Create the empty remote repository on GitHub first. Replace `YOUR-USERNAME` with your own GitHub username; sign in with your existing secure GitHub credentials. Then enable GitHub Pages with the same settings as Option A.

## Before making the site public

- Verify the intellectual-property/licensing choice (`LICENSE.md` intentionally contains a rights-reserved notice rather than an invented open-source grant).
- Run `npm test` locally or check that GitHub Actions verification passes.
- Do not publish confidential employer information, user JSON exports containing restricted data, or any real-world assessment without permission.
- Use the public synthetic example only for initial smoke tests.
- Confirm that the site disclaimer appears and that Pugh symbols explicitly represent challenge, not desirability.

## Link from an existing engineering-portfolio website

Use the actual Pages URL shown under the repository's Pages settings. For example, add a project card labelled “Comparative Aggressiveness Explorer — V0.1” with a link to the hosted app. Do not change other website files until the destination repository and site routing are verified.
