const API = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const BD_TZ = "Asia/Dhaka";

const $ = (s) => document.querySelector(s);

/* ---------- goal notifications (popup-only) ---------- */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const BALL_SVG = `<svg class="gb" viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="11" fill="#fafafa"/>
  <g fill="#0e0e11">
    <polygon points="12,8.7 15.14,10.98 13.94,14.67 10.06,14.67 8.86,10.98"/>
    <polygon points="12,6.55 10.05,5.13 10.8,2.84 13.2,2.84 13.95,5.13"/>
    <polygon points="17.18,10.32 17.93,8.02 20.34,8.02 21.08,10.32 19.13,11.73"/>
    <polygon points="15.2,16.41 17.61,16.41 18.36,18.7 16.41,20.12 14.46,18.7"/>
    <polygon points="8.8,16.41 9.54,18.7 7.59,20.12 5.64,18.7 6.39,16.41"/>
    <polygon points="6.82,10.32 4.87,11.73 2.92,10.32 3.66,8.02 6.07,8.02"/>
  </g>
  <g stroke="#0e0e11" stroke-width="1.1" stroke-linecap="round">
    <line x1="12" y1="8.7" x2="12" y2="6.55"/>
    <line x1="15.14" y1="10.98" x2="17.18" y2="10.32"/>
    <line x1="13.94" y1="14.67" x2="15.2" y2="16.41"/>
    <line x1="10.06" y1="14.67" x2="8.8" y2="16.41"/>
    <line x1="8.86" y1="10.98" x2="6.82" y2="10.32"/>
  </g>
</svg>`;

function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  return Math.floor(m / 60) + "h";
}

function goalCard(g, i) {
  const team = String(g.title || "").replace(/^.*?GOAL\s*[—-]\s*/i, "").trim();
  return `<div class="goal-card" style="animation-delay:${i * 60}ms">
    ${BALL_SVG}
    <div class="gtxt">
      <div class="gtitle">Goal${team ? " · " + esc(team) : ""}</div>
      <div class="gscore">${esc(g.line || "")}</div>
      ${g.scorer ? `<div class="gscorer">${esc(g.scorer)}</div>` : ""}
    </div>
    <div class="gtime">${timeAgo(g.ts)}</div>
  </div>`;
}

function renderGoals(list) {
  const box = $("#goals");
  if (!box) return;
  box.innerHTML = (list || []).slice(0, 6).map(goalCard).join("");
}

function loadGoals() {
  chrome.storage.local.get("goalLog", (r) => renderGoals(r.goalLog));
}

chrome.storage.onChanged.addListener((ch, area) => {
  if (area === "local" && ch.goalLog) renderGoals(ch.goalLog.newValue);
});

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// Today + tomorrow (UTC) covers all BD-time "today/tonight" kickoffs
function dateRange() {
  const now = new Date();
  const to = new Date(now.getTime() + 86400000);
  return `${ymd(now)}-${ymd(to)}`;
}

function bdTime(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BD_TZ, hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date(iso));
}

function bdDay(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BD_TZ, weekday: "short", day: "numeric", month: "short",
  }).format(new Date(iso));
}

function teamHtml(t, side) {
  const logo = t.team.logo ? `<img src="${t.team.logo}" alt="">` : "";
  const name = `<span class="name">${t.team.shortDisplayName}</span>`;
  return side === "home"
    ? `<div class="team home">${logo}${name}</div>`
    : `<div class="team away">${name}${logo}</div>`;
}

function scorersHtml(comp) {
  const goals = (comp.details || []).filter((d) => d.scoringPlay);
  if (!goals.length) return "";
  const homeId = comp.competitors.find((c) => c.homeAway === "home").id;
  const rows = goals.map((g) => {
    const name = g.athletesInvolved?.[0]?.shortName || "Goal";
    const og = g.ownGoal ? ` <span class="og">(OG)</span>` : "";
    const pen = g.penaltyKick ? " (P)" : "";
    const side = g.team?.id === homeId ? "home" : "away";
    return `<div class="g ${side}"><span class="min">${g.clock?.displayValue || ""}</span> ${name}${pen}${og}</div>`;
  });
  return `<div class="scorers">${rows.join("")}</div>`;
}

