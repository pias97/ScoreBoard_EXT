# 🏆 WC26 Live — BD Time

> **Live FIFA World Cup 2026 scores, goal alerts & match stats — kickoffs shown in Bangladesh time.**

A lightweight Chrome / Edge browser extension that keeps you tapped into every WC26 fixture, with all times automatically converted to **Asia/Dhaka** so you never have to do the math at 3 AM.

---

## ✨ Features

- 🟢 **Live scores** — real-time updates for every World Cup 2026 match
- 🇧🇩 **Bangladesh time by default** — kickoffs, goals & match minutes in `Asia/Dhaka`
- 🔔 **Goal notifications** — instant pop-up the moment a goal is scored
- 📊 **Live match stats** — possession, shots, shots on target & more
- 📅 **Daily fixtures** — see all upcoming matches for the day at a glance
- 🎯 **Goal scorers** — know who scored and when
- ⚡ **Lightweight** — single-purpose, no bloat, no tracking
- 🌐 **Works on every site** — injects a floating score button on any page

---

## 📦 Installation

### From source (developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/pias97/ScoreBoard_EXT.git
   ```
2. Open **Chrome** (or any Chromium-based browser like Edge / Brave)
3. Navigate to `chrome://extensions`
4. Toggle **Developer mode** ON (top-right corner)
5. Click **Load unpacked** and select the cloned folder
6. The extension icon will appear in your toolbar — click it to open the live scoreboard

### Pin it to your toolbar

Right-click the extension icon → **Pin** — so it's always one click away.

---

## 🚀 Usage

- Click the toolbar icon to open the **popup scoreboard**
- Toggle the floating button (⚽) on any website to glance at live matches without opening the popup
- The extension polls ESPN's public API in the background and updates scores automatically
- You'll get a **goal notification** the moment a goal is scored (popup-only, opt-in)

---

## 🛠️ Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Platform     | Chrome Extension (Manifest V3)          |
| Data source  | ESPN public API                          |
| UI           | Vanilla HTML / CSS / JS (zero deps)     |
| Background   | Service Worker (`background.js`)        |
| Storage      | `chrome.storage`                        |
| Timezone     | `Intl.DateTimeFormat` (Asia/Dhaka)      |

---

## 🔐 Permissions Explained

- `alarms` — schedule periodic background data refreshes
- `storage` — cache the last scoreboard snapshot
- `<all_urls>` (host) — only used to inject the floating score button on any page
- `site.api.espn.com` — fetch live match data

> No analytics. No third-party tracking. No ads.

---

## 🗂️ Project Structure

```
ScoreBoard_EXT/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker (alarm-driven refresh)
├── content.js             # Floating score button injected on pages
├── popup.html / .css / .js  # Popup scoreboard UI
├── preview-notification.html  # Goal-notification template
├── icons/                 # 16 / 48 / 128 px icons
└── .puku/                 # Local editor cache (ignored)
```

---

## 📄 License

See the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for Bangladeshi football fans 🐯<br/>
  <em>Joy Bangla! 🇧🇩</em>
</p>
