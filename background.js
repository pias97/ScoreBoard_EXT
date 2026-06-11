const API = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const STATE_KEY = "scoreState";   // last seen scores (goal detection)
const BOARD_KEY = "scoreboard";   // slim data for the in-page widget
const LOG_KEY = "goalLog";        // rolling list of recent goals — shown in the popup


const POLL_MS = 5000;   // while any match is LIVE  (lower this for even faster)
const RELAX_MS = 30000; // when nothing is live

let pollTimer = null;
let running = false;

async function fetchEvents() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(API, { signal: ctrl.signal });
    const data = await res.json();
    return data.events || [];
  } finally {
    clearTimeout(t);
  }
}

function sides(comp) {
  const c1 = comp?.competitors?.[0];
  const c2 = comp?.competitors?.[1];
  if (!c1 || !c2) return null;
  return c1.homeAway === "home" ? { home: c1, away: c2 } : { home: c2, away: c1 };
}

// Live match stats for the in-page widget (possession, shots…)
function statVal(c, name) {
  const s = (c.statistics || []).find((x) => x.name === name);
  return s ? parseFloat(s.displayValue) : null;
}
const STAT_DEFS = [
  ["possessionPct", "Possession", "%"],
  ["shotsOnTarget", "Shots on target", ""],
  ["totalShots", "Total shots", ""],
];
function liveStats(comp) {
  const c = comp?.competitors || [];
  const home = c.find((x) => x.homeAway === "home");
  const away = c.find((x) => x.homeAway === "away");
  if (!home || !away) return [];
  return STAT_DEFS.map(([key, label, suffix]) => {
    const h = statVal(home, key), aw = statVal(away, key);
    if (h == null || aw == null) return null;
    return { label, home: h, away: aw, suffix };
  }).filter(Boolean);
}

// Trim ESPN payload to just what the widget needs
function slim(events) {
  return events
    .map((ev) => {
      const comp = ev.competitions?.[0];
      const s = sides(comp);
      if (!s) return null;
      const team = (t) => ({
        name: t.team.shortDisplayName || t.team.displayName || "",
        abbr: t.team.abbreviation || "",
        score: t.score ?? "",
        logo: t.team.logo || "",
      });
      const state = ev.status?.type?.state; // pre | in | post
      const m = {
        id: ev.id,
        state,
        clock: ev.status?.displayClock || ev.status?.type?.shortDetail || "",
        date: ev.date,
        home: team(s.home),
        away: team(s.away),
      };
      if (state === "in") m.stats = liveStats(comp);
      return m;
    })
    .filter(Boolean);
}

function latestScorer(comp, teamId) {
  const goals = (comp.details || []).filter(
    (d) => d.scoringPlay && d.team?.id === teamId
  );
  const g = goals[goals.length - 1];
  if (!g) return "";
  const name = g.athletesInvolved?.[0]?.shortName || "";
  const min = g.clock?.displayValue || "";
  const og = g.ownGoal ? " (OG)" : "";
  const pen = g.penaltyKick ? " (P)" : "";
  return (`${name} ${min}`.trim() + og + pen).trim();
}

function abbr(t) {
  return t.team.abbreviation || t.team.shortDisplayName || t.team.displayName || "";
}

function buildGoal(ev, comp, scoringTeam, home, away, hScore, aScore) {
  const teamName =
    scoringTeam.team.shortDisplayName || scoringTeam.team.displayName || "Goal";
  return {
    id: `${ev.id}-${hScore}-${aScore}`,
    title: `⚽ GOAL — ${teamName}`,
    line: `${abbr(home)} ${hScore} - ${aScore} ${abbr(away)}`,
    scorer: latestScorer(comp, scoringTeam.team.id),
  };
}

// Compare current scores with last poll; return any new goals
async function detectGoals(events) {
  const { [STATE_KEY]: prev = {} } = await chrome.storage.local.get(STATE_KEY);
  const next = {};
  const goals = [];

  for (const ev of events) {
    const state = ev.status?.type?.state;
    if (state !== "in" && state !== "post") continue;

    const comp = ev.competitions?.[0];
    const s = sides(comp);
    if (!s) continue;

    const hScore = Number(s.home.score) || 0;
    const aScore = Number(s.away.score) || 0;
    next[ev.id] = { h: hScore, a: aScore };

    const old = prev[ev.id];
    if (!old) continue; // first sighting — set baseline, don't notify

    if (hScore > old.h) goals.push(buildGoal(ev, comp, s.home, s.home, s.away, hScore, aScore));
    if (aScore > old.a) goals.push(buildGoal(ev, comp, s.away, s.home, s.away, hScore, aScore));
  }

  await chrome.storage.local.set({ [STATE_KEY]: next });
  return goals;
}

async function loop() {
  if (running) return;
  running = true;
  let live = 0;
  try {
    const events = await fetchEvents();
    live = events.filter((e) => e.status?.type?.state === "in").length;
    chrome.action.setBadgeText({ text: live ? String(live) : "" });

    // 1) feed the in-page widgets
    chrome.storage.local.set({ [BOARD_KEY]: slim(events) });

    // 2) detect goals → append to the rolling log the popup reads (no OS / on-page alerts)
    const goals = await detectGoals(events);
    if (goals.length) {
      const now = Date.now();
      const { [LOG_KEY]: log = [] } = await chrome.storage.local.get(LOG_KEY);
      const known = new Set(log.map((g) => g.id));
      const fresh = goals.filter((g) => !known.has(g.id)).map((g) => ({ ...g, ts: now }));
      const merged = [...fresh, ...log].slice(0, 20);
      chrome.storage.local.set({ [LOG_KEY]: merged });
    }
  } catch {
    /* network error — keep last state, retry next tick */
  } finally {
    running = false;
    scheduleNext(live > 0 ? POLL_MS : RELAX_MS);
  }
}

function scheduleNext(ms) {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(loop, ms);
}

function boot() {
  chrome.action.setBadgeBackgroundColor({ color: "#f87171" });
  chrome.alarms.create("revive", { periodInMinutes: 1 }); // backstop if SW is killed
  scheduleNext(0);
}

chrome.runtime.onInstalled.addListener(boot);
chrome.runtime.onStartup.addListener(boot);
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "revive" && !running) scheduleNext(0);
});
