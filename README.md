# WiFind

**Find Better Wi-Fi. Study Better.**
A campus Wi-Fi finder for T.I.P. Quezon City: a live campus map with the Wi-Fi strength of every building floor, a best-spot finder, a room-code lookup, a speed test with student reports, and alerts.

TECH 101 prototype by Jasper Basay, Axel James Gamit, Yuan James Antrajenda, Jevin Loy-a and Justine Mariano.

---

## What's in this folder

| File or folder | What it does |
| --- | --- |
| `index.html` | The app page |
| `css/styles.css` | Colors, layout and animations |
| `js/app.js` | Everything the app does, including the campus data |
| `assets/` | The WiFind logo |
| `icons/` | App icons for phones and the browser tab |
| `manifest.webmanifest`, `sw.js` | Make WiFind installable as a phone app and usable offline |
| `speedtest/` | Two small files the speed test can download. Don't delete them. |
| `package.json`, `server.js` | Let you run WiFind with `npm install` and `npm start` |
| `android/` | The WiFind Android app, which reads your phone's real Wi-Fi signal |
| `.github/workflows/android.yml` | Tells GitHub to build the Android app for you |

Keep the folders together. The app needs all of them.

## Put it online with Render

Render gives WiFind a free link, like `https://wifind.onrender.com`, that opens on any phone or laptop. Render publishes websites from GitHub, so first put these files on GitHub, then connect Render to them.

### 1. Put the files on GitHub