function statVal(c, name) {
  const s = (c.statistics || []).find((x) => x.name === name);
  return s ? parseFloat(s.displayValue) : null;
}

function statsHtml(comp) {
  const [a, b] = comp.competitors;
  const home = a.homeAway === "home" ? a : b;
  const away = a.homeAway === "home" ? b : a;
  const defs = [
    ["possessionPct", "POSSESSION %"],
    ["shotsOnTarget", "SHOTS ON TARGET"],
    ["totalShots", "TOTAL SHOTS"],
  ];
  const rows = defs
    .map(([key, lbl]) => {
      const h = statVal(home, key), aw = statVal(away, key);
      if (h == null || aw == null) return "";
      const total = h + aw || 1;
      return `<div class="stat-row">
        <span class="lbl">${lbl}</span>
        <span>${h}</span>
        <div class="bar"><span class="h" style="width:${(h / total) * 100}%"></span></div>
        <span style="text-align:right">${aw}</span>
      </div>`;
    })
    .join("");
  return rows ? `<div class="stats">${rows}</div>` : "";
}

function matchHtml(ev) {
  const comp = ev.competitions[0];
  const st = ev.status.type; // state: pre | in | post
  const [c1, c2] = comp.competitors;
  const home = c1.homeAway === "home" ? c1 : c2;
  const away = c1.homeAway === "home" ? c2 : c1;
  const live = st.state === "in";
  const note = comp.notes?.[0]?.headline || "";

  let center, meta;
  if (st.state === "pre") {
    center = `<span class="kick">${bdTime(ev.date)}</span>`;
    meta = `<span>${bdDay(ev.date)} BD</span><span>·</span><span>${note}</span>`;
  } else {
    center = `<span class="score">${home.score} – ${away.score}</span>`;
    meta = live
      ? `<span class="minute">${ev.status.displayClock || st.shortDetail}</span><span>·</span><span>${note}</span>`
      : `<span>FT</span><span>·</span><span>${bdDay(ev.date)}</span><span>·</span><span>${note}</span>`;
  }

  return `<div class="match ${live ? "is-live" : ""}">
    <div class="row">${teamHtml(home, "home")}${center}${teamHtml(away, "away")}</div>
    <div class="meta">${meta}</div>
    ${st.state !== "pre" ? scorersHtml(comp) : ""}
    ${live ? statsHtml(comp) : ""}
  </div>`;
}

function section(label, events, cls = "") {
  if (!events.length) return "";
  return `<div class="section-label ${cls}">${label}</div>` + events.map(matchHtml).join("");
}

async function load() {
  const btn = $("#refresh");
  btn.classList.add("spin");
  try {
    const res = await fetch(`${API}?dates=${dateRange()}`);
    const data = await res.json();
    const evs = data.events || [];

    const live = evs.filter((e) => e.status.type.state === "in");
    const pre = evs
      .filter((e) => e.status.type.state === "pre")
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const done = evs.filter((e) => e.status.type.state === "post").reverse();

    $("#content").innerHTML =
      section("● LIVE NOW", live, "live") +
      section("UPCOMING — BD TIME", pre) +
      section("FULL TIME", done) ||
      `<div class="empty">No matches in this window.</div>`;

    $("#updated").textContent =
      "Updated " + new Date().toLocaleTimeString("en-GB", { timeZone: BD_TZ, hour12: false });
  } catch (e) {
    $("#content").innerHTML = `<div class="empty">Couldn't load scores. Check connection & retry.</div>`;
  } finally {
    setTimeout(() => btn.classList.remove("spin"), 600);
  }
}

$("#refresh").addEventListener("click", () => { load(); loadGoals(); });
load();
loadGoals();
setInterval(load, 30000); // auto-refresh while popup open
