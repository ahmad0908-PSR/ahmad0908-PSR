# Your Portfolio Website

A static, JSON-driven portfolio site. Pure HTML/CSS/JS — no build step, no
database, hosted for free on GitHub Pages.

```
index.html          — page structure only
style.css            — all styling (dark/light theme + brand colors as CSS variables)
script.js            — loads the JSON files below and renders every section
data/
  config.json         — your name, hero text, about text, colors, contact links
  tech-stack.json      — your tech stack, grouped by category
  projects.json        — your projects (add / edit / delete freely)
  experience.json       — your work experience timeline
  certifications.json    — your certificates
assets/
  about-placeholder.jpg  — swap with your real photo
  projects/               — put your project screenshots / gifs / videos here
  certs/                  — put your certificate images here
```

## 1. Run it locally

Browsers block `fetch()` of local JSON files when you open `index.html`
directly (`file://...`), so serve the folder over a tiny local server:

```bash
# Python (built into most systems)
python3 -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000` in your browser.

## 2. Edit your content

You should be able to do 95% of your editing without touching any code:

- **Name, hero text, about text, colors, socials, footer** → `data/config.json`
- **Tech stack** → `data/tech-stack.json`. Each item's `icon` is a slug from
  [simpleicons.org](https://simpleicons.org) (search the tech's name there to
  find its slug). `color` is an optional hex color (no `#`) to tint the icon;
  leave it out to use the icon's default brand color.
- **Projects** → `data/projects.json`. Copy an existing block to add a new
  project. `media.type` can be `"image"`, `"gif"`, or `"video"` (for video,
  point `media.src` at an `.mp4` file — it autoplays muted and loops).
  `category` powers the filter buttons above the project grid automatically —
  just reuse an existing category name or invent a new one.
- **Experience** → `data/experience.json`, newest role first.
- **Certifications** → `data/certifications.json`.

Any image path (e.g. `assets/projects/my-project.png`) just needs to point
to a real file you've added under `assets/`.

## 3. Customize brand colors

Click the gear icon in the nav bar to open the **Customize** panel. It lets
you live-preview:
- Primary accent color
- Secondary accent color
- Particle background color

Changes save to your browser (`localStorage`) so they persist while you
design. When you're happy, click **Copy JSON** — it copies a small snippet
showing exactly which values to paste into `data/config.json` under
`colors.dark`, `colors.light`, and `particles`, so the new colors become the
permanent defaults for every visitor.

You can also just hand-edit `data/config.json` directly — every color used
on the site reads from `colors.dark` / `colors.light` / `particles` in that
file.

## 4. Deploy to GitHub Pages (free)

1. Create a new GitHub repository and push this folder to it.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch",
   choose your default branch (e.g. `main`) and `/ (root)`, then Save.
4. GitHub gives you a URL like `https://your-username.github.io/repo-name/`
   within a minute or two.

That's it — no build step needed, since this is plain HTML/CSS/JS.

## 5. Connect the contact form to Google Sheets

Since the site is static (no backend/database), the contact form sends
submissions to a **Google Apps Script Web App**, which writes each message
as a new row into a Google Sheet. This is free and needs no server of your
own.

### Step-by-step

1. **Create the spreadsheet.**
   Go to [sheets.google.com](https://sheets.google.com) and create a new
   spreadsheet. Rename it something like `Portfolio Contact Messages`. In
   row 1, add headers: `Timestamp | Name | Email | Message`.

2. **Open the script editor.**
   In the spreadsheet, go to **Extensions → Apps Script**. This opens a
   code editor tied to this specific spreadsheet.

3. **Paste this script**, replacing any starter code:

   ```javascript
   // This function runs whenever the Web App receives a POST request.
   function doPost(e) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     var data = JSON.parse(e.postData.contents);

     sheet.appendRow([
       new Date(),
       data.name,
       data.email,
       data.message
     ]);

     return ContentService
       .createTextOutput(JSON.stringify({ result: "success" }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. **Deploy it as a Web App.**
   - Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Description: anything, e.g. `Contact form endpoint`.
   - **Execute as:** "Me".
   - **Who has access:** "Anyone" (this makes it publicly reachable so your
     site's form can submit to it — it can only *append rows*, not read your
     sheet, so this is safe).
   - Click **Deploy**. Google will ask you to authorize the script the first
     time — approve it (you'll see an "unverified app" warning since it's
     your own personal script; click **Advanced → Go to (your project name)**
     to proceed).
   - Copy the **Web app URL** it gives you (ends in `/exec`).

5. **Paste the URL into your site.**
   Open `data/config.json` and set:
   ```json
   "contact": {
     "formEndpoint": "https://script.google.com/macros/s/XXXXXXXXXXXX/exec"
   }
   ```

6. **Test it.** Submit the contact form on your site and check that a new
   row appears in the spreadsheet. Because Google Apps Script doesn't return
   CORS headers, the site sends the request in "fire and forget" mode
   (`no-cors`) — it can't read Google's response, so it shows a success
   message as soon as the request is sent without a network error. Always
   verify in the sheet itself while testing.

### If you ever change the script

Every time you edit the Apps Script code, you must create a **new
deployment** (or use **Manage deployments → Edit → New version**) for the
changes to go live — saving the script alone does not update the deployed
Web App.

## 6. Hooking up real project links

Each project in `data/projects.json` has empty `"liveLink"` and
`"githubLink"` fields. Once you deploy a project, paste its live URL and/or
GitHub repo URL into those fields and the "Live site" / "Code" links will
appear automatically on that project's card.

## Accessibility & performance notes

- Respects `prefers-reduced-motion` (particle animation and scroll behavior
  simplify automatically).
- All interactive elements are keyboard-reachable with visible focus states.
- Tech-stack icons load from a public CDN
  ([simpleicons.org](https://simpleicons.org)) and gracefully fall back to a
  plain letter badge if that CDN is unreachable (e.g. fully offline use).
