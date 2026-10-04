<div align="center">
  <h1>⚔️ Lost Ark Tier 4 CP Calculator & Upgrade Advisor</h1>
  <p><strong>Gold-efficient progression planning for Lost Ark's Tier 4 endgame, built on the game's own tables</strong></p>

  [![Live Website](https://img.shields.io/badge/🌐_Website-lostark--cp.pages.dev-00C7B7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://lostark-cp.pages.dev/)
  [![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
  [![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

  <br />

  ### 🔗 **[👉 Launch Web App (lostark-cp.pages.dev) 👈](https://lostark-cp.pages.dev/)**
</div>

<br />

---

## 📖 Overview

**Lost Ark CP Calculator** is a client-side web app that imports your character from `lostark.bible`, reads its real **Battle Point** (the game's Combat Power breakdown), and tells you **what to buy next, and for how much gold**.

Every number comes from a verifiable source: the game's own tables (via the Maxroll planner feed), Loseii's published models, the official Lost Ark wiki or live market prices. Nothing is a demo value or a guessed constant, and the engine is regression-tested against ~70 real cached profiles covering every class.

---

## ✨ Features

### 💡 Smart Advisor & Gold-per-Damage (GPD)
Every way to improve your character, priced in gold and ranked like [Loseii's GPD](https://www.loseii.com/loa-gpd):
- **Honing**: weapon & armor up to +25, piece by piece (mixed Serka / Aegir sets supported), and advanced honing.
- **Gems**: your real gems, read one by one (damage / cooldown effects, gem Attack Power).
- **Accessories**: one row per slot type, with the exact target lines ("➔ AP % High / Atk. Power % Mid") and your current lines.
- **Bracelet**, **Astrogems** (epic & rare cutting) and **Ark Grid cores**, from Loseii's live ladders and graders.
- **Ability stone** (exact cutting odds), **relic books**, **Illumination Karma** and **weapon quality** (official upgrade odds).
- Ranked by gold per +1 % damage (DPS) or per +0.01 % ally buff (Support), with S+ to D tiers, a +CP column, and adjustable off-market prices.
- **Roadmap**: the cheapest sequence of upgrades to reach a CP target (DPS) or buff target (Support).

### 🛡️ DPS and Support, modelled separately
- **DPS**: personal damage (100 × ln of damage ratios, consistent across every system).
- **Support**: Loseii's support contribution model (Atk. Power buff, brand, identity), with support-only accessory lines priced as real stats and dead stats on DPS.
- A support class is always a support unless a DPS engraving says otherwise. Profiles saved with a stale Ark Passive tree are automatically recomputed in support mode from the game's Battle Point table.

### 📊 Benchmark & Comparator
- Compare yourself with **real players** of the same class and spec, pulled from lostark.bible raid rankings and reloaded live.
- System-by-system gaps (honing, gems, accessories, cores, bracelet, astrogems, engravings, Ark Passive, Karma…) priced with the GPD functions, plus a gold-ranked **purchase plan**.
- Profiles with missing Battle Point parts are detected and never used as references.

### 🧮 Simulators
- **Quick Predictor (iLvl ➔ CP)**: the cheapest honing path to a target item level, using real game recipes and market prices.
- **Piece-by-Piece Honing Simulator**: expected cost per piece (artisan energy, failure bonus, breath), CP gain and a gold-per-CP recommendation.
- **Ark Passive Simulator**: projected CP from the game's per-point Battle Point values, plus an **astrogem evaluator** (grade, rank and gain).
- **T4 Optimization**: try different accessory tiers and gem levels on your own character.
- **Canonical Engine**: your Battle Point, part by part, rebuilt exactly from the profile.

### 🎯 Rotation Analysis (beta)
- Load your **LOA Logs** `encounters.db` directly in the browser. It is read locally by a SQLite WebAssembly worker and **never uploaded**.
- Execution score (0-100) and "Top X %" against players of the same spec on the same boss, plus coaching tips (skill usage, positionals, cast rhythm, buff windows).
- Supports: buff coverage (Atk. Power, brand, identity), similar to lostark.bible's Buff Performance.
- Auto-sync on Chrome / Edge: the file is re-read every 10 seconds while you raid.

### 💰 Market, Stronghold & more
- **Live EUC market prices** used by every calculation, with the time of the last update.
- **Stronghold fusion** profitability (Abidos / Superior Abidos), with your own bonuses.
- **Raids & Gold Tracker**, optionally synced with LOA Logs by a local companion (see below).
- **Belgardin Projection**: an estimate of the upcoming T4 bracer (완갑) before its EU release, with every value's source shown.

### 🌐 Roster & languages
- **OAuth roster sync** with lostark.bible, multi-region (NAE / EUC…), shareable character links (`?char=…&region=…`).
- Fully bilingual: **English** and **French**.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3. No framework, no build step: plain scripts loaded in order by `index.html`.
- **Hosting**: Cloudflare Pages (+ Pages Functions for the lostark.bible and market proxies), plus an Nginx mirror.
- **Data sources**:
  - `lostark.bible`: character profiles, Battle Point, OAuth roster, raid rankings
  - Maxroll planner feed: honing recipes, item level stats, Karma, Battle Point and Ark Passive tables
  - `loseii.com`: GPD ladders, astrogem grader
  - `loa-buddy`: live EUC market prices
- **Security**: strict Content Security Policy, no inline scripts.
- **Analytics**: Cloudflare Web Analytics (cookie-free).

---

## 🚀 Quick Start (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lNevercry/lostark-cp-calculator.git
   cd lostark-cp-calculator
   ```

2. **Serve the files** (the API proxies need a server, a plain static server is not enough):
   ```bash
   npx wrangler pages dev .      # same as production (Pages Functions: profiles + market)
   # or
   node server.js                # lightweight Node server on port 8080 (lostark.bible proxy)
   ```

3. **Check syntax before committing:**
   ```bash
   for f in js/*.js; do node -c "$f"; done
   ```

### 🧪 Audit bench
`tools/audit/` runs the full app in jsdom on ~70 cached real profiles, without network access. Save a baseline before changing a calculation, then compare afterwards:
```bash
npm install
node tools/audit/audit.mjs --save-baseline && node tools/audit/bench.mjs --save-baseline
# ...change the code...
node tools/audit/audit.mjs --compare && node tools/audit/bench.mjs --compare
```
See [`tools/audit/README.md`](tools/audit/README.md).

### 🔄 Refreshing game data
| Command | Updates |
|---|---|
| `node tools/fetch-maxroll-honing.mjs` | Honing recipes, item level stats, Karma, Battle Point tables (after a game patch) |
| `node tools/fetch-maxroll-names.mjs` | Ark Grid core names |
| `node tools/harvest-live-peers.mjs` | Pool of real players for the Benchmark (~weekly) |
| `node tools/rotation/build-ref.mjs` | Rotation references (see [`tools/rotation/README.md`](tools/rotation/README.md)) |

All harvesting scripts are sequential and rate-limited, to be respectful of the sources.

---

## 🔄 Local Raid Tracker Companion (Optional)

For players using **LOA Logs**, an optional companion syncs your weekly raid clears, completed gates and gold earned with the Raids & Gold tab.

- **Windows executable**: [`client-agent/`](client-agent/) (`LostArkRaidAgent.exe`, or `start-agent.bat` with Node.js).
- **Script version**: [`agent/`](agent/) (`node agent/lostark-raid-agent.js`, or `start-agent-hidden.vbs` to run without a terminal window).

### 🛡️ Privacy & Anti-Cheat
- 🔒 **100 % local** (`127.0.0.1:4848`): nothing is sent to any external server. It only answers this site's pages in your own browser.
- 🛡️ **No game interaction (EAC safe)**: it never touches `LostArk.exe` or game memory. It only reads the SQLite database LOA Logs already writes to disk (`%LOCALAPPDATA%\LOA Logs\encounters.db`).
- 🔍 **Open source**: a single readable JavaScript file, no obfuscation.

---

## ⚙️ Self-hosting (OAuth)

To host your own copy, set your lostark.bible OAuth clients in `data.js`:

```javascript
window.OAUTH_CONFIG = {
    prodClientId: 'YOUR_PRODUCTION_CLIENT_ID',
    devClientId: 'YOUR_DEV_CLIENT_ID',
    ...
};
```
The client is picked automatically: production on the public site, development on localhost / local network. Remember to whitelist your domain and local URL in the OAuth provider's **Allowed Redirect URIs**.

---

## 🙏 Credits, Sources & Inspiration

This project stands on the shoulders of the Lost Ark theorycrafting community. A lot of its logic is **directly inspired by, ported from, or checked against** the work below. Thank you all, and please visit and support the original projects.

### 🧠 Models & methodology
| Source | What this project owes it |
|---|---|
| **[Loseii](https://www.loseii.com/)** ([GPD](https://www.loseii.com/loa-gpd), astrogem calculator) | The main inspiration for the Smart Advisor: the Gold-per-Damage method and its ranking, the support contribution model (ported and checked to give identical results), the bracelet and astrogem ladders, the astrogem grader (loaded live from their site), accessory slopes and the reference character used for Atk. Power pools. |
| **bebkok**, *LOA Sup buff calc* spreadsheet | Serca gear data, baseline stat constants and the support Ark Grid core measurements (via Loseii's research notes). |
| **Arsonistic**, *Lost Ark Arsonistic DPS Calculator* | Accessory line scaling and support buff tables (`buffDmg`), and the bracelet model coefficients. |
| **Cracine, Portia & Riyon**, *Automatic Gold to DMG Efficiency* spreadsheet | The gold-to-damage ROI approach that inspired the roadmap and the Benchmark purchase plan. |

### 📚 Game data
| Source | Used for |
|---|---|
| **[lostark.bible](https://lostark.bible/)** | Character profiles and their Battle Point breakdown, OAuth roster sync, raid rankings (pool of real players for the Benchmark), rotation references, and the idea of "Buff Performance" for supports. |
| **[Maxroll.gg](https://maxroll.gg/lost-ark)** (Lost Ark planner data) | The game's own tables: honing recipes (Aegir & Serka), item level stats, Illumination Karma, Battle Point values (DPS & support), Ark Passive values, Ark Grid core options and item names. |
| **Lost Ark Wiki** (community wiki) | Weapon quality upgrade odds, advanced honing, ability stone and relic book bonuses per engraving. |
| **[Lost Ark Codex](https://lostarkcodex.com/)** | Stronghold fusion recipes. |
| **[Smilegate / Stove](https://m-lostark.game.onstove.com/News/GMNote/Views/1225)** (official KR GM note) | Official Belgardin bracer honing rates and costs. |
| **[Inven](https://lostark.inven.co.kr/)**, **[Arca.live](https://arca.live/b/lostark)**, **[loa.kakao.gg](https://www.loa.kakao.gg/)** (Korean community) | Belgardin bracer measurements and community estimates, early Tier 4 data mining. Every estimated value in the Belgardin tab links back to its post. |

### 🔧 Tools & services
| Source | Used for |
|---|---|
| **Loa-Buddy** market API | Live EUC Auction House prices used by every gold calculation. |
| **[LOA Logs](https://github.com/snoww/loa-logs)** (snoww) | The open-source DPS meter whose `encounters.db` powers the Rotation Analysis and the Raid Tracker; skill and boss metadata come from its `meter-data`. |
| **[SQLite WebAssembly](https://sqlite.org/wasm)** | Reading LOA Logs databases directly in the browser (bundled, see its license in `js/rotation/vendor/`). |
| **Class guide authors** | Rotation targets quoted from community guides, each one cited in the app, e.g. *Dimensionalist – Community Advanced Guide* by Mariabetaniah & Hhôpe (Nexus Discord). |

> Lost Ark and all related names, data and images are the property of **Smilegate RPG** and **Amazon Games**. This is an unofficial fan project, not affiliated with or endorsed by them or by any of the sites above.

If you are one of these authors and something is credited wrongly or you would like it presented differently, please open an issue.

---

## 🤝 Contributing

Issues and pull requests are welcome!
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Run the syntax check and the audit bench (see above).
4. Commit your changes and open a Pull Request.