1. Sign in at [github.com](https://github.com), or create a free account.
2. Click **+** at the top right, then **New repository**. Name it `wifind`, choose **Public**, leave the other options as they are, and click **Create repository**.
3. On the next page, click the **uploading an existing file** link.
4. Open this `WiFind` folder on your computer, select everything inside it (**Ctrl+A**, or **Cmd+A** on a Mac) and drag it onto the GitHub page. Drag the files and folders that are *inside* `WiFind`, not the `WiFind` folder itself, so `index.html` ends up at the top of the repository.
5. When the upload finishes, click **Commit changes**. The repository should now list `index.html` next to the `css`, `js`, `assets`, `icons` and `speedtest` folders.

### 2. Publish it on Render

1. Go to [render.com](https://render.com) and sign up with your GitHub account, so Render can see your repositories.
2. In the Render dashboard, click **New**, then **Static Site**.
3. Pick your `wifind` repository. If it isn't listed, use the option to configure GitHub access and allow Render to see it.
4. Fill in the settings:

   | Setting | Value |
   | --- | --- |
   | Name | `wifind` (it becomes part of your link) |
   | Branch | `main` |
   | Root Directory | leave it empty |
   | Build Command | leave it empty |
   | Publish Directory | `.` (a single dot) |

5. Click **Create Static Site**.
6. Wait a minute or two until the status says **Live**. Your link is at the top of the page, for example `https://wifind.onrender.com`. If someone already took the name, Render adds a few random characters to it.

Choose **Static Site**, not **Web Service**. A static site is free and never goes to sleep. A free web service would also run WiFind (with `npm start`), but it goes to sleep after 15 minutes without visitors and then takes about a minute to wake up.

**If your link shows "Not Found":** the files are probably inside a `WiFind` folder in your repository. In Render, open **Settings**, change **Publish Directory** to `WiFind`, save, then click **Manual Deploy** and choose **Deploy latest commit**.

**To update the site:** change the file on GitHub (open it and click the pencil icon, or upload a new version), then commit. Render publishes the change by itself within a minute or two.

## Install it on phones

Open your Render link on the phone:

- **Android (Chrome):** menu **⋮ → Install app** (or **Add to Home screen**).
- **iPhone (Safari):** **Share → Add to Home Screen**.

WiFind then opens full screen from the home screen like a normal app, and it still opens without internet after the first visit.

## The Android app: your phone's real Wi-Fi signal

Websites aren't allowed to read Wi-Fi signal strength, so the WiFind Android app adds it. The app opens the same WiFind, and the **Test** tab gets a live card with:

- your signal strength in dBm, updated every 2 seconds, with a graph of the last 90 seconds,
- the network name, band (2.4, 5 or 6 GHz), channel, link speed and Wi-Fi standard,
- the access point you're connected to (its ID, called a BSSID) and every access point nearby,
- your building and floor, worked out from the access point, once your team has mapped it (see below).

Reports and speed tests sent from the app include the phone's signal, so the map shows a measured signal ("Tested") instead of a sample one.

iPhones can't do this: Apple doesn't let apps read Wi-Fi signal strength. On iPhones and laptops, keep using the website.

### Get the app (GitHub builds it for you)

You don't need Android Studio. GitHub builds the app every time you upload changes.

1. Upload everything in this folder to your GitHub repository, including the `android` and `.github` folders. On a Mac, folders starting with a dot are hidden, so if `.github` doesn't upload, create the file on GitHub instead: **Add file → Create new file**, type `.github/workflows/android.yml` as the name, and paste in the contents of that file from this folder.
2. Open the **Actions** tab of your repository. Wait for **Build Android app** to finish with a green check. It takes about 4 minutes.
3. On your repository's main page, open **Releases** on the right, then **WiFind for Android**, and download `WiFind.apk`. The download link never changes:
   `https://github.com/your-username/your-repo/releases/latest/download/WiFind.apk`
   If your repository is private, only people with access to it can download the app. Make the repository public to share the app with classmates.
4. On the Android phone, open `WiFind.apk`. Allow your browser or Files app to install apps when Android asks. Google Play Protect may warn that the app is from an unknown developer, because it isn't from the Play Store. Choose **Install anyway**.
5. Open WiFind, go to the **Test** tab and tap **Allow**.

When you upload changes later, GitHub builds a new `WiFind.apk`. Install it over the old one; your saved reports stay.

**Or build it in Android Studio:** open the `android` folder with **File → Open**, wait for the first sync to finish (it downloads what it needs), plug in your phone with USB debugging on, and press **Run ▶**. To make an APK file instead, use **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.

### Map the campus access points

The app recognizes your building and floor from the access point your phone is using. It needs a list of which access point is where, and your team builds it once:

1. Go to a floor, connect to the campus Wi-Fi, and open the **Test** tab in the app.
2. Under **This access point is in**, choose the building and floor, then tap **Save**. WiFind saves the access point you're connected to, plus strong access points of the same network around you.
3. Repeat on every floor. A big floor may have several access points, so save from both ends of the hallway.
4. When you're done, tap **Share list** and send it to yourself. Paste the lines inside `AP_MAP` near the top of `js/app.js`, then upload that file to GitHub. After GitHub builds the new app, every phone recognizes those floors.

### Why the app asks for location

Android only shares the network name and access point ID with apps that have location permission, because access point IDs can reveal where someone is. WiFind only uses them to match the access point to a building and floor. It doesn't use GPS and doesn't send your location anywhere.

### Limits

- Android allows about 4 Wi-Fi scans every 2 minutes, so the nearby list refreshes slowly.
- Signal strength isn't speed. A strong signal on a crowded access point can still be slow, so run the speed test too.
- Reports are still saved only on the phone that sent them, until you connect a shared database (see "Reports in this version").
- The app's signing key (`android/app/wifind-demo.p12`) is shared so that every build can update the app on a phone. That's fine for a class prototype. Create your own private key before publishing on Google Play.

## Open it on your computer

**With npm:** you need [Node.js](https://nodejs.org) installed.

1. Open a terminal in this folder (in VS Code: **Terminal → New Terminal**).
2. Run `npm install`. WiFind has no packages to download, so this finishes right away.
3. Run `npm start`.
4. Open the address it prints, <http://localhost:3000>. It also prints an address for a phone on the same Wi-Fi, but campus networks often block phones from reaching a laptop. Use your Render link on phones instead.

Press **Ctrl+C** in the terminal to stop it. To use another port, run `PORT=3001 npm start` (on Windows PowerShell: `$env:PORT=3001; npm start`).

**Other ways:**

- VS Code **Live Server** extension: right-click `index.html` and choose **Open with Live Server**. The page reloads by itself every time you save a file.
- Python: `python -m http.server 8000`, then open <http://localhost:8000>.
- Double-click `index.html` for a quick look. Everything works, but the app can't be installed from a file.

## About the speed test

The speed test uses Cloudflare's free public speed test servers, so it measures your real internet connection (ping, jitter, download and upload) over whatever Wi-Fi you're on, wherever WiFind is running. It needs internet access.

If Cloudflare can't be reached, an online copy of WiFind (for example on Render) measures against its own website instead. A copy running from your own computer tells you it couldn't reach the servers instead of showing fake numbers, because a test against your own computer would only measure the computer talking to itself.

To test a spot on campus, connect to the campus Wi-Fi there and run the test on that phone or laptop.

## Other free hosts

WiFind is a plain static website, so other free hosts work too. Publish this folder as it is, with no build command.

- **GitHub Pages:** in your GitHub repository, go to **Settings → Pages**. Under **Build and deployment**, set the source to **Deploy from a branch**, pick **main** and **/ (root)**, then save. After a minute or two GitHub shows a link like `https://your-username.github.io/wifind/`.
- Netlify and Vercel work the same way.

## Edit the campus data

The data sits near the top of `js/app.js`:

- **`PLACES`** lists every building and area: its name, its position on the map, and its floors. Each floor is one `F(...)` line with:
  - the floor number (`1` is the ground floor),
  - a sample Wi-Fi level: `ex1`/`ex2` excellent, `gd1`/`gd2` good, `fr1`/`fr2` fair, `wk1`/`wk2` weak, or `null` for no Wi-Fi,
  - how crowds change through the day (`classroom`, `lobby`, `study`, `lab` and so on),
  - the reasons shown under "Why the Wi-Fi is strong here",
  - a tip, and landmarks such as department offices.

  To change how many floors a building has, add or remove its `F(...)` lines.
- **`Q`** holds the sample Wi-Fi presets: signal, ping, jitter, download, upload and packet loss.
- **`WHY`** holds the reasons and their explanations.

Save your changes and refresh the page to see them. On Render, commit the changed file to GitHub and the site updates by itself. Installed phone apps pick up the new version the next time they open while online.

## Reports in this version

This version has no shared database, so reports and speed tests are saved in the browser of the device that made them. That's true on your computer and on Render: a report sent from your phone won't show up on your laptop. To share reports between students, connect a database such as Firebase or Supabase in the `sendReport()` and `initDb()` functions in `js/app.js`.

## Notes

- Wi-Fi readings are sample data until students run speed tests from each spot.
- The campus layout follows the T.I.P. QC Supreme Student Council campus map. The number of floors in each building is an estimate.
- WiFind is a student prototype and is not an official T.I.P. service.
