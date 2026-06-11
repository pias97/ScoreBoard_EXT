(function () {
  // top frame only, once per page, respect per-session hide
  if (window.top !== window) return;
  if (document.getElementById("wc26-host")) return;
  try { if (sessionStorage.getItem("wc26-hidden") === "1") return; } catch {}

  const TZ = "Asia/Dhaka";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const bdTime = (iso) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(iso));

  const CSS = `
  :host { all: initial; }
  .wrap {
    position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
    display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
    font: 13px/1.5 ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #fafafa;
    --bg:#0e0e11; --surface:#17171b; --hair:rgba(255,255,255,.08);
    --ink:#fafafa; --ink2:#a1a1aa; --ink3:#62626a; --live:#f87171;
  }
  .panel {
    width: 300px; max-height: 62vh; overflow-y: auto;
    background: var(--bg); border: 1px solid var(--hair); border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0,0,0,.55);
    transform-origin: bottom right;
  }
  .panel[hidden] { display: none; }
  .panel.pop     { animation: pop-in .36s cubic-bezier(.34,1.56,.64,1); }
  .panel.closing { animation: pop-out .22s ease-in forwards; }
  @keyframes pop-in  { from { transform: scale(.25) translateY(18px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
  @keyframes pop-out { from { transform: scale(1) translateY(0); opacity: 1; } to { transform: scale(.25) translateY(18px); opacity: 0; } }
  .ph {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 14px 12px; position: sticky; top: 0;
    background: linear-gradient(var(--bg) 75%, transparent);
  }
  .ph-t { font-size: 13px; font-weight: 600; letter-spacing: -.2px; }
  .ph-s { font-size: 10px; color: var(--ink3); }
  .x {
    background: transparent; border: 1px solid var(--hair); color: var(--ink2);
    width: 24px; height: 24px; border-radius: 7px; cursor: pointer; font-size: 11px;
  }
  .x:hover { color: var(--ink); border-color: var(--ink3); }
  .pb { padding: 2px 8px 10px; }
  .empty { text-align: center; color: var(--ink3); padding: 24px 0; font-size: 12px; }

  .lbl {
    font-size: 9.5px; font-weight: 600; letter-spacing: 1.3px; text-transform: uppercase;
    color: var(--ink3); margin: 12px 6px 6px; display: flex; align-items: center; gap: 6px;
  }
  .lbl.live::before {
    content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--live);
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse { 50% { opacity: .3; } }

  .m {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px;
    padding: 9px 8px; border-radius: 10px;
  }
  .m + .m { border-top: 1px solid rgba(255,255,255,.04); }
  .m:hover { background: rgba(255,255,255,.02); }
  .t { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12.5px; font-weight: 500; }
  .t.away { justify-content: flex-end; }
  .t .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .t .fl { width: 16px; height: 16px; border-radius: 3px; object-fit: cover; flex-shrink: 0; }
  .c { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 56px; }
  .sc { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 15px; letter-spacing: .5px; }
  .kick { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 12px; color: var(--ink2); }
  .min { font-size: 9.5px; color: var(--live); font-weight: 600; }
  .ft { font-size: 9px; color: var(--ink3); letter-spacing: 1px; }

  /* live stats (possession, shots…) — shown when the panel is open */
  .stats { padding: 2px 10px 10px; display: grid; gap: 9px; }
  .st-top {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 11px; color: var(--ink); font-variant-numeric: tabular-nums; margin-bottom: 4px;
  }
  .st-l { font-size: 8.5px; letter-spacing: .8px; text-transform: uppercase; color: var(--ink3); font-weight: 600; }
  .bar { height: 3px; border-radius: 3px; background: rgba(255,255,255,.07); overflow: hidden; }
  .bar .bh { display: block; height: 100%; background: var(--ink); border-radius: 3px; }

  .fab {
    display: flex; align-items: center; gap: 8px; align-self: flex-end;
    background: var(--bg); border: 1px solid var(--hair); color: var(--ink);
    border-radius: 999px; padding: 9px 13px 9px 11px; cursor: pointer; font: inherit;
    box-shadow: 0 10px 30px rgba(0,0,0,.45); transition: border-color .15s, transform .12s;
    transform-origin: bottom right;
  }
  .fab:hover { border-color: var(--ink3); }
  .fab:active { transform: scale(.92); }
  .fab.bounce { animation: ball-in .45s cubic-bezier(.34,1.56,.64,1); }
  @keyframes ball-in { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); } }
  .fab .ball { width: 16px; height: 16px; display: block; animation: ball-spin 3s linear infinite; }
  @keyframes ball-spin { to { transform: rotate(360deg); } }
  .fab .cap { font-size: 11px; letter-spacing: .4px; color: var(--ink2); }
  .fab .cap.mini { display: inline-flex; align-items: center; gap: 5px; letter-spacing: 0; }
  .fab .cap.mini .fl { width: 15px; height: 15px; border-radius: 3px; object-fit: cover; flex-shrink: 0; }
  .fab .cap.mini .ab { font-size: 10.5px; font-weight: 600; color: var(--ink2); }
  .fab .cap.mini .sc {
    font-size: 12px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums;
    display: inline-flex; align-items: center; gap: 3px;
  }
  .fab .cap.mini .sc i { color: var(--ink3); font-style: normal; }
  .fab .badge {
    background: var(--live); color: #2a0606; font-size: 10px; font-weight: 800;
    border-radius: 999px; padding: 1px 7px; font-variant-numeric: tabular-nums;
  }
  .fab .badge[hidden] { display: none; }

  .ph-actions { display: flex; align-items: center; gap: 6px; }
  .x.demo { color: var(--live); border-color: rgba(248,113,113,.3); }
  .x.demo:hover { border-color: var(--live); }

  .goals { padding: 8px 8px 0; }
  .goals:empty { display: none; }
  .goal-card {
    position: relative; display: flex; align-items: center; gap: 10px;
    background: linear-gradient(180deg, #1c1c20, var(--surface));
    border: 1px solid rgba(248,113,113,.22); border-left: 3px solid var(--live);
    border-radius: 12px; padding: 9px 11px; margin-bottom: 7px;
    transform-origin: top center;
    animation: goal-pop .55s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes goal-pop {
    0%   { opacity: 0; transform: translateY(-13px) scale(.94); box-shadow: 0 0 0 0 rgba(248,113,113,.5); }
    55%  { opacity: 1; transform: translateY(2px) scale(1.012); }
    70%  { box-shadow: 0 0 0 7px rgba(248,113,113,0); }
    100% { opacity: 1; transform: translateY(0) scale(1); box-shadow: 0 0 0 0 rgba(248,113,113,0); }
  }
  .goal-card .gb { width: 24px; height: 24px; flex-shrink: 0; animation: ball-spin 2.6s linear infinite; }
  .goal-card .gtxt { flex: 1; min-width: 0; }
  .goal-card .gtitle {
    font-size: 9px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
    color: var(--live); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .goal-card .gscore {
    font-size: 13px; font-weight: 600; color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .goal-card .gscorer {
    font-size: 11px; color: var(--ink2); margin-top: 1px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .goal-card .gtime { font-size: 9px; color: var(--ink3); flex-shrink: 0; align-self: flex-start; }
  `;

  const host = document.createElement("div");
  host.id = "wc26-host";
  const root = host.attachShadow({ mode: "open" });
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    root.adoptedStyleSheets = [sheet];
  } catch {
    const st = document.createElement("style");
    st.textContent = CSS;
    root.appendChild(st);
  }
  root.innerHTML += `
    <div class="wrap">
      <div class="panel" id="panel" hidden>
        <div class="ph">
          <div><div class="ph-t">World Cup 2026</div><div class="ph-s">bangladesh time</div></div>
          <div class="ph-actions">
            <button class="x demo" id="demo" title="Preview a goal alert">⚡</button>
            <button class="x" id="collapse" title="Minimize">—</button>
          </div>
        </div>
        <div class="goals" id="goals"></div>
        <div class="pb" id="pb"></div>
      </div>
      <button class="fab" id="fab" title="World Cup 2026 — live">
        <svg class="ball" viewBox="0 0 24 24" aria-hidden="true">
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
        </svg>
        <span class="cap" id="cap">World Cup</span>
        <span class="badge" id="badge" hidden></span>
      </button>
    </div>`;
  (document.body || document.documentElement).appendChild(host);

  const $ = (id) => root.getElementById(id);
  const wrap = root.querySelector(".wrap");
  const panel = $("panel"), pb = $("pb"), fab = $("fab");
  const cap = $("cap"), badge = $("badge"), goalsBox = $("goals");

  const BALL = `<svg class="gb" viewBox="0 0 24 24" aria-hidden="true">
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
  let logGoals = [];   // real goals from background
  let demoGoals = [];  // ⚡ test previews

  const ago = (ts) => {
    if (!ts) return "";
    const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return "now";
    const m = Math.floor(s / 60);
    return m < 60 ? m + "m" : Math.floor(m / 60) + "h";
  };

  function goalCard(g, i) {
    const team = String(g.title || "").replace(/^.*?GOAL\s*[—-]\s*/i, "").trim();
    return `<div class="goal-card" style="animation-delay:${i * 60}ms">
      ${BALL}
      <div class="gtxt">
        <div class="gtitle">Goal${team ? " · " + esc(team) : ""}</div>
        <div class="gscore">${esc(g.line || "")}</div>
        ${g.scorer ? `<div class="gscorer">${esc(g.scorer)}</div>` : ""}
      </div>
      <div class="gtime">${esc(ago(g.ts))}</div>
    </div>`;
  }

  function renderGoals() {
    goalsBox.innerHTML = [...demoGoals, ...logGoals].slice(0, 6).map(goalCard).join("");
  }

  // ⚡ preview the alert without waiting for a real goal
  const DEMOS = [
    { title: "⚽ GOAL — Mexico",    line: "MEX 2 - 0 RSA", scorer: "R. Jiménez 71'" },
    { title: "⚽ GOAL — Brazil",    line: "BRA 1 - 0 ARG", scorer: "Vinícius Jr 23'" },
    { title: "⚽ GOAL — France",    line: "FRA 2 - 1 GER", scorer: "Mbappé 64' (P)" },
    { title: "⚽ GOAL — Argentina", line: "ARG 1 - 1 BRA", scorer: "L. Messi 88'" },
  ];
  let demoN = 0;
  $("demo").addEventListener("click", (e) => {
    e.stopPropagation();
    demoGoals = [{ ...DEMOS[demoN++ % DEMOS.length], ts: Date.now() }, ...demoGoals].slice(0, 6);
    renderGoals();
  });

  let open = false;
  function openPanel() {
    if (open) return;
    open = true;
    fab.style.display = "none";
    panel.hidden = false;
    panel.classList.remove("closing", "pop");
    void panel.offsetWidth;           // restart animation
    panel.classList.add("pop");
    renderGoals();                    // replay goal-alert animation on open
  }
  function closePanel() {
    if (!open) return;
    open = false;
    panel.classList.remove("pop");
    panel.classList.add("closing");
    setTimeout(() => {
      panel.hidden = true;
      panel.classList.remove("closing");
      fab.style.display = "";
      fab.classList.remove("bounce");
      void fab.offsetWidth;
      fab.classList.add("bounce");    // ball bounces back in
    }, 220);
  }
  fab.addEventListener("click", openPanel);
  $("collapse").addEventListener("click", closePanel);
  wrap.addEventListener("mouseleave", closePanel);

  const flag = (t) => (t.logo ? `<img class="fl" src="${esc(t.logo)}" alt="">` : "");

  function statsBlock(stats) {
    return `<div class="stats">` + stats.map((s) => {
      const total = (Number(s.home) + Number(s.away)) || 1;
      const hpct = (Number(s.home) / total) * 100;
      const sfx = esc(s.suffix || "");
      const hv = s.suffix === "%" ? Math.round(Number(s.home)) : s.home;
      const av = s.suffix === "%" ? Math.round(Number(s.away)) : s.away;
      return `<div class="st">
        <div class="st-top">
          <span>${esc(hv)}${sfx}</span>
          <span class="st-l">${esc(s.label)}</span>
          <span>${esc(av)}${sfx}</span>
        </div>
        <div class="bar"><span class="bh" style="width:${hpct}%"></span></div>
      </div>`;
    }).join("") + `</div>`;
  }

  function row(m) {
    const live = m.state === "in";
    let center;
    if (m.state === "pre") {
      center = `<span class="kick">${esc(bdTime(m.date))}</span>`;
    } else {
      center =
        `<span class="sc">${esc(m.home.score)} – ${esc(m.away.score)}</span>` +
        (live ? `<span class="min">${esc(m.clock)}</span>` : `<span class="ft">FT</span>`);
    }
    const stats = live && m.stats && m.stats.length ? statsBlock(m.stats) : "";
    return `<div class="m">
      <span class="t home">${flag(m.home)}<span class="nm">${esc(m.home.abbr || m.home.name)}</span></span>
      <span class="c">${center}</span>
      <span class="t away"><span class="nm">${esc(m.away.abbr || m.away.name)}</span>${flag(m.away)}</span>
    </div>${stats}`;
  }

  // hide flags that fail to load (some sites' CSP may block external images)
  function wireFlags(scope) {
    scope.querySelectorAll("img.fl").forEach((im) => {
      im.addEventListener("error", () => { im.style.display = "none"; }, { once: true });
      if (im.complete && im.naturalWidth === 0) im.style.display = "none";
    });
  }

  function sec(label, list, isLive) {
    if (!list.length) return "";
    return `<div class="lbl ${isLive ? "live" : ""}">${label}</div>` + list.map(row).join("");
  }

  function render(list) {
    list = list || [];
    wrap.style.display = list.length ? "" : "none";

    const live = list.filter((m) => m.state === "in");
    const pre = list
      .filter((m) => m.state === "pre")
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
    const post = list.filter((m) => m.state === "post").slice(-4).reverse();

    if (live.length) {
      const m = live[0];
      badge.hidden = live.length < 2;        // count only matters when more than one is live
      badge.textContent = live.length;
      cap.className = "cap mini";
      cap.innerHTML =
        `${flag(m.home)}<span class="ab">${esc(m.home.abbr || m.home.name)}</span>` +
        `<span class="sc">${esc(m.home.score)}<i>–</i>${esc(m.away.score)}</span>` +
        `<span class="ab">${esc(m.away.abbr || m.away.name)}</span>${flag(m.away)}`;
    } else {
      badge.hidden = true;
      cap.className = "cap";
      cap.textContent = "World Cup";
    }

    pb.innerHTML =
      sec("Live now", live, true) +
      sec("Upcoming", pre, false) +
      sec("Full time", post, false) ||
      `<div class="empty">No matches in this window.</div>`;

    wireFlags(cap);
    wireFlags(pb);
  }

  chrome.storage.local.get(["scoreboard", "goalLog"], (r) => {
    render(r.scoreboard);
    logGoals = r.goalLog || [];
    renderGoals();
  });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== "local") return;
    if (ch.scoreboard) render(ch.scoreboard.newValue);
    if (ch.goalLog) { logGoals = ch.goalLog.newValue || []; renderGoals(); }
  });
})();
