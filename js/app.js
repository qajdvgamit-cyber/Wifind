(() => {
'use strict';

/* =========================================================
   Utilities
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const wideMQ = window.matchMedia ? window.matchMedia('(min-width: 980px)') : null;
const isWide = () => (wideMQ ? wideMQ.matches : true);
const store = {
  get(k, d) { try { const v = localStorage.getItem('wifind:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('wifind:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
const median = (arr) => {
  const a = arr.filter((v) => v != null && isFinite(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const uid8 = () => Math.random().toString(36).slice(2, 10);
const NB = '‑'; // non-breaking hyphen keeps "Wi-Fi" on one line in headings
const WIFI = 'Wi' + NB + 'Fi';

function fmtHour(h) {
  let hh = Math.floor(h + 1e-6);
  let mm = Math.round((h - hh) * 60);
  if (mm === 60) { hh += 1; mm = 0; }
  const ap = hh >= 12 && hh < 24 ? 'PM' : 'AM';
  let h12 = hh % 12; if (h12 === 0) h12 = 12;
  return h12 + ':' + String(mm).padStart(2, '0') + ' ' + ap;
}
function fmtHourShort(h) {
  const hh = Math.round(h);
  let h12 = hh % 12; if (h12 === 0) h12 = 12;
  return h12 + (hh >= 12 ? ' PM' : ' AM');
}
function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 45) return 'just now';
  if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' hr ago';
  return Math.round(s / 86400) + ' d ago';
}
const fmtMs = (v) => (v == null ? '—' : v < 10 ? v.toFixed(1) : Math.round(v).toString());
const fmtMbps = (v) => (v == null ? '—' : v < 10 ? v.toFixed(1) : Math.round(v).toString());
const FL = (f) => (f === 1 ? 'Ground floor' : f === 2 ? '2nd floor' : f === 3 ? '3rd floor' : f + 'th floor');
const FS = (f) => (f === 1 ? 'GF' : f + 'F');

/* =========================================================
   Icons (24x24, stroke)
   ========================================================= */
const ICONS = {
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  wifi: '<path d="M2.6 9.2a13.6 13.6 0 0 1 18.8 0"/><path d="M5.6 12.6a9.3 9.3 0 0 1 12.8 0"/><path d="M8.7 16a4.8 4.8 0 0 1 6.6 0"/><circle cx="12" cy="19.3" r="1.2" fill="currentColor" stroke="none"/>',
  wifiOff: '<path d="M8.7 16a4.8 4.8 0 0 1 6.6 0"/><path d="M5.6 12.6a9.3 9.3 0 0 1 4.4-2.4M14.6 10.4a9.3 9.3 0 0 1 3.8 2.2"/><path d="M2.6 9.2a13.6 13.6 0 0 1 4.2-2.8M11 5.2a13.6 13.6 0 0 1 10.4 4"/><circle cx="12" cy="19.3" r="1.2" fill="currentColor" stroke="none"/><path d="M3.5 3.5l17 17"/>',
  nav: '<path d="M12 3 19 20l-7-4-7 4 7-17Z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  play: '<path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10.3-6.4a.8.8 0 0 0 0-1.4L9.2 4.9A.8.8 0 0 0 8 5.6Z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4L12 4Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none"/>',
  users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 6a3 3 0 0 1 0 5.5M17 14a5.5 5.5 0 0 1 3.5 5"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M9.5 2.5h5"/>',
  wave: '<path d="M2.5 12c2 0 2-5 4-5s2 10 4 10 2-10 4-10 2 10 4 10 2-5 3-5"/>',
  signal: '<path d="M5 19v-3M10 19v-6M15 19V9M20 19V5"/>',
  pin: '<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  exam: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M9 13l2 2 4-4"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7h2.1A4.3 4.3 0 0 0 21 10.7C21 6.4 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="14.5" cy="7" r="1.1"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  building: '<path d="M4 21V5l8-2v18M12 21V9l8 2v10M2.5 21h19"/><path d="M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
  router: '<rect x="3" y="14" width="18" height="6" rx="2"/><path d="M12 14v-3"/><path d="M8.5 8.2a5 5 0 0 1 7 0M6 5.6a8.6 8.6 0 0 1 12 0"/><path d="M7 17h.01M10 17h.01"/>',
  wall: '<rect x="3" y="5" width="18" height="14" rx="1.2"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
  micro: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="6" y="8" width="9" height="8" rx="1"/><path d="M18 9v.01M18 12v.01M18 15v.01"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bellOn: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" fill="currentColor" fill-opacity=".18"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  spark: '<path d="M12 3.5 13.8 9 19.5 10.5 13.8 12 12 17.5 10.2 12 4.5 10.5 10.2 9 12 3.5Z"/><path d="M18.5 16v4M16.5 18h4"/>',
  door: '<path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21M3 21h18"/><circle cx="15" cy="12.5" r="1" fill="currentColor" stroke="none"/>',
  stairs: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v4"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.6L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.6L20 16M20 20v-4h-4"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
};
function icon(name, cls) {
  return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

/* =========================================================
   Campus data — layout from the T.I.P. QC SSC campus map,
   Wi-Fi readings are sample values until students send tests
   ========================================================= */
const H0 = 7, H1 = 21; // campus hours, 7 AM to 9 PM
// Typical crowd load per hour (index 0 = 7 AM ... 14 = 9 PM), 0 = empty, 1 = packed.
const PROFILES = {
  library:   [0.15, 0.25, 0.35, 0.45, 0.60, 0.70, 0.75, 0.70, 0.60, 0.50, 0.40, 0.30, 0.20, 0.15, 0.10],
  lobby:     [0.85, 0.50, 0.40, 0.45, 0.55, 0.80, 0.55, 0.40, 0.45, 0.60, 0.90, 0.60, 0.35, 0.20, 0.10],
  outdoor:   [0.30, 0.30, 0.35, 0.45, 0.60, 0.70, 0.50, 0.45, 0.45, 0.50, 0.55, 0.40, 0.25, 0.15, 0.10],
  classroom: [0.45, 0.75, 0.85, 0.70, 0.60, 0.40, 0.65, 0.85, 0.80, 0.65, 0.45, 0.35, 0.30, 0.20, 0.10],
  corridor:  [0.60, 0.65, 0.70, 0.70, 0.75, 0.80, 0.70, 0.70, 0.70, 0.70, 0.65, 0.45, 0.30, 0.20, 0.10],
  canteen:   [0.35, 0.30, 0.35, 0.50, 0.85, 1.00, 0.70, 0.45, 0.55, 0.60, 0.45, 0.35, 0.25, 0.15, 0.05],
  lab:       [0.30, 0.60, 0.70, 0.60, 0.50, 0.35, 0.60, 0.70, 0.65, 0.55, 0.40, 0.30, 0.20, 0.10, 0.05],
  study:     [0.10, 0.15, 0.20, 0.30, 0.40, 0.45, 0.40, 0.35, 0.30, 0.30, 0.25, 0.20, 0.15, 0.10, 0.05],
};

// Reasons the Wi-Fi is strong (+) or weak (-) on a floor
const W = (k, i, t, d) => ({ k, i, t, d });
const WHY = {
  apRoom: W('+', 'router', 'Access points inside the rooms', 'Rooms on this floor have their own access points, so your device is one short hop from the router.'),
  apHall: W('+', 'router', 'Hallway access points', 'Access points along the hallway cover the benches and the rooms nearest to them.'),
  apOffice: W('+', 'router', 'Department office access points', 'Faculty offices get their own access points, and they also cover the hallway outside.'),
  wiredLab: W('+', 'plug', 'Wired lab computers', 'Lab PCs use cables, so they don’t compete with phones and laptops for Wi-Fi airtime.'),
  upperQuiet: W('+', 'stairs', 'Fewer people up here', 'Upper floors see less foot traffic between classes, so each device gets a bigger share of the bandwidth.'),
  band5: W('+', 'wave', '5 GHz coverage', 'Newer phones and laptops connect on 5 GHz here: more channels and less interference than 2.4 GHz.'),
  study: W('+', 'book', 'Made for studying', 'Study spaces get more access points per seat than classrooms, and people mostly read and browse instead of streaming.'),
  borrowed: W('+', 'door', 'Borrowed signal', 'You pick up access points from the rooms and the courtyard next to you.'),
  lowCrowd: W('+', 'users', 'Few devices at a time', 'Only a small group uses this space at once, so the access point is rarely overloaded.'),
  footTraffic: W('-', 'users', 'Foot traffic', 'The ground floor fills up at class changes, and every phone passing through reconnects to the Wi-Fi.'),
  streetNoise: W('-', 'wifi', 'Street-side interference', 'Shops and offices along the road run their own Wi-Fi on the same channels, which adds noise near the street.'),
  concrete: W('-', 'wall', 'Concrete walls and stair core', 'Signal has to pass through reinforced concrete, which can cut it by 10 to 15 dB per wall.'),
  peakClasses: W('-', 'clock', 'Busy class hours', 'When every room is in session and streaming, the shared connection slows down.'),
  distance: W('-', 'ruler', 'Far from the access point', 'Rooms at the ends of the hallway are farthest from the access point and lose a bar or two.'),
  crowds: W('-', 'users', 'Crowds', 'Students gather here between classes and at lunch, so hundreds of devices share a few access points.'),
  bodies: W('-', 'wave', 'Crowds absorb signal', 'The human body is mostly water, and water absorbs Wi-Fi. A packed space weakens the signal itself.'),
  events: W('-', 'users', 'Events fill the room', 'During seminars and events, everyone joins the same access points at once.'),
  bigHall: W('-', 'ruler', 'Big room, high ceiling', 'Access points are mounted high in large halls, so the signal spreads thin by the time it reaches you.'),
  outdoor: W('-', 'router', 'No outdoor access point', 'Outdoor spots borrow signal through walls and windows from nearby buildings.'),
  cars: W('-', 'wall', 'Metal cars', 'Parked cars are metal boxes that block and reflect Wi-Fi signals.'),
  noCoverage: W('-', 'wifiOff', 'Coverage not ready', 'In August, a student post said there was no Wi-Fi in Bldg 9 and they couldn’t open Canva to study for an exam.'),
  mobileOnly: W('-', 'signal', 'Mobile data only', 'Without nearby access points, phones fall back to mobile data, which is slower indoors.'),
  heavyFiles: W('-', 'upload', 'Heavy design files', 'Studios full of laptops sync large design files at the same time, which fills the connection.'),
  noAp: W('-', 'router', 'No access point nearby', 'Access points go in rooms and hallways, not in stairwells, gyms and service areas.'),
};
// Sample connection presets: [signal dBm, ping ms, jitter ms, down Mbps, up Mbps, packet loss %]
const Q = {
  ex1: [-45, 13, 2.5, 46, 22, 0.1], ex2: [-48, 15, 3, 40, 20, 0.15],
  gd1: [-53, 20, 5, 30, 15, 0.3], gd2: [-56, 24, 6, 26, 12, 0.4],
  fr1: [-62, 34, 10, 16, 7, 0.7], fr2: [-65, 42, 14, 12, 5, 1.0],
  wk1: [-72, 62, 22, 6, 2, 2.0], wk2: [-76, 80, 28, 4, 1.5, 2.8],
};
// Campus access points for the Android app: access point ID (BSSID) -> spot ID, for example 'a4:2b:b0:12:34:56': 'b5-3'.
// Fill this in from "Share list" in the Android app after your team walks the campus, so every phone knows where it is.
const AP_MAP = {
};
const F = (f, q, profile, sens, type, why, tip, marks) => ({ f, q, profile, sens, type, why, tip, marks: marks || [] });
const DEAD9 = (f) => F(f, null, 'classroom', 0.3, 'Classrooms', ['noCoverage', 'concrete', 'mobileOnly'], 'Save what you need offline before class, or use the nearest strong spot below.');

// fp = footprint [x, y, w, h] on the 1000 x 1440 map; mk = marker position; node = door on the walkway graph
const PLACES = [
  { id: 'b6', code: 'B6', name: 'Building 6', short: 'Bldg 6', kind: 'bldg', fp: [517, 180, 68, 292], mk: [551, 360], node: 'b6d',
    about: 'The long building beside the main gate walkway.',
    floors: [
      F(1, 'fr1', 'lobby', 1.0, 'Entrance hallway', ['apHall', 'footTraffic', 'streetNoise'], 'It’s right by the main gate, so it gets busy at 7 AM and at dismissal. Go up a floor for a steadier connection.'),
      F(2, 'gd2', 'classroom', 0.8, 'Classrooms', ['apRoom', 'peakClasses'], 'Sit near the front of the room, where the access point usually is.'),
      F(3, 'gd1', 'classroom', 0.7, 'Classrooms', ['apRoom', 'upperQuiet'], 'A good fallback when the ground floor is crowded.'),
      F(4, 'ex2', 'study', 0.5, 'Classrooms', ['upperQuiet', 'apRoom', 'band5'], 'The quietest floor of Bldg 6 and the closest strong Wi-Fi to the main gate.'),
    ] },
  { id: 'b9', code: 'B9', name: 'Building 9', short: 'Bldg 9', kind: 'bldg', fp: [630, 450, 261, 121], mk: [800, 512], node: 'b9d',
    about: 'Offices of the College of Education, Math and Physics, College of Arts, and Senior High School.',
    floors: [
      F(1, 'wk1', 'lobby', 0.9, 'Lobby and offices', ['borrowed', 'noCoverage', 'footTraffic'], 'The entrance picks up some signal from the courtyard. If you need Wi-Fi in Bldg 9, stay near the door.', ['College of Arts office', 'Senior High School office']),
      DEAD9(2), DEAD9(3), DEAD9(4), DEAD9(5), DEAD9(6),
    ] },
  { id: 'b9x', code: 'B9 EXT', name: 'Building 9 Extension', short: 'Bldg 9 Ext', kind: 'bldg', fp: [355, 522, 140, 81], mk: [466, 570], node: 'p9x',
    floors: [
      F(1, 'fr2', 'corridor', 0.8, 'Hallway', ['borrowed', 'concrete'], 'Stand near the doorway that faces the walkway for the best signal.'),
      F(2, 'fr1', 'classroom', 0.8, 'Classrooms', ['apHall', 'peakClasses'], 'Sit close to the hallway access point.'),
      F(3, 'gd2', 'classroom', 0.6, 'Classrooms', ['apRoom', 'upperQuiet'], 'The steadiest floor of the extension.'),
    ] },
  { id: 'b5', code: 'B5', name: 'Building 5', short: 'Bldg 5', kind: 'bldg', fp: [909, 445, 76, 342], mk: [947, 632], node: 'b5d',
    about: 'Industrial, Computer, Electrical and Electronics Engineering, and College of Computer Studies offices.',
    floors: [
      F(1, 'gd2', 'lobby', 0.8, 'Lobby', ['apHall', 'footTraffic'], 'Technocore is next door if the lobby gets busy.'),
      F(2, 'ex2', 'lab', 0.6, 'Computer labs', ['wiredLab', 'apRoom'], 'If a lab PC lags while running a virtual machine, that is the computer, not the Wi-Fi. Ask ITSO for help.', ['Room 5203 computer lab']),
      F(3, 'gd1', 'classroom', 0.7, 'Classrooms and offices', ['apOffice', 'apRoom', 'peakClasses'], 'The hallway near the department offices is well covered.'),
      F(4, 'ex1', 'study', 0.5, 'Classrooms and offices', ['apOffice', 'upperQuiet', 'band5'], 'One of the strongest floors in the sample. Good for online exams.'),
      F(5, 'gd2', 'classroom', 0.6, 'Classrooms', ['upperQuiet', 'apRoom', 'distance'], 'Rooms near the stairs get a bar less than the rest of the floor.'),
    ] },
  { id: 'b2', code: 'B2', name: 'Building 2', short: 'Bldg 2', kind: 'bldg', fp: [670, 1035, 86, 189], mk: [713, 1152], node: 'b8d',
    floors: [
      F(1, 'fr1', 'lobby', 0.9, 'Lobby and offices', ['apOffice', 'footTraffic'], 'Busy at class changes because it sits on the main walkway.', ['Mechanical Engineering office']),
      F(2, 'gd1', 'classroom', 0.7, 'Classrooms and offices', ['apOffice', 'apRoom'], 'A steady floor for video calls.', ['Business Education office', 'Environmental and Sanitary Engineering office']),
      F(3, 'fr1', 'classroom', 0.9, 'Design studios', ['apRoom', 'heavyFiles'], 'Upload big files early in the morning or after 5 PM.', ['Architecture office']),
      F(4, 'gd1', 'study', 0.6, 'Classrooms', ['upperQuiet', 'apRoom'], 'Quieter than the floors below, with fewer devices per access point.'),
    ] },
  { id: 'b2x', code: 'B2 EXT', name: 'Building 2 Extension', short: 'Bldg 2 Ext', kind: 'bldg', fp: [760, 1053, 90, 126], mk: [805, 1140], node: 'b2xd',
    floors: [
      F(1, 'fr2', 'corridor', 0.8, 'Hallway', ['concrete', 'footTraffic'], 'Pass through. For schoolwork, go up to the 2nd floor.'),
      F(2, 'gd2', 'classroom', 0.7, 'Classrooms and offices', ['apOffice', 'apRoom'], 'Good for research and uploads.', ['Civil Engineering office']),
      F(3, 'gd1', 'study', 0.5, 'Classrooms', ['upperQuiet', 'apRoom'], 'Usually calm, even at midday.'),
    ] },
  { id: 'b8', code: 'B8', name: 'Building 8', short: 'Bldg 8', kind: 'bldg', fp: [562, 1053, 81, 171], mk: [602, 1152], node: 'b8d',
    floors: [
      F(1, 'wk1', 'corridor', 0.7, 'Hallway', ['concrete', 'crowds', 'noAp'], 'Squeezed between two walkways. Expect slow pages down here.'),
      F(2, 'fr1', 'classroom', 0.8, 'Classrooms', ['apHall', 'peakClasses'], 'Sit close to the hallway access point.'),
      F(3, 'gd2', 'classroom', 0.7, 'Classrooms', ['apRoom', 'upperQuiet'], 'A good floor for uploads between classes.'),
      F(4, 'gd1', 'study', 0.5, 'Classrooms', ['upperQuiet', 'apRoom', 'band5'], 'The best floor of Bldg 8.'),
    ] },
  { id: 'b1', code: 'B1', name: 'Building 1', short: 'Bldg 1', kind: 'bldg', fp: [112, 922, 248, 81], mk: [266, 962], node: 'b1d',
    about: 'The campus library is in Building 1.',
    floors: [
      F(1, 'fr2', 'lobby', 0.8, 'Lobby', ['apHall', 'footTraffic', 'streetNoise'], 'Next to the side street and the parking area, so the air is noisy for Wi-Fi.'),
      F(2, 'gd1', 'classroom', 0.7, 'Classrooms', ['apRoom', 'peakClasses'], 'Steady outside the busiest class hours.'),
      F(3, 'ex2', 'library', 0.5, 'Classrooms', ['apRoom', 'upperQuiet', 'band5'], 'One of the calmest floors on campus for long study sessions.'),
      F(4, 'gd2', 'classroom', 0.7, 'Classrooms', ['apRoom', 'distance'], 'Pick a room near the middle of the hallway.'),
    ] },
  { id: 'b3', code: 'B3', name: 'Building 3', short: 'Bldg 3', kind: 'bldg', fp: [616, 1224, 140, 198], mk: [686, 1336], node: 'b3d',
    floors: [
      F(1, 'fr1', 'corridor', 0.8, 'Lobby', ['apHall', 'footTraffic'], 'At the end of the main walkway, so it fills up at class changes.'),
      F(2, 'gd2', 'classroom', 0.8, 'Classrooms', ['apRoom', 'peakClasses'], 'Fine for research. Video calls can stutter mid-morning.'),
      F(3, 'gd1', 'classroom', 0.6, 'Classrooms', ['apRoom', 'upperQuiet'], 'The best floor of Bldg 3.'),
      F(4, 'fr2', 'classroom', 0.7, 'Classrooms', ['distance', 'apHall'], 'Signal fades at the far ends of the hallway.'),
    ] },
  { id: 'b4', code: 'B4', name: 'Building 4', short: 'Bldg 4', kind: 'bldg', fp: [855, 1030, 130, 81], mk: [935, 1074], node: 'b4d',
    floors: [
      F(1, 'wk1', 'corridor', 0.6, 'Stairs and hallway', ['concrete', 'noAp'], 'Finish uploads before you take the stairs here.'),
      F(2, 'fr1', 'classroom', 0.8, 'Classrooms', ['apHall', 'peakClasses'], 'Sit close to the hallway access point.'),
      F(3, 'gd2', 'classroom', 0.7, 'Classrooms', ['apRoom', 'upperQuiet'], 'A steady floor for most schoolwork.'),
      F(4, 'gd1', 'study', 0.5, 'Classrooms', ['upperQuiet', 'apRoom'], 'The best floor of Bldg 4.'),
    ] },
  { id: 'sh', code: 'SH', name: 'Study Hall', kind: 'area', fp: [459, 895, 180, 108], mk: [594, 954], node: 'shd',
    floors: [F(1, 'ex1', 'library', 0.45, 'Study area', ['study', 'apRoom', 'lowCrowd', 'band5'], 'The best all-around spot in the sample for long study sessions and online exams.')] },
  { id: 'tc', code: 'TC', name: 'Technocore', kind: 'area', fp: [855, 787, 130, 239], mk: [920, 935], node: 'tcd',
    floors: [F(1, 'ex2', 'study', 0.5, 'Tech center', ['apRoom', 'wiredLab', 'lowCrowd'], 'Strong and steady. Good for Canva and big uploads.')] },
  { id: 'sr', code: 'SR', name: 'Seminar Rooms A and B', short: 'Seminar rooms', mapName: 'Seminar A & B', kind: 'area', fp: [364, 895, 90, 108], mk: [409, 976], node: 'srd',
    floors: [F(1, 'gd1', 'classroom', 0.6, 'Seminar rooms', ['apRoom', 'events'], 'Great when no seminar is running. Check the schedule first.')] },
  { id: 'ah', code: 'AH', name: 'Anniversary Hall', kind: 'area', fp: [621, 625, 229, 113], mk: [800, 690], node: 'c7',
    floors: [F(1, 'gd2', 'outdoor', 0.9, 'Event hall', ['apRoom', 'bigHall', 'events'], 'Fine on a normal day. During events, the Wi-Fi fills up fast.')] },
  { id: 'ca', code: 'CA', name: 'Congregating Area', kind: 'area', fp: [670, 886, 176, 144], mk: [772, 986], node: 'shd',
    floors: [F(1, 'fr2', 'canteen', 1.2, 'Open hangout area', ['borrowed', 'crowds', 'bodies'], 'Fine in the morning. At lunch it’s packed and slow.')] },
  { id: 'pe1', code: 'PE 1', name: 'PE Center 1', kind: 'area', fp: [355, 612, 140, 175], mk: [425, 730], node: 'pe1d',
    floors: [F(1, 'wk1', 'outdoor', 0.6, 'Gym', ['bigHall', 'bodies', 'noAp'], 'Use mobile data for calls here.')] },
  { id: 'pe2', code: 'PE 2', name: 'PE Center 2', kind: 'area', fp: [112, 522, 239, 81], mk: [292, 566], node: 'pk1',
    floors: [F(1, 'wk2', 'outdoor', 0.6, 'Gym', ['bigHall', 'distance'], 'Use mobile data here, or walk to the courtyard buildings for Wi-Fi.')] },
  { id: 'park', code: 'P', name: 'Parking Area', short: 'Parking', kind: 'area', fp: [112, 612, 239, 306], mk: [231, 800], node: 'pk2',
    floors: [F(1, 'wk2', 'outdoor', 0.4, 'Outdoor', ['outdoor', 'cars'], 'Not a Wi-Fi spot. Head inside before your call starts.')] },
  { id: 'mur', code: 'M', name: 'Murals Walkway', short: 'Murals', kind: 'area', fp: [517, 474, 68, 46], mk: [551, 505], node: 'mur',
    floors: [F(1, 'fr1', 'outdoor', 0.7, 'Covered walkway', ['borrowed', 'outdoor'], 'Fine for quick messages on your way to class.')] },
];

// Build one "spot" per building floor (and one per single-level area)
const SPOTS = [];
for (const pl of PLACES) {
  pl.isBldg = pl.kind === 'bldg';
  if (!pl.short) pl.short = pl.name;
  pl.spots = pl.floors.map((fl) => {
    const b = fl.q ? Q[fl.q] : null;
    const sp = {
      id: pl.id + '-' + fl.f, pid: pl.id, place: pl, f: fl.f, climb: pl.isBldg ? fl.f - 1 : 0,
      name: pl.isBldg ? pl.name + ' · ' + FL(fl.f) : pl.name,
      short: pl.isBldg ? pl.code + ' · ' + FS(fl.f) : pl.short,
      x: pl.mk[0], y: pl.mk[1], node: pl.node,
      profile: fl.profile, sens: fl.sens, type: fl.type, noService: !b,
      base: b ? { rssi: b[0], ping: b[1], jitter: b[2], down: b[3], up: b[4], loss: b[5] } : { rssi: -88, ping: null, jitter: null, down: 0, up: 0, loss: 100 },
      why: fl.why.map((k) => WHY[k]), tip: fl.tip, marks: fl.marks,
    };
    SPOTS.push(sp);
    return sp;
  });
}
const SPOT = Object.fromEntries(SPOTS.map((s) => [s.id, s]));
const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p]));
const MAXF = PLACES.reduce((m, p) => Math.max(m, p.spots.length), 1);
const BLDGS = PLACES.filter((p) => p.isBldg);
const AREAS = PLACES.filter((p) => !p.isBldg);

// Walkway graph, following the yellow pathways on the SSC map
const NODES = {
  gate: [550, 114], g1: [550, 142], w6: [507, 142], e6: [598, 142],
  b6d: [507, 330], wm: [507, 505], mur: [551, 505], em: [598, 505],
  p9x: [507, 562], c1: [507, 608], pk1: [352, 608], pk2: [230, 632], pe1d: [507, 700], c2: [507, 875],
  c4: [598, 578], b9d: [790, 578], c5: [906, 578], b5d: [906, 640], c6: [906, 783],
  c3: [657, 875], c7: [740, 875], c8: [850, 875], tcd: [850, 935],
  shd: [657, 955], j1: [657, 1032], b8d: [657, 1140], b3d: [657, 1226],
  srd: [409, 1032], b1d: [250, 1032], st1: [95, 1032], b2xd: [805, 1032], b4d: [852, 1032],
};
const EDGES = [
  ['gate', 'g1'], ['g1', 'w6'], ['g1', 'e6'], ['w6', 'b6d'], ['b6d', 'wm'], ['wm', 'mur'], ['mur', 'em'], ['e6', 'em'], ['em', 'c4'],
  ['wm', 'p9x'], ['p9x', 'c1'], ['c1', 'pk1'], ['pk1', 'pk2'], ['c1', 'pe1d'], ['pe1d', 'c2'], ['c2', 'c3'], ['c3', 'c7'], ['c7', 'c8'],
  ['c4', 'b9d'], ['b9d', 'c5'], ['c5', 'b5d'], ['b5d', 'c6'], ['c6', 'c8'],
  ['c3', 'shd'], ['shd', 'j1'], ['j1', 'b8d'], ['b8d', 'b3d'], ['j1', 'srd'], ['srd', 'b1d'], ['b1d', 'st1'],
  ['j1', 'b2xd'], ['b2xd', 'b4d'], ['c8', 'tcd'], ['tcd', 'b4d'],
];
const ORIGINS = [{ id: 'gate', name: 'Main Gate', node: 'gate', pos: [550, 150] }]
  .concat(PLACES.filter((p) => p.id !== 'mur').map((p) => ({ id: p.id, name: p.name, node: p.node, pos: NODES[p.node] })));
const ORIGIN = Object.fromEntries(ORIGINS.map((o) => [o.id, o]));
const M_PER_UNIT = 0.16; // map units to meters (schematic)
const STAIR_SEC = 20;    // seconds per flight of stairs

const ACTS = [
  { id: 'class', ico: 'video', name: 'Online class or video call', short: 'video calls', chip: 'Video calls', req: 'Ping under 90 ms, steady, 3 Mbps up',
    need: { ping: [35, 90], jitter: [10, 30], down: [6, 2], up: [3, 1], loss: [0.5, 2.5] } },
  { id: 'exam', ico: 'exam', name: 'Online quiz or exam', short: 'online exams', chip: 'Online exams', req: 'Very steady, almost no dropped packets',
    need: { ping: [45, 110], jitter: [8, 25], loss: [0.3, 1.5], down: [3, 1] } },
  { id: 'research', ico: 'search', name: 'Research and browsing', short: 'research', chip: 'Research', req: '3 Mbps or more down',
    need: { down: [8, 2], ping: [60, 200] } },
  { id: 'upload', ico: 'upload', name: 'Submit requirements', short: 'uploads', chip: 'Uploads', req: 'Fast upload, few drops',
    need: { up: [8, 2], loss: [0.5, 2.5], jitter: [15, 40] } },
  { id: 'canva', ico: 'palette', name: 'Canva and design apps', short: 'Canva', chip: 'Canva', req: '15 Mbps down, ping under 130 ms',
    need: { down: [15, 4], up: [4, 1.5], ping: [50, 130] } },
  { id: 'download', ico: 'download', name: 'Download big files', short: 'big downloads', chip: 'Big downloads', req: '30 Mbps or more down',
    need: { down: [30, 6] } },
];
const ACT = Object.fromEntries(ACTS.map((a) => [a.id, a]));
const METRIC_NAME = { ping: 'Ping', jitter: 'Stability', down: 'Download speed', up: 'Upload speed', loss: 'Dropped packets' };
const ISSUES = [['slow', 'Slow pages'], ['drops', 'Keeps disconnecting'], ['login', "Can't log in"], ['calls', 'Video calls lag'], ['none', 'No Wi-Fi at all']];
const ISSUE_NAME = Object.fromEntries(ISSUES);

/* =========================================================
   Wi-Fi model
   ========================================================= */
const STATUSES = [
  { key: 'dead', label: 'Dead zone', min: 0, bars: 0, rank: 0 },
  { key: 'weak', label: 'Weak', min: 25, bars: 1, rank: 1 },
  { key: 'fair', label: 'Fair', min: 45, bars: 2, rank: 2 },
  { key: 'good', label: 'Good', min: 65, bars: 3, rank: 3 },
  { key: 'excellent', label: 'Excellent', min: 80, bars: 4, rank: 4 },
];
const STATUS = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
function statusOf(score) { let s = STATUSES[0]; for (const st of STATUSES) if (score >= st.min) s = st; return s; }

function loadAt(profile, h) {
  const arr = PROFILES[profile];
  const x = clamp(h, H0, H1) - H0;
  const i = Math.floor(x), t = x - i;
  return lerp(arr[Math.min(i, arr.length - 1)], arr[Math.min(i + 1, arr.length - 1)], t);
}
function modelAt(sp, h) {
  const crowd = loadAt(sp.profile, h);
  if (sp.noService) return { rssi: -88, ping: null, jitter: null, down: 0, up: 0, loss: 100, crowd, none: true };
  const b = sp.base;
  const L = clamp(crowd * sp.sens, 0, 1.4), L2 = L * L;
  return {
    rssi: Math.round(b.rssi - 3 * L),
    ping: b.ping * (1 + 1.8 * L2),
    jitter: b.jitter * (1 + 2.2 * L2),
    down: Math.max(0.3, b.down * (1 - 0.55 * Math.min(L, 1))),
    up: Math.max(0.2, b.up * (1 - 0.5 * Math.min(L, 1))),
    loss: b.loss + 1.5 * L2 * L,
    crowd,
  };
}
function scoreOf(m) {
  if (!m || m.none) return 4;
  const parts = [];
  if (m.rssi != null) parts.push([0.25, clamp((m.rssi + 85) / 40 * 100, 0, 100)]);
  if (m.ping != null) parts.push([0.25, clamp(100 - (m.ping - 15) / 135 * 100, 0, 100)]);
  if (m.jitter != null) parts.push([0.15, clamp(100 - m.jitter / 40 * 100, 0, 100)]);
  if (m.down != null) parts.push([0.25, clamp(m.down / 40 * 100, 0, 100)]);
  if (m.loss != null) parts.push([0.10, clamp(100 - m.loss / 5 * 100, 0, 100)]);
  const w = parts.reduce((s, p) => s + p[0], 0);
  return w ? parts.reduce((s, p) => s + p[0] * p[1], 0) / w : 0;
}
const RATING_SCORE = [8, 32, 55, 74, 92];
const LIVE_MS = 3 * 3600e3;
const HIST_MS = 7 * 86400e3;

function liveFor(spotId, windowMs) {
  const since = Date.now() - windowMs;
  const rs = allReports().filter((r) => r.spot === spotId && r.at >= since);
  if (!rs.length) return null;
  const ping = median(rs.map((r) => r.ping)), jitter = median(rs.map((r) => r.jitter)), down = median(rs.map((r) => r.down)), up = median(rs.map((r) => r.up)), rssi = median(rs.map((r) => r.rssi));
  const ratings = rs.map((r) => r.rating).filter((v) => v >= 1 && v <= 5);
  const rating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const noWifi = rs.filter((r) => r.issues && r.issues.indexOf('none') >= 0).length;
  const hasM = ping != null || down != null || rssi != null;
  const s1 = hasM ? scoreOf({ ping, jitter, down, rssi }) : null;
  const s2 = rating != null ? RATING_SCORE[clamp(Math.round(rating), 1, 5) - 1] : null;
  let score = s1 != null && s2 != null ? s1 * 0.7 + s2 * 0.3 : (s1 != null ? s1 : s2);
  if (noWifi && noWifi >= rs.length / 2) score = Math.min(score == null ? 8 : score, 8);
  const lastHour = rs.filter((r) => r.at >= Date.now() - 3600e3 && r.issues && r.issues.indexOf('none') >= 0).length;
  return { count: rs.length, ping, jitter, down, up, rssi, rating, score, lastAt: Math.max.apply(null, rs.map((r) => r.at)), outage: lastHour >= 2, outageCount: lastHour };
}

function stateOf(sp, h) {
  const m = modelAt(sp, h);
  let score = scoreOf(m), source = 'sample', live = null, mm = m;
  if (state.viewingNow) {
    live = liveFor(sp.id, LIVE_MS);
    if (live && live.score != null) {
      score = live.score; source = 'live';
      mm = Object.assign({}, m, {
        ping: live.ping != null ? live.ping : m.ping,
        jitter: live.jitter != null ? live.jitter : m.jitter,
        down: live.down != null ? live.down : m.down,
        up: live.up != null ? live.up : m.up,
        rssi: live.rssi != null ? live.rssi : m.rssi,
        none: m.none && !(live.down > 0.5) && live.rssi == null,
        measured: { ping: live.ping != null, jitter: live.jitter != null, down: live.down != null, up: live.up != null, rssi: live.rssi != null },
      });
    }
  }
  return { m: mm, score, status: statusOf(score), source, live };
}

function satisfy(v, rng, higher) {
  const ideal = rng[0], min = rng[1];
  if (v == null || !isFinite(v)) return 0;
  if (higher) { if (v >= ideal) return 1; if (v <= min) return 0; return (v - min) / (ideal - min); }
  if (v <= ideal) return 1; if (v >= min) return 0; return (min - v) / (min - ideal);
}
function matchOf(m, act) {
  if (!m || (m.none && !(m.down > 0.5))) return { score: 0, worst: 'down' };
  let minS = 1, sum = 0, n = 0, worst = null;
  for (const k of Object.keys(act.need)) {
    const s = satisfy(m[k], act.need[k], k === 'down' || k === 'up');
    sum += s; n++;
    if (s < minS) { minS = s; worst = k; }
  }
  return { score: n ? minS * 0.6 + (sum / n) * 0.4 : 0, worst: minS < 0.999 ? worst : null };
}

const describe = {
  rssi: (v) => (v >= -50 ? 'Excellent' : v >= -60 ? 'Strong' : v >= -67 ? 'Good' : v >= -75 ? 'Weak' : 'Very weak'),
  ping: (v) => (v == null ? 'No connection' : v <= 20 ? 'Very low' : v <= 50 ? 'Low' : v <= 100 ? 'Medium' : v <= 150 ? 'High' : 'Very high'),
  jitter: (v) => (v == null ? 'No connection' : v <= 5 ? 'Steady' : v <= 15 ? 'Mostly steady' : v <= 30 ? 'Unsteady' : 'Choppy'),
  down: (v) => (v == null || v < 0.5 ? 'No connection' : v >= 30 ? 'Fast' : v >= 15 ? 'Good' : v >= 5 ? 'Okay' : v >= 1 ? 'Slow' : 'Very slow'),
  crowd: (v) => (v < 0.3 ? 'Quiet' : v < 0.55 ? 'Moderate' : v < 0.8 ? 'Busy' : 'Packed'),
};
const rssiBars = (v) => (v >= -55 ? 4 : v >= -63 ? 3 : v >= -70 ? 2 : v >= -78 ? 1 : 0);
const metricSt = {
  ping: (v) => (v == null ? 'dead' : v <= 25 ? 'excellent' : v <= 50 ? 'good' : v <= 90 ? 'fair' : v <= 150 ? 'weak' : 'dead'),
  down: (v) => (v == null || v < 0.5 ? 'dead' : v >= 30 ? 'excellent' : v >= 15 ? 'good' : v >= 6 ? 'fair' : v >= 2 ? 'weak' : 'dead'),
  jitter: (v) => (v == null ? 'dead' : v <= 6 ? 'excellent' : v <= 12 ? 'good' : v <= 22 ? 'fair' : v <= 35 ? 'weak' : 'dead'),
};

/* =========================================================
   Walking graph (shortest paths) + stairs
   ========================================================= */
const GRAPH = (() => {
  const ids = Object.keys(NODES);
  const idx = Object.fromEntries(ids.map((k, i) => [k, i]));
  const n = ids.length;
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  const next = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? j : -1)));
  for (const [a, b] of EDGES) {
    const i = idx[a], j = idx[b];
    const d = Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]);
    dist[i][j] = dist[j][i] = d; next[i][j] = j; next[j][i] = i;
  }
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (dist[i][k] + dist[k][j] < dist[i][j]) { dist[i][j] = dist[i][k] + dist[k][j]; next[i][j] = next[i][k]; }
  }
  function path(a, b) {
    let i = idx[a]; const j = idx[b];
    if (next[i][j] === -1) return [a];
    const out = [a];
    while (i !== j) { i = next[i][j]; out.push(ids[i]); }
    return out;
  }
  return { d: (a, b) => dist[idx[a]][idx[b]], path };
})();
function walkSec(node, sp) {
  const px = GRAPH.d(node, sp.node) + Math.hypot(NODES[sp.node][0] - sp.x, NODES[sp.node][1] - sp.y);
  return (px * M_PER_UNIT) / 1.2 + sp.climb * STAIR_SEC;
}
function walkFromNode(node, sp) { return Math.max(1, Math.round(walkSec(node, sp) / 60)); }
const walkMin = (sp) => walkFromNode(ORIGIN[state.origin].node, sp);
const climbTxt = (sp) => (sp.climb ? sp.climb + ' flight' + (sp.climb > 1 ? 's' : '') + ' up' : 'no stairs');

/* =========================================================
   State
   ========================================================= */
const state = {
  view: 'map',
  hour: 14, nowHour: 14, campusOpen: true, viewingNow: true,
  selected: null,
  floor: 'all',
  origin: store.get('origin', 'gate'),
  layers: { heat: true, rings: true, labels: true, strong: false },
  follow: new Set(store.get('follow', ['sh-1']).filter((id) => typeof id === 'string')),
  prefs: Object.assign({ near: true, dead: true, crowd: true, outage: true, follow: true }, store.get('prefs', {})),
  seen: new Set(store.get('seen', [])),
  events: [],
  find: { act: store.get('act', 'class'), nearby: true, noStairs: false, all: false },
  shared: [], local: store.get('reports', []), tests: store.get('tests', []),
  db: null, uid: null, canWrite: null, dbReady: false,
  snap: new Map(),
  routeTo: null,
  playing: false,
};
for (const id of Array.from(state.follow)) if (!SPOT[id]) state.follow.delete(id);
if (!ORIGIN[state.origin]) state.origin = 'gate';
if (!ACT[state.find.act]) state.find.act = 'class';
state.local = (Array.isArray(state.local) ? state.local : []).map((r) => sanitizeReport(r && r.id, r)).filter(Boolean);
state.tests = Array.isArray(state.tests) ? state.tests.filter((t) => t && isFinite(t.at)).slice(-20) : [];

function allReports() {
  const seen = new Set();
  const out = [];
  for (const r of state.shared.concat(state.local)) { if (!seen.has(r.id)) { seen.add(r.id); out.push(r); } }
  return out;
}
function sanitizeReport(id, d) {
  if (!d || typeof d !== 'object' || !SPOT[d.spot]) return null;
  const num = (v, a, b) => (typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : null);
  const at = num(d.at, 0, Date.now() + 60e3);
  if (!at) return null;
  return {
    id: String(id || d.id || uid8()).slice(0, 64),
    spot: d.spot,
    ping: num(d.ping, 0, 5000), jitter: num(d.jitter, 0, 5000), down: num(d.down, 0, 5000), up: num(d.up, 0, 5000),
    rssi: typeof d.rssi === 'number' && isFinite(d.rssi) && d.rssi < 0 && d.rssi > -127 ? Math.round(d.rssi) : null,
    band: typeof d.band === 'string' ? d.band.slice(0, 8) : null,
    rating: d.rating >= 1 && d.rating <= 5 ? Math.round(d.rating) : null,
    issues: Array.isArray(d.issues) ? d.issues.filter((x) => ISSUE_NAME[x]).slice(0, 5) : [],
    note: typeof d.note === 'string' ? d.note.slice(0, 120) : '',
    at, by: typeof d.by === 'string' ? d.by.slice(0, 128) : null,
    local: !!d.local,
  };
}

function manilaNow() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const hh = +parts.find((p) => p.type === 'hour').value, mm = +parts.find((p) => p.type === 'minute').value;
    return (hh % 24) + mm / 60;
  } catch (e) { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
}
function refreshClock() {
  const n = manilaNow();
  state.nowHour = n;
  state.campusOpen = n >= H0 && n <= H1;
}
const nowSlot = () => clamp(Math.round(state.nowHour * 4) / 4, H0, H1);

function computeSnapshot() {
  state.viewingNow = state.campusOpen && Math.abs(state.hour - nowSlot()) < 0.13;
  const snap = new Map();
  for (const sp of SPOTS) snap.set(sp.id, stateOf(sp, state.hour));
  state.snap = snap;
}
const S = (id) => state.snap.get(id);
const ranked = (pool) => (pool || SPOTS).slice().sort((a, b) => S(b.id).score - S(a.id).score);
const bestOf = (pl) => pl.spots.reduce((a, b) => (S(b.id).score > S(a.id).score ? b : a));
function floorPool() {
  if (state.floor === 'all') return SPOTS;
  const f = +state.floor;
  return SPOTS.filter((s) => (s.place.isBldg ? s.f === f : f === 1));
}
function shownSpot(pl) {
  if (state.selected && SPOT[state.selected].pid === pl.id) return SPOT[state.selected];
  if (state.floor === 'all') return bestOf(pl);
  const f = +state.floor;
  if (!pl.isBldg) return f === 1 ? pl.spots[0] : null;
  return pl.spots.find((s) => s.f === f) || null;
}
function bestNear(fromNode, pool) {
  let best = null, bestV = -Infinity;
  for (const sp of (pool || SPOTS)) {
    const v = S(sp.id).score - (fromNode ? walkSec(fromNode, sp) / 60 * 2.2 : 0);
    if (v > bestV) { bestV = v; best = sp; }
  }
  return best;
}
function betterSpotFor(sp) {
  let best = null, bestW = Infinity;
  for (const o of SPOTS) {
    if (o.id === sp.id) continue;
    const st = S(o.id);
    if (st.score < 65) continue;
    const w = walkSec(sp.node, o) / 60 + (st.score >= 80 ? -0.4 : 0) - (o.pid === sp.pid ? 0.3 : 0);
    if (w < bestW) { bestW = w; best = o; }
  }
  return best;
}
function summaryOf(sp) {
  const st = S(sp.id);
  const plus = sp.why.filter((w) => w.k === '+').map((w) => w.t.toLowerCase());
  const minus = sp.why.filter((w) => w.k === '-').map((w) => w.t.toLowerCase());
  const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '');
  if (sp.noService) return 'Students have reported no Wi-Fi here. Plan to use mobile data or download what you need first.';
  if (st.score >= 65) return 'Strong here because of ' + list(plus.length ? plus : ['a nearby access point']) + '.' + (minus.length ? ' Watch out for ' + list(minus) + '.' : '');
  if (st.score >= 45) return (plus.length ? 'Helped by ' + list(plus) + ', ' : '') + 'held back by ' + list(minus.length ? minus : ['busy hours']) + '.';
  return 'Weak here because of ' + list(minus.length ? minus : ['distance from the access points']) + '.';
}

/* =========================================================
   Map — drawn from the SSC campus map (Aurora Blvd on top)
   ========================================================= */
const svg = $('#map');
const placeEls = new Map();
const VBW = 1000, VBH = 1440, ASPECT = VBH / VBW;
let vb = { x: 0, y: 0, w: VBW, h: VBH };
let markerK = 1;
let userMoved = false; // becomes true once the map is panned, zoomed or focused

function placeBase(p) {
  const [x, y, w, h] = p.fp;
  let g = '<g class="bld' + (p.isBldg ? '' : ' area') + '" data-b="' + p.id + '">' +
    '<rect class="side" x="' + x + '" y="' + (y + 7) + '" width="' + w + '" height="' + h + '" rx="10"/>' +
    '<rect class="top" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/>' +
    '<rect class="roof" x="' + (x + 7) + '" y="' + (y + 7) + '" width="' + (w - 14) + '" height="' + (h - 14) + '" rx="6"/>';
  const long = p.code.length > 3;
  const fs = long ? 14 : 18;
  const bw = Math.round(p.code.length * fs * 0.6 + 14), bh = fs + 9;
  g += '<rect class="code-bg" x="' + (x + 6) + '" y="' + (y + 6) + '" width="' + bw + '" height="' + bh + '" rx="' + (bh / 2) + '"/>' +
    '<text class="code" x="' + (x + 6 + bw / 2).toFixed(1) + '" y="' + (y + 6 + bh / 2 + fs * 0.36).toFixed(1) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(p.code) + '</text>';
  if (!p.isBldg) g += '<text class="aname" x="' + (x + 8) + '" y="' + (y + bh + 24) + '">' + esc(p.mapName || p.name) + '</text>';
  return g + '</g>';
}
function placeMarkup(pl) {
  const n = pl.spots.length;
  let extra = '';
  if (pl.isBldg) {
    const H = n * 7 - 1.5;
    let stack = '';
    for (let i = 0; i < n; i++) stack += '<rect class="fs" x="0" y="' + (-H / 2 + (n - 1 - i) * 7).toFixed(1) + '" width="8" height="5.5" rx="1.6"/>';
    extra = '<g class="fbadge" transform="translate(-31 -23)"><rect x="0" y="0" width="23" height="14" rx="7"/><text x="11.5" y="10.2" text-anchor="middle">GF</text></g>' +
      '<g class="fstack" transform="translate(20 0)">' + stack + '</g>';
  }
  return '<g class="spot" data-pid="' + pl.id + '" transform="translate(' + pl.mk[0] + ' ' + pl.mk[1] + ')" tabindex="0" role="button" aria-label="' + esc(pl.name) + '">' +
    '<g class="mk"><g class="pop">' +
    '<circle class="hit" r="26"/>' +
    '<circle class="ripple" r="15"/><circle class="ripple r2" r="15"/>' +
    '<circle class="live-ring" r="21"/>' +
    '<circle class="pin" r="15"/>' +
    '<path class="g-arc" d="M-2.83 4.37A4 4 0 0 1 2.83 4.37"/>' +
    '<path class="g-arc" d="M-5.66 1.54A8 8 0 0 1 5.66 1.54"/>' +
    '<path class="g-arc" d="M-8.49 -1.29A12 12 0 0 1 8.49 -1.29"/>' +
    '<circle class="g-dot" cy="7.2" r="1.9"/>' +
    '<path class="g-x" d="M-6.5 -6.5L6.5 6.5"/>' +
    '</g>' + extra +
    '<g class="lbl" transform="translate(0 27)"><rect x="-40" y="0" width="80" height="22" rx="11"/><circle class="lbl-dot" cx="-29" cy="11" r="4"/><text x="-21" y="15.4">' + esc(pl.short) + '</text></g>' +
    '</g></g>';
}

function buildMap() {
  const P = [];
  P.push('<defs>' +
    '<pattern id="pGrid" width="25" height="25" patternUnits="userSpaceOnUse"><path class="m-gridline" d="M25 0H0V25"/></pattern>' +
    '<pattern id="pGrid5" width="125" height="125" patternUnits="userSpaceOnUse"><path class="m-gridline major" d="M125 0H0V125"/></pattern>' +
    '<pattern id="pHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="m-hatch-bg" width="12" height="12"/><rect class="m-hatch" width="5" height="12"/></pattern>' +
    PLACES.map((p) => '<radialGradient id="hg-' + p.id + '" class="hg"><stop offset="0" class="hs0"/><stop offset=".5" class="hs1"/><stop offset="1" class="hs2"/></radialGradient>').join('') +
    '</defs>');
  P.push('<rect class="m-ground" x="-1600" y="-1600" width="4200" height="4800"/>');
  P.push('<rect x="-1600" y="-1600" width="4200" height="4800" fill="url(#pGrid)"/><rect x="-1600" y="-1600" width="4200" height="4800" fill="url(#pGrid5)"/>');
  // neighbouring lots (not part of the campus)
  const blocks = [
    [-700, -520, 705, 540], [15, -520, 480, 540], [515, -520, 480, 540], [1015, -520, 700, 540],
    [-700, 130, 705, 470], [-700, 620, 705, 460], [-700, 1100, 705, 700],
    [112, 126, 380, 378], [616, 126, 369, 308],
    [112, 1074, 436, 400], [776, 1198, 210, 270], [1006, 126, 700, 1360], [-700, 1490, 2400, 400],
  ];
  P.push('<g>' + blocks.map((b) => '<rect class="m-block" x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="14"/>').join('') + '</g>');
  // streets: side street, then Aurora Blvd with the LRT-2 guideway above it
  P.push('<g>' +
    '<rect class="m-road" x="15" y="30" width="80" height="2100"/>' +
    '<line class="m-lane" x1="55" y1="124" x2="55" y2="2130"/>' +
    '<rect class="m-road" x="-1600" y="30" width="4200" height="82"/>' +
    '<line class="m-lane" x1="-1600" y1="43" x2="2600" y2="43"/><line class="m-lane" x1="-1600" y1="84" x2="2600" y2="84"/>' +
    '<rect class="m-rail" x="-1600" y="54" width="4200" height="18" rx="3"/>' +
    '<line class="m-rail-top" x1="-1600" y1="63" x2="2600" y2="63" stroke-dasharray="3 9" stroke-width="13"/>' +
    '<text class="m-roadlabel" x="150" y="104">AURORA BLVD.</text><text class="m-roadlabel" x="730" y="104">AURORA BLVD.</text>' +
    '<rect class="m-rail" x="880" y="52" width="62" height="22" rx="4"/><text class="m-raillabel" x="911" y="67" text-anchor="middle">LRT-2</text>' +
    '</g>');
  // campus grounds, courtyard, garden, parking, construction
  P.push('<path class="m-campus" d="M498 112H602V444H990V1116H858V1186H762V1430H612V1230H556V1060H100V516H498Z"/>');
  P.push('<rect class="m-court" x="526" y="522" width="374" height="346" rx="14"/>');
  let trees = '';
  [[560, 640], [560, 700], [560, 760], [586, 820], [878, 818]].forEach((t, i) => { trees += '<circle class="' + (i % 2 ? 'm-tree' : 'm-tree-2') + '" cx="' + t[0] + '" cy="' + t[1] + '" r="9"/>'; });
  P.push('<rect class="m-garden" x="621" y="740" width="229" height="34" rx="8"/>' + trees);
  for (let gx = 640; gx <= 835; gx += 39) P.push('<circle class="m-tree" cx="' + gx + '" cy="757" r="8"/>');
  let stalls = '';
  for (let y = 680; y <= 900; y += 24) stalls += '<line class="m-stall" x1="114" y1="' + y + '" x2="160" y2="' + y + '"/><line class="m-stall" x1="303" y1="' + y + '" x2="349" y2="' + y + '"/>';
  P.push('<g><rect class="m-parking" x="112" y="612" width="239" height="306" rx="10"/>' + stalls + '<text class="m-smalllabel" x="231" y="650" text-anchor="middle">PARKING AREA</text></g>');
  P.push('<g><rect x="355" y="787" width="140" height="99" rx="10" fill="url(#pHatch)" class="m-uc"/><text class="m-smalllabel" x="425" y="832" text-anchor="middle">UNDER</text><text class="m-smalllabel" x="425" y="848" text-anchor="middle">CONSTRUCTION</text></g>');
  // walkways (the yellow pathways on the SSC map)
  const walks = ['M550 112V142', 'M507 142H598', 'M507 142V875', 'M598 142V578', 'M507 505H598', 'M598 578H906V783L850 875', 'M507 875H850', 'M657 875V1226', 'M95 1032H852', 'M850 875V1032', 'M507 608H230V640'];
  P.push('<g>' + walks.map((d) => '<path class="m-walk" d="' + d + '"/>').join('') + walks.map((d) => '<path class="m-walk-dash" d="' + d + '"/>').join('') + '</g>');
  // buildings and named areas
  P.push('<g id="blds">' + PLACES.filter((p) => p.id !== 'mur' && p.id !== 'park').map(placeBase).join('') + '</g>');
  // main gate
  P.push('<g class="gate"><circle class="m-gate-c" cx="550" cy="112" r="14"/><path class="m-gate-a" d="M550 104V119M544.5 113.5L550 119.2L555.5 113.5"/><text class="m-gatelabel" x="572" y="104">MAIN GATE</text></g>');
  // heat, route, markers, you, radar
  P.push('<g class="heat" id="heat">' + PLACES.map((p) => '<circle data-id="' + p.id + '" cx="' + p.mk[0] + '" cy="' + p.mk[1] + '" r="70" fill="url(#hg-' + p.id + ')"/>').join('') + '</g>');
  P.push('<g id="routeLayer"><path class="route-under" id="routeUnder" d="" vector-effect="non-scaling-stroke"/><path class="route" id="routePath" d="" vector-effect="non-scaling-stroke"/><g class="route-tag" id="routeTag" style="display:none"><g id="routeTagInner"><rect x="-44" y="-13" width="88" height="26" rx="13"/><text id="routeTagText" x="0" y="4.5" text-anchor="middle"></text></g></g></g>');
  P.push('<g id="spots">' + PLACES.map(placeMarkup).join('') + '</g>');
  P.push('<g class="you" id="you"><g id="youMk"><circle class="you-halo" r="20"/><circle class="you-dot" r="8"/><g class="you-label"><rect x="-21" y="-36" width="42" height="18" rx="9"/><text x="0" y="-23.5" text-anchor="middle">YOU</text></g></g></g>');
  let radar = '<g id="radar" transform="translate(545 760)" style="opacity:0;pointer-events:none">';
  [180, 360, 540, 720].forEach((r) => { radar += '<circle class="radar-ring" r="' + r + '"/>'; });
  radar += '<g id="radarSweep">';
  const R = 1500;
  for (let i = 0; i < 10; i++) {
    const a1 = (-40 + i * 4) * Math.PI / 180, a2 = (-40 + (i + 1) * 4) * Math.PI / 180;
    radar += '<path class="radar-slice" style="opacity:' + (0.015 + i * 0.022).toFixed(3) + '" d="M0 0L' + (R * Math.cos(a1)).toFixed(1) + ' ' + (R * Math.sin(a1)).toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + (R * Math.cos(a2)).toFixed(1) + ' ' + (R * Math.sin(a2)).toFixed(1) + 'Z"/>';
  }
  radar += '<line class="radar-line" x1="0" y1="0" x2="' + R + '" y2="0"/></g></g>';
  P.push(radar);
  svg.innerHTML = P.join('');

  for (const pl of PLACES) {
    const g = svg.querySelector('.spot[data-pid="' + pl.id + '"]');
    placeEls.set(pl.id, {
      g, mk: g.querySelector('.mk'), arcs: g.querySelectorAll('.g-arc'),
      heat: svg.querySelector('#heat circle[data-id="' + pl.id + '"]'), grad: svg.querySelector('#hg-' + pl.id),
      lblRect: g.querySelector('.lbl rect'), lblText: g.querySelector('.lbl text'), lblDot: g.querySelector('.lbl .lbl-dot'),
      badgeT: g.querySelector('.fbadge text'), stack: Array.from(g.querySelectorAll('.fstack .fs')),
    });
  }
  sizeLabels();
}
function sizeLabels() {
  for (const pl of PLACES) {
    const e = placeEls.get(pl.id);
    let w = 0;
    try { w = e.lblText.getComputedTextLength(); } catch (err) { w = 0; }
    if (!w) w = e.lblText.textContent.length * 6.9;
    const total = w + 30;
    e.lblRect.setAttribute('x', (-total / 2).toFixed(1));
    e.lblRect.setAttribute('width', total.toFixed(1));
    e.lblDot.setAttribute('cx', (-total / 2 + 11).toFixed(1));
    e.lblText.setAttribute('x', (-total / 2 + 20).toFixed(1));
  }
}

function updateMapStatus() {
  for (const pl of PLACES) {
    const e = placeEls.get(pl.id);
    const sp = shownSpot(pl);
    const st = sp ? S(sp.id) : null;
    const key = st ? st.status.key : 'none';
    e.g.dataset.st = key;
    e.g.classList.toggle('nofloor', !sp);
    const col = sp ? 'var(--q-' + key + ')' : 'var(--line-2)';
    e.g.style.setProperty('--c', col);
    e.grad.style.setProperty('--c', col);
    const lit = !sp || key === 'dead' ? 0 : Math.min(3, st.status.bars);
    e.arcs.forEach((a, i) => a.classList.toggle('on', i < lit));
    e.g.classList.toggle('is-live', !!st && st.source === 'live');
    e.g.classList.toggle('dim', !!st && state.layers.strong && st.score < 65);
    e.heat.setAttribute('r', !sp ? '0' : (key === 'dead' ? 58 : 40 + st.score * 0.56).toFixed(1));
    if (e.badgeT) e.badgeT.textContent = sp ? FS(sp.f) : '—';
    if (pl.isBldg) {
      e.stack.forEach((r, i) => {
        const s = pl.spots[i];
        r.style.fill = 'var(--q-' + S(s.id).status.key + ')';
        r.classList.toggle('cur', !!sp && s.f === sp.f);
      });
    }
    const txt = pl.short + (pl.isBldg && sp ? ' · ' + FS(sp.f) : '');
    if (e.lblText.textContent !== txt) { e.lblText.textContent = txt; e.lblDirty = true; }
    e.g.setAttribute('aria-label', pl.name + (sp ? (pl.isBldg ? ', ' + FL(sp.f) : '') + ', ' + st.status.label + (st.source === 'live' ? ', from student tests' : '') : ', no ' + FL(+state.floor).toLowerCase()));
  }
  if (Array.from(placeEls.values()).some((e) => e.lblDirty)) { sizeLabels(); placeEls.forEach((e) => { e.lblDirty = false; }); }
  $('#heat').classList.toggle('off', !state.layers.heat);
  svg.classList.toggle('rings-off', !state.layers.rings);
  $$('.floorpick button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.floor === String(state.floor))));
}

function mapRect() { return svg.getBoundingClientRect(); }
function ppu() { const r = mapRect(); if (!r.width || !r.height) return 1; return Math.min(r.width / vb.w, r.height / vb.h); }
function applyVB() {
  svg.setAttribute('viewBox', vb.x.toFixed(2) + ' ' + vb.y.toFixed(2) + ' ' + vb.w.toFixed(2) + ' ' + vb.h.toFixed(2));
  updateMarkerScale();
}
function updateMarkerScale() {
  const p = ppu();
  const k = clamp((isWide() ? 13 : 10.5) / (p * 15), 0.7, 3.4);
  if (Math.abs(k - markerK) > 0.004) {
    markerK = k;
    const t = 'scale(' + k.toFixed(3) + ')';
    for (const e of placeEls.values()) e.mk.setAttribute('transform', t);
    $('#youMk').setAttribute('transform', t);
    $('#routeTagInner').setAttribute('transform', t);
  }
  svg.classList.toggle('labels-on', state.layers.labels && p >= 1.05);
  svg.classList.toggle('stacks-on', p >= 0.45);
  svg.classList.toggle('badges-on', p >= 0.42);
  svg.classList.toggle('names-on', p >= 0.8);
}
function clampVB() {
  vb.w = clamp(vb.w, 230, 1500); vb.h = vb.w * ASPECT;
  const cx = clamp(vb.x + vb.w / 2, -40, VBW + 40), cy = clamp(vb.y + vb.h / 2, -40, VBH + 40);
  vb.x = cx - vb.w / 2; vb.y = cy - vb.h / 2;
}
function clientToSvg(cx, cy) {
  const r = mapRect(), s = ppu();
  const ox = r.left + (r.width - vb.w * s) / 2, oy = r.top + (r.height - vb.h * s) / 2;
  return { x: vb.x + (cx - ox) / s, y: vb.y + (cy - oy) / s };
}
function zoomAt(factor, cx, cy) {
  const p = clientToSvg(cx, cy);
  const nw = clamp(vb.w / factor, 230, 1500);
  const f = vb.w / nw;
  vb = { x: p.x - (p.x - vb.x) / f, y: p.y - (p.y - vb.y) / f, w: nw, h: nw * ASPECT };
  clampVB(); applyVB();
}
let vbAnim = 0;
function animateVB(target, dur) {
  cancelAnimationFrame(vbAnim);
  const t = { x: target.x, y: target.y, w: target.w, h: target.w * ASPECT };
  if (RM || !dur) { vb = t; clampVB(); applyVB(); return; }
  const from = Object.assign({}, vb), t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    vb = { x: lerp(from.x, t.x, e), y: lerp(from.y, t.y, e), w: lerp(from.w, t.w, e), h: lerp(from.h, t.h, e) };
    applyVB();
    if (p < 1) vbAnim = requestAnimationFrame(step);
  };
  vbAnim = requestAnimationFrame(step);
}
function overlayOffsets() {
  // pixels covered at the top (time card) and bottom (sheet) on phones
  if (isWide()) return { top: 0, bottom: 0 };
  const tc = $('#timecard').getBoundingClientRect(), r = mapRect();
  return { top: Math.max(0, tc.bottom - r.top + 6), bottom: sheetPx() };
}
function viewFor(cx, cy, scaleTarget) {
  const r = mapRect();
  const base = Math.min(r.width, r.height / ASPECT) || VBW;
  const w = clamp(base / scaleTarget, 230, 1500);
  const s = Math.min(r.width / w, r.height / (w * ASPECT)) || 1;
  const o = overlayOffsets();
  const shift = (o.bottom - o.top) / 2 / s;
  return { x: cx - w / 2, y: cy + shift - (w * ASPECT) / 2, w };
}
function fitCampus(dur) {
  const r = mapRect();
  if (!r.width) return;
  if (isWide()) { animateVB({ x: 0, y: 0, w: VBW }, dur); return; }
  // phones: fit the campus width and keep it clear of the time card and the sheet
  animateVB(viewFor(540, 770, r.width / 960), dur);
}
function focusSpot(sp, dur) {
  userMoved = true;
  const r = mapRect();
  const base = Math.min(r.width, r.height / ASPECT) || VBW;
  const cur = base / vb.w;
  const want = isWide() ? clamp(cur, 0.95, 1.35) : clamp(cur, 0.7, 1.1);
  animateVB(viewFor(sp.x, sp.y, want), dur == null ? 600 : dur);
}
function fitPoints(pts, dur) {
  userMoved = true;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min.apply(null, xs) - 70, maxX = Math.max.apply(null, xs) + 70;
  const minY = Math.min.apply(null, ys) - 70, maxY = Math.max.apply(null, ys) + 70;
  const r = mapRect();
  const o = overlayOffsets();
  const availH = Math.max(120, r.height - o.top - o.bottom);
  const s = Math.min(r.width / (maxX - minX), availH / (maxY - minY));
  animateVB(viewFor((minX + maxX) / 2, (minY + maxY) / 2, clamp(s, 0.2, isWide() ? 1.3 : 1.05)), dur);
}

function setupMapInput() {
  const pointers = new Map();
  let start = null, pinch = null, moved = false, downSpot = null;
  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    cancelAnimationFrame(vbAnim);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (pointers.size === 1) {
      moved = false;
      downSpot = e.target.closest ? e.target.closest('.spot') : null;
      start = { x: e.clientX, y: e.clientY, vb: Object.assign({}, vb) };
    } else if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), w: vb.w };
      moved = true;
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2 && pinch) {
      const [a, b] = Array.from(pointers.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const targetW = clamp(pinch.w * pinch.d / Math.max(20, d), 230, 1500);
      userMoved = true;
      zoomAt(vb.w / targetW, mid.x, mid.y);
      return;
    }
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true; userMoved = true;
    svg.classList.add('dragging');
    const s = ppu();
    vb = { x: start.vb.x - dx / s, y: start.vb.y - dy / s, w: vb.w, h: vb.h };
    clampVB(); applyVB();
  });
  const end = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 1) {
      const p = Array.from(pointers.values())[0];
      start = { x: p.x, y: p.y, vb: Object.assign({}, vb) };
      return;
    }
    if (pointers.size === 0) {
      svg.classList.remove('dragging');
      if (!moved && downSpot && e.type === 'pointerup') openPlace(downSpot.dataset.pid);
      start = null; downSpot = null;
    }
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', (e) => {
    e.preventDefault(); userMoved = true;
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY);
  }, { passive: false });
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest && e.target.closest('.spot');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPlace(g.dataset.pid); }
  });
  $('#zoomIn').addEventListener('click', () => { userMoved = true; const r = mapRect(); zoomAt(1.45, r.left + r.width / 2, r.top + r.height / 2); });
  $('#zoomOut').addEventListener('click', () => { userMoved = true; const r = mapRect(); zoomAt(1 / 1.45, r.left + r.width / 2, r.top + r.height / 2); });
  $('#zoomFit').addEventListener('click', () => fitCampus(550));
}
function openPlace(pid) {
  const pl = PLACE[pid];
  if (!pl) return;
  let sp = shownSpot(pl);
  if (!sp) sp = pl.spots[Math.min(pl.spots.length, +state.floor || 1) - 1] || bestOf(pl);
  selectSpot(sp.id, { focus: true });
}
function setFloor(f) {
  state.floor = f === 'all' ? 'all' : String(f);
  if (state.selected && state.floor !== 'all') {
    const cur = SPOT[state.selected];
    const pl = cur.place;
    const want = pl.isBldg ? pl.spots.find((s) => s.f === +state.floor) : (+state.floor === 1 ? pl.spots[0] : null);
    if (want && want.id !== cur.id) { selectSpot(want.id, { keepSheet: true }); return; }
  }
  updateMapStatus();
  renderPanel({ keepScroll: true, quiet: true });
  updateAlertStrip();
}

function updateYou() {
  const p = ORIGIN[state.origin].pos;
  $('#you').setAttribute('transform', 'translate(' + p[0] + ' ' + p[1] + ')');
}
function drawRoute(sp) {
  const under = $('#routeUnder'), path = $('#routePath'), tag = $('#routeTag');
  if (!sp) {
    state.routeTo = null;
    under.setAttribute('d', ''); path.setAttribute('d', ''); tag.style.display = 'none';
    return null;
  }
  state.routeTo = sp.id;
  const o = ORIGIN[state.origin];
  const nodes = GRAPH.path(o.node, sp.node);
  const pts = [o.pos].concat(nodes.map((n) => NODES[n])).concat([[sp.x, sp.y]])
    .filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 0.5);
  const d = 'M' + pts.map((p) => p[0] + ' ' + p[1]).join('L');
  under.setAttribute('d', d); path.setAttribute('d', d);
  const label = walkMin(sp) + ' min' + (sp.climb ? ' · ' + FS(sp.f) : ' walk');
  $('#routeTagText').textContent = label;
  const tw = label.length * 7.4 + 22;
  const rect = tag.querySelector('rect');
  rect.setAttribute('x', (-tw / 2).toFixed(1)); rect.setAttribute('width', tw.toFixed(1));
  let mid = [sp.x, sp.y];
  try { const L = path.getTotalLength(); const q = path.getPointAtLength(L * 0.5); mid = [q.x, q.y]; } catch (err) { /* keep spot position */ }
  tag.setAttribute('transform', 'translate(' + mid[0].toFixed(1) + ' ' + mid[1].toFixed(1) + ')');
  tag.style.display = '';
  path.classList.remove('ants');
  if (!RM) {
    let len = 0;
    try { len = path.getTotalLength() * ppu(); } catch (err) { len = 800; }
    path.style.transition = 'none';
    path.style.strokeDasharray = len + ' ' + len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 1s cubic-bezier(.4,.1,.2,1)';
    path.style.strokeDashoffset = '0';
    setTimeout(() => { path.style.transition = ''; path.style.strokeDasharray = ''; path.style.strokeDashoffset = ''; path.classList.add('ants'); }, 1050);
  } else {
    path.classList.add('ants');
  }
  return pts;
}

function radarIntro() {
  if (RM) return;
  const wrap = $('#radar'), sweep = $('#radarSweep');
  wrap.style.transition = 'none'; wrap.style.opacity = '1';
  const dur = 2300, t0 = performance.now();
  for (const pl of PLACES) {
    let a = Math.atan2(pl.mk[1] - 760, pl.mk[0] - 545) * 180 / Math.PI;
    a = (a + 90 + 360) % 360;
    setTimeout(() => {
      const g = placeEls.get(pl.id).g;
      g.classList.add('reveal');
      setTimeout(() => g.classList.remove('reveal'), 800);
    }, a / 360 * dur);
  }
  const step = (now) => {
    const p = (now - t0) / dur;
    if (p >= 1) { wrap.style.transition = 'opacity .7s'; wrap.style.opacity = '0'; return; }
    sweep.setAttribute('transform', 'rotate(' + (-90 + p * 360).toFixed(2) + ')');
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* =========================================================
   Panel: overview + building/floor detail (side panel / bottom sheet)
   ========================================================= */
const panel = $('#panel'), panelScroll = $('#panelScroll'), viewMap = $('#view-map');
let sheetState = 'peek';
function sheetHeights() {
  const vh = viewMap.clientHeight || 600;
  return { peek: clamp(Math.round(vh * 0.32), 190, 236), half: Math.round(vh * 0.58), full: vh - 70 };
}
function sheetPx() { return isWide() ? 0 : (parseFloat(viewMap.style.getPropertyValue('--sheet-h')) || sheetHeights()[sheetState]); }
function setSheet(name) {
  sheetState = name;
  if (isWide()) { viewMap.style.removeProperty('--sheet-h'); return; }
  viewMap.style.setProperty('--sheet-h', sheetHeights()[name] + 'px');
}
function setupSheet() {
  const handle = $('#sheetHandle');
  let drag = null;
  handle.addEventListener('pointerdown', (e) => {
    if (isWide()) return;
    drag = { y: e.clientY, h: sheetPx(), t: performance.now(), moved: false };
    panel.classList.add('dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  handle.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = drag.y - e.clientY;
    if (Math.abs(dy) > 4) drag.moved = true;
    const H = sheetHeights();
    viewMap.style.setProperty('--sheet-h', clamp(drag.h + dy, 120, H.full) + 'px');
  });
  const end = (e) => {
    if (!drag) return;
    panel.classList.remove('dragging');
    const H = sheetHeights();
    if (!drag.moved) {
      setSheet(sheetState === 'peek' ? 'half' : sheetState === 'half' ? 'full' : 'peek');
    } else {
      const cur = sheetPx();
      const v = (drag.y - e.clientY) / Math.max(1, performance.now() - drag.t);
      let target = Object.keys(H).reduce((a, b) => (Math.abs(H[a] - cur) < Math.abs(H[b] - cur) ? a : b));
      if (v > 0.6) target = cur < H.half ? 'half' : 'full';
      if (v < -0.6) target = cur > H.half ? 'half' : 'peek';
      setSheet(target);
    }
    drag = null;
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheet(sheetState === 'peek' ? 'half' : sheetState === 'half' ? 'full' : 'peek'); }
  });
}

function ringSVG(score, big) {
  const r = 27, c = 2 * Math.PI * r;
  const off = c * (1 - clamp(score, 0, 100) / 100);
  return '<div class="ring' + (big ? ' lg' : '') + '"><svg viewBox="0 0 64 64"><circle class="trk" cx="32" cy="32" r="' + r + '"/><circle class="val" cx="32" cy="32" r="' + r + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + c.toFixed(2) + '" data-off="' + off.toFixed(2) + '"/></svg><b data-count="' + Math.round(score) + '">0</b></div>';
}
function barsHTML(n, st) { let s = '<span class="bars"' + (st ? ' data-st="' + st + '"' : '') + '>'; for (let i = 0; i < 4; i++) s += '<i' + (i < n ? ' class="on"' : '') + '></i>'; return s + '</span>'; }
function pill(st) { return '<span class="pill" data-st="' + st.key + '">' + st.label + '</span>'; }
function vstackHTML(pl, curId) {
  const best = bestOf(pl);
  return '<span class="vstack" aria-hidden="true">' + pl.spots.map((s) => '<i data-st="' + S(s.id).status.key + '"' + (s.id === curId || (!curId && s.id === best.id) ? ' class="cur"' : '') + '></i>').join('') + '</span>';
}
function sourceTag(st) {
  if (st.source === 'live') return '<span class="tag tag-live">Live · ' + st.live.count + ' test' + (st.live.count === 1 ? '' : 's') + '</span>';
  return '<span class="tag tag-sample">Sample · typical at ' + fmtHour(state.hour) + '</span>';
}
function animateIn(root) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.ring .val', root).forEach((c) => { c.style.strokeDashoffset = c.dataset.off; });
    $$('.meter i', root).forEach((m) => { m.style.width = m.dataset.w; });
    $$('[data-count]', root).forEach((el) => countUp(el, +el.dataset.count));
  }));
}
function countUp(el, to, dec) {
  if (RM) { el.textContent = dec ? to.toFixed(dec) : Math.round(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = dec ? (to * e).toFixed(dec) : Math.round(to * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderPanel(opts) {
  opts = opts || {};
  const keepScroll = opts.keepScroll ? panelScroll.scrollTop : 0;
  const roomVal = $('#roomIn') ? $('#roomIn').value : '';
  panel.classList.toggle('no-anim', !!opts.quiet);
  panelScroll.innerHTML = state.selected ? detailHTML(SPOT[state.selected]) : overviewHTML();
  bindPanel();
  if ($('#roomIn') && roomVal) $('#roomIn').value = roomVal;
  if (!opts.quiet) {
    panelScroll.classList.remove('pv-enter'); void panelScroll.offsetWidth; panelScroll.classList.add('pv-enter');
    animateIn(panelScroll);
  } else {
    $$('.ring .val', panelScroll).forEach((c) => { c.style.transition = 'none'; c.style.strokeDashoffset = c.dataset.off; });
    $$('.meter i', panelScroll).forEach((m) => { m.style.transition = 'none'; m.style.width = m.dataset.w; });
    $$('[data-count]', panelScroll).forEach((el) => { el.textContent = el.dataset.count; });
  }
  panelScroll.scrollTop = keepScroll;
}

function originOptions(sel) {
  return ORIGINS.map((o) => '<option value="' + o.id + '"' + (o.id === sel ? ' selected' : '') + '>' + esc(o.name) + '</option>').join('');
}
function allLiveCount() { let n = 0; for (const sp of SPOTS) if (S(sp.id).source === 'live') n++; return n; }
function avoidList(pool) {
  // group dead floors by building, then add weak spots
  const out = [];
  const deadBy = new Map();
  pool.forEach((sp) => { if (S(sp.id).status.key === 'dead') { if (!deadBy.has(sp.pid)) deadBy.set(sp.pid, []); deadBy.get(sp.pid).push(sp); } });
  deadBy.forEach((list, pid) => {
    const pl = PLACE[pid];
    const none = list.every((s) => s.noService);
    out.push({ id: list[0].id, txt: pl.isBldg ? pl.name + ' (' + (list.length === 1 ? FL(list[0].f).toLowerCase() : list.length + ' floors') + ', ' + (none ? 'no Wi' + NB + 'Fi' : 'dead zone') + ')' : pl.name + ' (dead zone)' });
  });
  ranked(pool).reverse().filter((sp) => S(sp.id).status.key === 'weak').slice(0, 3).forEach((sp) => out.push({ id: sp.id, txt: sp.name + ' (weak)' }));
  return out.slice(0, 4);
}

function overviewHTML() {
  const pool = floorPool();
  const onFloor = state.floor === 'all' ? '' : ' on the ' + FL(+state.floor).toLowerCase();
  const best = bestNear(ORIGIN[state.origin].node, pool);
  const bst = S(best.id);
  const counts = {};
  STATUSES.forEach((s) => { counts[s.key] = 0; });
  pool.forEach((sp) => { counts[S(sp.id).status.key]++; });
  const strong = counts.excellent + counts.good;
  const why1 = best.why.find((w) => w.k === '+');
  const live = allLiveCount();
  let h = '';
  h += '<div class="ov-head"><div><div class="eyebrow">' + (state.viewingNow ? 'Right now on campus' : 'Campus at ' + fmtHour(state.hour)) + '</div>' +
    '<h2>' + strong + ' of ' + pool.length + (state.floor === 'all' ? ' floors and spots' : ' spots' + onFloor) + ' have strong ' + WIFI + '</h2>' +
    '<div class="ov-sub">' + (live ? '<span class="tag tag-live">' + live + ' live</span>' : '') + '<span class="tag tag-sample">Sample · typical at ' + fmtHour(state.hour) + '</span></div></div></div>';
  h += '<form class="roomfind" id="roomForm" autocomplete="off" novalidate><label class="field-label" for="roomIn">Find your room</label>' +
    '<div class="rf-row"><span class="rf-ico">' + icon('hash') + '</span><input class="textin" id="roomIn" placeholder="e.g. Q-5203" maxlength="12" aria-describedby="roomHelp"><button class="btn btn-sm btn-primary" type="submit">Check</button></div>' +
    '<small class="rf-help" id="roomHelp">Q-5203 means Building 5, 2nd floor, room 03.</small></form>';
  h += '<div class="best" data-st="' + bst.status.key + '" data-go="' + best.id + '" role="button" tabindex="0" aria-label="Open ' + esc(best.name) + '">' +
    '<svg class="best-waves" viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="22"/><circle cx="90" cy="90" r="22"/><circle cx="90" cy="90" r="22"/></svg>' +
    '<div class="eyebrow">' + icon('star') + 'Best spot near you' + esc(onFloor) + '</div>' +
    '<div class="best-row">' + ringSVG(bst.score) + '<div style="min-width:0"><div class="best-name">' + esc(best.place.name) + '</div><div class="best-place">' + esc(best.place.isBldg ? FL(best.f) + ' · ' + best.type : best.type) + '</div></div></div>' +
    '<div class="best-meta"><span>' + icon('route') + walkMin(best) + ' min' + (best.climb ? ', ' + climbTxt(best) : ' walk') + '</span><span>' + icon('timer') + fmtMs(bst.m.ping) + ' ms ping</span><span>' + icon('download') + fmtMbps(bst.m.down) + ' Mbps</span></div>' +
    (why1 ? '<div class="best-meta"><span>' + icon('check') + 'Why: ' + esc(why1.t.toLowerCase()) + '</span></div>' : '') +
    '<div class="best-actions"><button class="btn btn-sm btn-primary" data-nav="' + best.id + '" type="button">' + icon('nav') + 'Take me there</button><button class="btn btn-sm" data-go="' + best.id + '" type="button">Details</button></div>' +
    '</div>';
  h += '<div class="narrow-only toggle-row"><div><b>You’re at</b><small>Walking times start here</small></div><select class="select" id="originSel2" aria-label="Where you are now">' + originOptions(state.origin) + '</select></div>';
  h += '<div class="section-title"><h3>' + WIFI + ' mix' + esc(onFloor) + '</h3><span class="faint" style="font-size:12.5px;font-weight:700">' + pool.length + ' spots</span></div>';
  h += '<div class="spectrum">' + STATUSES.slice().reverse().map((s) => (counts[s.key] ? '<i data-st="' + s.key + '" style="flex-grow:' + counts[s.key] + '" title="' + s.label + ': ' + counts[s.key] + '"></i>' : '')).join('') + '</div>';
  h += '<div class="spectrum-legend">' + STATUSES.slice().reverse().map((s) => '<span data-st="' + s.key + '">' + s.label + ' <b class="num">' + counts[s.key] + '</b></span>').join('') + '</div>';
  const avoid = avoidList(pool);
  if (avoid.length) h += '<div class="warn-card">' + icon('alert') + '<div><b>Avoid for now:</b> ' + avoid.map((a) => '<button type="button" data-go="' + a.id + '">' + esc(a.txt) + '</button>').join(', ') + '.</div></div>';
  const top = ranked(pool).slice(0, 8);
  h += '<div class="section-title"><h3>Strongest' + esc(onFloor) + ' right now</h3></div><ol class="rank-list">';
  top.forEach((sp, i) => {
    const st = S(sp.id);
    h += '<li><button class="rank-item" type="button" data-go="' + sp.id + '" data-st="' + st.status.key + '">' +
      '<span class="rank-n">' + (i + 1) + '</span>' +
      '<span style="min-width:0"><span class="rank-name" style="display:block">' + esc(sp.place.name) + (st.source === 'live' ? ' <span class="tag tag-live" style="height:20px">Live</span>' : '') + '</span><span class="rank-place" style="display:block">' + esc(sp.place.isBldg ? FL(sp.f) + ' · ' + sp.type : sp.type) + '</span>' +
      '<span class="scorebar" style="display:block"><i style="width:' + Math.round(st.score) + '%"></i></span></span>' +
      '<span class="rank-right">' + pill(st.status) + '<span class="rank-walk">' + walkMin(sp) + ' min' + (sp.climb ? ' · ' + FS(sp.f) : ' walk') + '</span></span>' +
      '</button></li>';
  });
  h += '</ol>';
  h += '<div class="section-title"><h3>Every building, floor by floor</h3></div><ul class="place-list">';
  const order = PLACES.slice().sort((a, b) => (a.isBldg === b.isBldg ? 0 : a.isBldg ? -1 : 1));
  order.forEach((pl) => {
    const b = bestOf(pl), bs = S(b.id);
    h += '<li><button class="place-row" type="button" data-go="' + b.id + '">' +
      '<span class="pcode">' + esc(pl.code) + '</span>' +
      '<span class="pinfo"><b>' + esc(pl.name) + '</b><small>' + (pl.isBldg ? pl.spots.length + ' floors · best: ' + FL(b.f).toLowerCase() : esc(b.type)) + '</small></span>' +
      '<span class="pr-right">' + (pl.isBldg ? vstackHTML(pl) : '') + pill(bs.status) + '</span>' +
      '</button></li>';
  });
  h += '</ul>';
  return h;
}

function hourChartSVG(sp) {
  const Wc = 320, Hc = 128, top = 10, base = 98, bw = 15;
  const step = (Wc - 20) / 15;
  let s = '<svg class="hourchart" viewBox="0 0 ' + Wc + ' ' + Hc + '" role="img" aria-label="Wi-Fi score by hour for ' + esc(sp.name) + '">';
  [25, 50, 75, 100].forEach((v) => { const y = base - (base - top) * v / 100; s += '<line class="grid" x1="6" x2="' + (Wc - 6) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; });
  for (let h = H0; h <= H1; h++) {
    const sc = scoreOf(modelAt(sp, h)), st = statusOf(sc);
    const x = 10 + (h - H0) * step + (step - bw) / 2;
    const bh = Math.max(4, (base - top) * sc / 100);
    s += '<rect class="bar" data-hour="' + h + '" x="' + x.toFixed(1) + '" y="' + (base - bh).toFixed(1) + '" width="' + bw + '" height="' + bh.toFixed(1) + '" rx="4" style="fill:var(--q-' + st.key + ')"><title>' + fmtHourShort(h) + ': ' + st.label + '</title></rect>';
    if ((h - H0) % 3 === 0 || h === H1) s += '<text class="axis" x="' + (x + bw / 2).toFixed(1) + '" y="' + (base + 18) + '" text-anchor="middle">' + fmtHourShort(h).replace(' ', '').toLowerCase().replace('m', '') + '</text>';
  }
  const cx = 10 + (state.hour - H0) * step + step / 2;
  const csc = scoreOf(modelAt(sp, state.hour));
  s += '<line class="cursor" x1="' + cx.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y1="' + top + '" y2="' + base + '"/>';
  s += '<circle class="cursor-dot" cx="' + cx.toFixed(1) + '" cy="' + (base - (base - top) * csc / 100).toFixed(1) + '" r="4.5"/>';
  return s + '</svg>';
}
function dayNotes(sp) {
  let best = -1, bestH = H0, maxCrowd = -1, busyH = H0;
  const scores = [];
  for (let h = H0; h <= H1; h++) {
    const m = modelAt(sp, h), sc = scoreOf(m);
    scores.push(sc);
    if (sc > best) { best = sc; bestH = h; }
    if (m.crowd > maxCrowd) { maxCrowd = m.crowd; busyH = h; }
  }
  let a = bestH, b = bestH;
  while (a - 1 >= H0 && scores[a - 1 - H0] >= best - 3) a--;
  while (b + 1 <= H1 && scores[b + 1 - H0] >= best - 3) b++;
  return { bestTxt: a === b ? fmtHourShort(a) : fmtHourShort(a) + '–' + fmtHourShort(b), busyTxt: fmtHourShort(busyH) };
}

function detailHTML(sp) {
  const pl = sp.place, st = S(sp.id), m = st.m, key = st.status.key;
  const following = state.follow.has(sp.id);
  const better = st.score < 45 ? betterSpotFor(sp) : null;
  const d = dayNotes(sp);
  const plus = sp.why.filter((w) => w.k === '+').length, minus = sp.why.length - plus;
  const whyTitle = plus && !minus ? 'Why the ' + WIFI + ' is strong here' : minus && !plus ? 'Why the ' + WIFI + ' is weak here' : 'What helps and what hurts here';
  let h = '';
  h += '<div class="d-top"><button class="btn btn-sm btn-ghost" type="button" data-back>' + icon('back') + 'All spots</button><span class="tag">' + esc(sp.type) + '</span></div>';
  h += '<h2 class="d-title">' + esc(pl.name) + '</h2>';
  if (pl.about) h += '<p class="d-about">' + esc(pl.about) + '</p>';
  if (pl.isBldg) {
    const best = bestOf(pl);
    h += '<div class="ftabs-wrap"><div class="eyebrow">Floors</div><div class="ftabs" role="tablist" aria-label="Floors of ' + esc(pl.name) + '">' +
      pl.spots.map((s) => '<button class="ftab" type="button" role="tab" data-spot="' + s.id + '" data-st="' + S(s.id).status.key + '" aria-selected="' + (s.id === sp.id) + '" title="' + esc(FL(s.f) + ': ' + S(s.id).status.label) + '"><span class="fdot"></span>' + FS(s.f) + (s.id === best.id ? icon('star', 'fstar') : '') + '</button>').join('') +
      '</div></div>';
  }
  h += '<div class="d-floorhead"><h3>' + esc(pl.isBldg ? FL(sp.f) : sp.type) + '</h3><span class="d-walk">' + icon('route') + walkMin(sp) + ' min from ' + esc(ORIGIN[state.origin].name) + (sp.climb ? ', ' + climbTxt(sp) : '') + '</span></div>';
  if (sp.marks.length) h += '<div class="marks">' + sp.marks.map((mk) => '<span class="tag">' + icon('pin') + esc(mk) + '</span>').join('') + '</div>';
  h += '<div class="d-hero" data-st="' + key + '">' + ringSVG(st.score, true) + '<div style="min-width:0"><div class="lbl-big">' + st.status.label + (m.none ? '' : ' ' + WIFI) + '</div>' +
    '<p>' + (st.source === 'live' ? 'Based on ' + st.live.count + ' student test' + (st.live.count === 1 ? '' : 's') + ' in the last 3 hours.' : 'Typical conditions at ' + fmtHour(state.hour) + '.') + '</p>' +
    '<div class="d-src">' + sourceTag(st) + '</div></div></div>';
  if (better) {
    const bs = S(better.id);
    h += '<div class="warn-card">' + icon('alert') + '<div><b>' + (key === 'dead' ? 'Dead-zone alert.' : 'Weak signal here.') + '</b> Try <button type="button" data-go="' + better.id + '">' + esc(better.name) + '</button> instead: ' + bs.status.label.toLowerCase() + ' Wi-Fi, ' + walkFromNode(sp.node, better) + ' min away.</div></div>';
  }
  h += '<p class="d-summary">' + esc(summaryOf(sp)) + '</p>';
  const meas = m.measured || {};
  const tile = (ico, lbl, val, unit, desc, extra, w, mst, measured) =>
    '<div class="metric"><div class="m-lbl">' + icon(ico) + lbl + (measured ? ' <span class="tag tag-live" style="height:18px;padding:0 6px;font-size:10px">Tested</span>' : '') + '</div>' +
    '<div class="m-val"><b>' + val + '</b><small>' + unit + '</small></div>' +
    '<div class="m-desc">' + desc + (extra || '') + '</div>' +
    (w != null ? '<div class="meter" data-st="' + mst + '"><i data-w="' + w + '%" style="background:var(--q-' + mst + ')"></i></div>' : '') + '</div>';
  h += '<div class="metrics">';
  h += tile('signal', 'Signal', m.none ? '—' : m.rssi, 'dBm', m.none ? 'No Wi-Fi signal' : describe.rssi(m.rssi), ' ' + barsHTML(m.none ? 0 : rssiBars(m.rssi), key), null, undefined, meas.rssi);
  h += tile('timer', 'Ping', fmtMs(m.ping), 'ms', describe.ping(m.ping), '', m.ping == null ? 0 : Math.round(clamp(100 - m.ping / 2, 4, 100)), metricSt.ping(m.ping), meas.ping);
  h += tile('download', 'Download', m.none && !(m.down > 0.5) ? '—' : fmtMbps(m.down), 'Mbps', describe.down(m.down), '', Math.round(clamp((m.down || 0) / 50 * 100, 2, 100)), metricSt.down(m.down), meas.down);
  h += tile('upload', 'Upload', m.none ? '—' : fmtMbps(m.up), 'Mbps', m.none ? 'No connection' : describe.down(m.up), '', Math.round(clamp((m.up || 0) / 25 * 100, 2, 100)), metricSt.down((m.up || 0) * 2), meas.up);
  h += tile('wave', 'Stability', fmtMs(m.jitter), 'ms jitter', describe.jitter(m.jitter) + (m.loss != null && !m.none ? ' · ' + m.loss.toFixed(1) + '% loss' : ''), '', m.jitter == null ? 0 : Math.round(clamp(100 - m.jitter * 2.5, 4, 100)), metricSt.jitter(m.jitter), meas.jitter);
  h += tile('users', 'Crowd', Math.round(m.crowd * 100), '% full', describe.crowd(m.crowd), '', Math.round(m.crowd * 100), m.crowd < 0.3 ? 'excellent' : m.crowd < 0.55 ? 'good' : m.crowd < 0.8 ? 'fair' : 'weak');
  h += '</div>';
  h += '<div class="section-title"><h3>' + whyTitle + '</h3></div><ul class="why">';
  sp.why.forEach((w) => {
    h += '<li class="' + (w.k === '+' ? 'plus' : 'minus') + '"><span class="w-ico">' + icon(w.i) + '</span><div><b>' + esc(w.t) + '</b><p>' + esc(w.d) + '</p><span class="w-effect">' + (w.k === '+' ? '▲ Makes it stronger' : '▼ Makes it weaker') + '</span></div></li>';
  });
  h += '</ul>';
  h += '<div class="section-title"><h3>Good for</h3><span class="faint" style="font-size:12.5px;font-weight:700">at ' + fmtHour(state.hour) + '</span></div><div class="goodfor">';
  ACTS.forEach((a) => {
    const mt = matchOf(m, a).score;
    const cls = mt >= 0.75 ? 'yes' : mt >= 0.4 ? 'maybe' : 'no';
    h += '<div class="gf ' + cls + '" title="' + esc(a.name) + ': ' + Math.round(mt * 100) + '% match"><span class="mark">' + icon(cls === 'yes' ? 'check' : cls === 'maybe' ? 'wave' : 'x') + '</span><span>' + esc(a.chip) + '</span></div>';
  });
  h += '</div>';
  h += '<div class="section-title"><h3>' + WIFI + ' through the day</h3><span class="tag tag-sample">Sample</span></div>';
  h += hourChartSVG(sp);
  h += '<div class="chart-note">' + (sp.noService ? '<span>No Wi-Fi at any hour in the sample.</span>' : '<span>Best: <b>' + d.bestTxt + '</b></span><span>Busiest: <b>' + d.busyTxt + '</b></span>') + '<span class="faint">Tap a bar to see that hour</span></div>';
  const reps = allReports().filter((r) => r.spot === sp.id && r.at >= Date.now() - HIST_MS).sort((a, b) => b.at - a.at);
  h += '<div class="section-title"><h3>Student tests</h3><span class="tag">' + reps.length + ' this week</span></div>';
  if (reps.length) h += '<ul class="reports-mini">' + reps.slice(0, 4).map(repRowHTML).join('') + '</ul>';
  else h += '<div class="empty">' + icon('info') + '<span>No student tests here yet. Run a test from this ' + (pl.isBldg ? 'floor' : 'spot') + ' and your result will replace the sample for the next 3 hours.</span></div>';
  h += '<div class="tip">' + icon('spark') + '<div><b>Tip:</b> ' + esc(sp.tip) + '</div></div>';
  h += '<div class="d-actions">' +
    '<button class="btn btn-primary" type="button" data-nav="' + sp.id + '">' + icon('nav') + (state.routeTo === sp.id ? 'Route shown' : 'Navigate') + '</button>' +
    '<button class="btn" type="button" data-follow="' + sp.id + '" aria-pressed="' + following + '">' + icon(following ? 'bellOn' : 'bell') + (following ? 'Following' : 'Follow') + '</button>' +
    '<button class="btn" type="button" data-test="' + sp.id + '">' + icon('bolt') + 'Test here</button>' +
    '</div>';
  return h;
}
function repRowHTML(r) {
  const sp = SPOT[r.spot];
  const sc = r.down != null || r.ping != null ? scoreOf({ ping: r.ping, jitter: r.jitter, down: r.down }) : r.rating ? RATING_SCORE[r.rating - 1] : 50;
  const st = r.issues.indexOf('none') >= 0 ? STATUS.dead : statusOf(sc);
  const bits = [];
  if (r.ping != null) bits.push(fmtMs(r.ping) + ' ms');
  if (r.down != null) bits.push(fmtMbps(r.down) + ' Mbps');
  if (r.up != null) bits.push(fmtMbps(r.up) + ' up');
  if (r.rssi != null) bits.push(String(r.rssi).replace('-', '−') + ' dBm');
  if (r.rating) bits.push(['No signal', 'Weak', 'Fair', 'Good', 'Excellent'][r.rating - 1]);
  if (r.issues.length) bits.push(ISSUE_NAME[r.issues[0]]);
  const mine = (state.uid && r.by === state.uid) || r.local;
  return '<li class="rep" data-rid="' + esc(r.id) + '"><span>' + barsHTML(st.bars, st.key) + '</span>' +
    '<span style="min-width:0"><span class="who">' + esc(sp.short) + (mine ? ' · You' : '') + '</span><span class="what" style="display:block">' + esc(bits.join(' · ') || 'Report') + (r.note ? ' — ' + esc(r.note) : '') + '</span></span>' +
    '<span style="display:flex;align-items:center;gap:4px"><span class="when">' + ago(r.at) + '</span>' + (mine ? '<button class="del" type="button" data-del="' + esc(r.id) + '" aria-label="Delete this report">' + icon('trash') + '</button>' : '') + '</span></li>';
}

function findRoom(raw) {
  const m = /^\s*(?:q\s*[-–]?\s*)?(\d)\s*(\d)\s*(\d{2})\s*$/i.exec(raw || '');
  if (!m) return { err: 'Type a room code like Q-5203 or 5203.' };
  const b = m[1], f = +m[2];
  const pl = PLACE['b' + b];
  if (!pl) return { err: 'There is no Building ' + b + ' on the QC campus map.' };
  if (f < 1 || f > pl.spots.length) return { err: pl.name + ' has ' + pl.spots.length + ' floors in WiFind, so floor ' + f + ' isn’t listed.' };
  return { sp: pl.spots[f - 1], code: 'Q-' + b + f + m[3] };
}
function bindPanel() {
  $$('[data-go]', panelScroll).forEach((el) => {
    el.addEventListener('click', (e) => { e.stopPropagation(); selectSpot(el.dataset.go, { focus: true }); });
    if (el.getAttribute('role') === 'button') el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSpot(el.dataset.go, { focus: true }); } });
  });
  $$('[data-spot]', panelScroll).forEach((el) => el.addEventListener('click', () => selectSpot(el.dataset.spot, { keepSheet: true })));
  $$('[data-nav]', panelScroll).forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); navigateTo(el.dataset.nav); }));
  $$('[data-follow]', panelScroll).forEach((el) => el.addEventListener('click', () => toggleFollow(el.dataset.follow)));
  $$('[data-test]', panelScroll).forEach((el) => el.addEventListener('click', () => { $('#repSpot').value = el.dataset.test; store.set('lastSpot', el.dataset.test); updateSaveNote(); showView('test'); }));
  $$('[data-back]', panelScroll).forEach((el) => el.addEventListener('click', () => selectSpot(null)));
  $$('.hourchart .bar', panelScroll).forEach((el) => el.addEventListener('click', () => setHour(+el.dataset.hour)));
  $$('[data-del]', panelScroll).forEach((el) => el.addEventListener('click', () => deleteReport(el.dataset.del)));
  const os = $('#originSel2', panelScroll);
  if (os) os.addEventListener('change', () => setOrigin(os.value));
  const rf = $('#roomForm', panelScroll);
  if (rf) rf.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = findRoom($('#roomIn').value);
    const help = $('#roomHelp');
    if (res.err) { help.textContent = res.err; help.classList.add('err'); return; }
    const st = S(res.sp.id);
    toast({ ico: 'hash', st: st.status.key, title: 'Room ' + res.code + ': ' + res.sp.name, body: st.status.label + ' Wi-Fi at ' + fmtHour(state.hour) + ' · ' + walkMin(res.sp) + ' min from ' + ORIGIN[state.origin].name + '.', ms: 4500 });
    selectSpot(res.sp.id, { focus: true });
  });
}

function selectSpot(id, opts) {
  opts = opts || {};
  const prev = state.selected;
  state.selected = id && SPOT[id] ? id : null;
  const pid = state.selected ? SPOT[state.selected].pid : null;
  for (const [p, e] of placeEls) e.g.classList.toggle('sel', p === pid);
  if (pid) {
    const e = placeEls.get(pid);
    e.g.parentNode.appendChild(e.g);
    if (state.routeTo && state.routeTo !== state.selected) drawRoute(null);
  } else {
    drawRoute(null);
  }
  if (state.view !== 'map') showView('map');
  updateMapStatus();
  renderPanel();
  panelScroll.scrollTop = 0;
  if (!isWide() && !opts.keepSheet) setSheet(state.selected ? 'half' : 'peek');
  if (state.selected && opts.focus) setTimeout(() => focusSpot(SPOT[state.selected]), isWide() ? 0 : 60);
  if (!state.selected && prev && opts.refit !== false) setTimeout(() => fitCampus(600), 30);
  updateAlertStrip();
  updateSpec();
}
function navigateTo(id) {
  const sp = SPOT[id];
  if (!sp) return;
  if (state.selected !== id) {
    state.selected = id;
    for (const [p, e] of placeEls) e.g.classList.toggle('sel', p === sp.pid);
    const e = placeEls.get(sp.pid); e.g.parentNode.appendChild(e.g);
    updateMapStatus();
  }
  if (state.view !== 'map') showView('map');
  const pts = drawRoute(sp);
  renderPanel({ keepScroll: true });
  if (!isWide()) setSheet('peek');
  setTimeout(() => fitPoints(pts, 700), 40);
  toast({ ico: 'route', title: walkMin(sp) + ' min to ' + sp.name, body: 'From ' + ORIGIN[state.origin].name + (sp.climb ? ', then ' + climbTxt(sp) : '') + '. Follow the blue route on the map.', st: S(id).status.key, ms: 4200 });
}
function setOrigin(id) {
  if (!ORIGIN[id]) return;
  state.origin = id; store.set('origin', id);
  updateYou();
  ['#originSel', '#originSel2', '#findOrigin'].forEach((s) => { const el = $(s); if (el) el.value = id; });
  if (state.routeTo) drawRoute(SPOT[state.routeTo]);
  renderPanel({ keepScroll: true, quiet: true });
  renderFind();
  rebuildFeed();
}
function updateAlertStrip() {
  const el = $('#alertStrip');
  const sp = state.selected ? SPOT[state.selected] : null;
  if (sp && S(sp.id).status.key === 'dead' && state.prefs.dead) {
    el.innerHTML = icon('wifiOff') + '<span>Dead zone: ' + esc(sp.name) + '. Use mobile data or pick another spot.</span>';
    el.hidden = false;
  } else el.hidden = true;
}

/* =========================================================
   Time
   ========================================================= */
function updateSpec() {
  // spectrum under the time slider: selected spot's day, or the campus average
  const el = $('#tcSpec');
  let s = '';
  for (let h = H0; h < H1; h++) {
    let sc;
    if (state.selected) sc = scoreOf(modelAt(SPOT[state.selected], h + 0.5));
    else sc = SPOTS.reduce((a, sp) => a + scoreOf(modelAt(sp, h + 0.5)), 0) / SPOTS.length;
    s += '<i data-st="' + statusOf(sc).key + '"></i>';
  }
  el.innerHTML = s;
  el.title = state.selected ? SPOT[state.selected].name + ' through the day' : 'Campus average through the day';
}
function updateTimeUI() {
  $('#tcTime').textContent = fmtHour(state.hour);
  const note = $('#tcNote');
  if (state.viewingNow) note.textContent = state.playing ? 'Playing a typical day' : 'Now · typical for this hour';
  else if (!state.campusOpen) note.textContent = state.playing ? 'Playing a typical day' : 'Closed now · forecast';
  else note.textContent = state.playing ? 'Playing a typical day' : 'Forecast for later';
  $('#hourRange').value = state.hour;
  $('#findRange').value = state.hour;
  $('#findTime').textContent = fmtHour(state.hour);
  const chip = $('#timeChip');
  chip.dataset.mode = state.viewingNow ? 'now' : 'other';
  $('#timeChipText').innerHTML = state.viewingNow ? '<span class="txt-long">Now · </span>' + fmtHour(state.hour) : (state.campusOpen ? 'Back to now' : '<span class="txt-long">Viewing </span>' + fmtHour(state.hour));
  $('#findNow').disabled = !state.campusOpen || state.viewingNow;
  $('#findNow').textContent = state.campusOpen ? 'Now' : 'Campus closed';
  $('#playBtn').innerHTML = icon(state.playing ? 'pause' : 'play');
  $('#playBtn').setAttribute('aria-label', state.playing ? 'Pause' : 'Play a typical day');
}
function setHour(h, opts) {
  opts = opts || {};
  h = clamp(Math.round(h * 4) / 4, H0, H1);
  const before = new Map();
  for (const sp of SPOTS) { const s = state.snap.get(sp.id); if (s) before.set(sp.id, s.status.key); }
  state.hour = h;
  computeSnapshot();
  updateMapStatus();
  updateTimeUI();
  renderPanel({ keepScroll: true, quiet: true });
  if (state.view === 'find' || !opts.light) renderFind();
  updateAlertStrip();
  // notify about followed spots that changed
  if (state.prefs.follow && before.size) {
    for (const id of state.follow) {
      const a = before.get(id), b = S(id) && S(id).status.key;
      if (a && b && a !== b) {
        const sp = SPOT[id];
        const up = STATUS[b].rank > STATUS[a].rank;
        pushEvent({ kind: 'Spot you follow', ico: up ? 'wifi' : 'alert', st: b, title: sp.name + ' is now ' + STATUS[b].label.toLowerCase(),
          body: 'At ' + fmtHour(h) + ' it changes from ' + STATUS[a].label.toLowerCase() + ' to ' + STATUS[b].label.toLowerCase() + (up ? '. A good time to go.' : '. Consider another spot.'), spot: id }, true);
      }
    }
  }
  if (!opts.light) rebuildFeed();
}
let playTimer = 0;
function togglePlay() {
  if (state.playing) { stopPlay(); return; }
  state.playing = true;
  if (state.hour >= H1) setHour(H0, { light: true });
  updateTimeUI();
  playTimer = setInterval(() => {
    if (state.hour >= H1) { stopPlay(); return; }
    setHour(state.hour + 0.25, { light: true });
  }, RM ? 400 : 230);
}
function stopPlay() {
  clearInterval(playTimer);
  state.playing = false;
  updateTimeUI();
  rebuildFeed();
  renderFind();
}
function goNow() {
  refreshClock();
  if (state.campusOpen) setHour(nowSlot());
}


/* =========================================================
   Find
   ========================================================= */
function renderActs() {
  $('#acts').innerHTML = ACTS.map((a) => '<button class="act" type="button" data-act="' + a.id + '" aria-pressed="' + (a.id === state.find.act) + '">' +
    '<span class="act-ico">' + icon(a.ico) + '</span><b>' + esc(a.name) + '</b><small>' + esc(a.req) + '</small><span class="act-check">' + icon('check') + '</span></button>').join('');
  $$('#acts .act').forEach((b) => b.addEventListener('click', () => {
    state.find.act = b.dataset.act; store.set('act', state.find.act);
    $$('#acts .act').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderFind(true);
  }));
}
function renderFindOrigins() {
  $('#findOrigin').innerHTML = originOptions(state.origin);
}
function renderFind(flip) {
  const act = ACT[state.find.act];
  const list = $('#results');
  const first = new Map();
  if (flip && !RM) $$('.result', list).forEach((el) => first.set(el.dataset.id, el.getBoundingClientRect().top));
  const pool = state.find.noStairs ? SPOTS.filter((s) => s.climb === 0) : SPOTS;
  const rows = pool.map((sp) => {
    const st = S(sp.id);
    const mt = matchOf(st.m, act);
    const walk = walkMin(sp);
    const pen = state.find.nearby ? Math.min(0.3, Math.max(0, walk - 1) * 0.035) : 0;
    return { sp, st, mt, walk, rank: mt.score * (1 - pen) };
  }).sort((a, b) => b.rank - a.rank);
  $('#resEyebrow').textContent = 'Ranked for ' + act.short + (state.find.noStairs ? ', no stairs' : '');
  $('#resTitle').textContent = state.viewingNow ? 'Best spots right now' : 'Best spots at ' + fmtHour(state.hour);
  const live = rows.some((r) => r.st.source === 'live');
  $('#resSource').className = 'tag ' + (live ? 'tag-live' : 'tag-sample');
  $('#resSource').textContent = live ? 'Includes live tests' : 'Sample readings';
  const shown = state.find.all ? rows : rows.slice(0, 10);
  list.innerHTML = shown.map((r, i) => {
    const pct = Math.round(r.mt.score * 100);
    const m = r.st.m, sp = r.sp;
    let why;
    if (pct === 0) why = sp.noService ? 'No Wi-Fi here. Not usable for ' + act.short + '.' : METRIC_NAME[r.mt.worst] + ' is too low for ' + act.short + ' here.';
    else if (!r.mt.worst) why = '<b>Meets everything</b> ' + esc(act.short) + ' need.';
    else why = '<b>' + METRIC_NAME[r.mt.worst] + '</b> is the weak point here' + (pct >= 70 ? ', but it should still work.' : pct >= 40 ? ', so expect some lag.' : '.');
    const stats = [
      '<span class="tag">' + icon('timer') + fmtMs(m.ping) + ' ms</span>',
      '<span class="tag">' + icon('download') + (m.none && !(m.down > 0.5) ? '—' : fmtMbps(m.down)) + ' Mbps down</span>',
      '<span class="tag">' + icon('upload') + (m.none ? '—' : fmtMbps(m.up)) + ' Mbps up</span>',
      '<span class="tag">' + icon('route') + r.walk + ' min' + (sp.climb ? ' · ' + climbTxt(sp) : ' walk') + '</span>',
    ].join('');
    return '<li class="result' + (i === 0 && pct > 0 ? ' top' : '') + '" data-id="' + sp.id + '">' +
      '<span class="rk">' + (i + 1) + '</span>' +
      '<div style="min-width:0"><div class="r-head"><span class="r-name">' + esc(sp.place.name) + '</span>' + pill(r.st.status) + (r.st.source === 'live' ? '<span class="tag tag-live">Live</span>' : '') + '</div>' +
      '<div class="r-place">' + esc(sp.place.isBldg ? FL(sp.f) + ' · ' + sp.type : sp.type) + (sp.marks.length ? ' · ' + esc(sp.marks[0]) : '') + '</div>' +
      '<div class="r-match"><span class="mbar"><i style="width:' + pct + '%"></i></span><b>' + pct + '%</b></div>' +
      '<p class="r-why">' + why + '</p>' +
      '<div class="r-stats">' + stats + '</div>' +
      '<div class="r-actions"><button class="btn btn-sm btn-soft" type="button" data-show="' + sp.id + '">' + icon('map') + 'Show on map</button><button class="btn btn-sm" type="button" data-navf="' + sp.id + '">' + icon('nav') + 'Navigate</button></div>' +
      '</div></li>';
  }).join('') + (rows.length > 10 ? '<li class="more"><button class="btn btn-ghost" type="button" id="findMore">' + (state.find.all ? 'Show the top 10' : 'Show all ' + rows.length + ' spots') + '</button></li>' : '');
  $$('[data-show]', list).forEach((b) => b.addEventListener('click', () => { showView('map'); selectSpot(b.dataset.show, { focus: true }); }));
  $$('[data-navf]', list).forEach((b) => b.addEventListener('click', () => { showView('map'); navigateTo(b.dataset.navf); }));
  const more = $('#findMore');
  if (more) more.addEventListener('click', () => { state.find.all = !state.find.all; renderFind(); });
  if (first.size) {
    $$('.result', list).forEach((el) => {
      const f = first.get(el.dataset.id);
      if (f == null) return;
      const dy = f - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 2) return;
      el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }
}

/* =========================================================
   Speed test + reports
   ========================================================= */
const test = { running: false, ping: null, jitter: null, down: null, up: null, at: null, needle: 0, target: 0, raf: 0, method: null, server: null };
const GT = (v) => clamp(Math.log10(1 + Math.max(0, v)) / Math.log10(101), 0, 1); // Mbps -> 0..1
function buildGauge() {
  const cx = 150, cy = 150, R = 118;
  let s = '<defs><linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" style="stop-color:var(--q-dead)"/><stop offset=".35" style="stop-color:var(--q-weak)"/><stop offset=".55" style="stop-color:var(--q-fair)"/><stop offset=".75" style="stop-color:var(--q-good)"/><stop offset="1" style="stop-color:var(--q-excellent)"/></linearGradient></defs>';
  const arc = 'M' + (cx - R) + ' ' + cy + 'A' + R + ' ' + R + ' 0 0 1 ' + (cx + R) + ' ' + cy;
  s += '<path class="g-track" d="' + arc + '"/>';
  s += '<path class="g-fill" id="gFill" d="' + arc + '" stroke-dasharray="' + (Math.PI * R).toFixed(1) + '" stroke-dashoffset="' + (Math.PI * R).toFixed(1) + '"/>';
  [0, 1, 5, 10, 25, 50, 100].forEach((v) => {
    const a = Math.PI + GT(v) * Math.PI;
    const x1 = cx + (R - 16) * Math.cos(a), y1 = cy + (R - 16) * Math.sin(a), x2 = cx + (R - 24) * Math.cos(a), y2 = cy + (R - 24) * Math.sin(a);
    const lx = cx + (R - 40) * Math.cos(a), ly = cy + (R - 40) * Math.sin(a) + 4;
    s += '<line class="g-tick" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    s += '<text class="g-ticklbl" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle">' + v + '</text>';
  });
  s += '<g id="gNeedle" transform="translate(150 150) rotate(180)"><path class="g-needle" d="M0 -4.5L' + (R - 30) + ' 0L0 4.5Z"/><circle class="g-hub" r="11"/><circle class="g-hub2" r="4.5"/></g>';
  $('#gauge').innerHTML = s;
}
function setNeedleTarget(mbps) {
  test.target = GT(mbps);
  if (!test.raf) test.raf = requestAnimationFrame(needleStep);
}
function needleStep() {
  test.needle += (test.target - test.needle) * (RM ? 1 : 0.14);
  if (Math.abs(test.target - test.needle) < 0.001) test.needle = test.target;
  const deg = 180 + test.needle * 180;
  $('#gNeedle').setAttribute('transform', 'translate(150 150) rotate(' + deg.toFixed(2) + ')');
  const L = Math.PI * 118;
  $('#gFill').setAttribute('stroke-dashoffset', (L * (1 - test.needle)).toFixed(1));
  if (test.needle !== test.target) test.raf = requestAnimationFrame(needleStep);
  else test.raf = 0;
}
function startBtnHTML() { return icon(test.running ? 'refresh' : 'bolt') + (test.running ? 'Testing…' : test.at ? 'Test again' : 'Start test'); }
function renderTestResults() {
  const box = (lbl, v, unit) => '<div class="tr-box"><small>' + lbl + '</small><b>' + v + '</b><em>' + unit + '</em></div>';
  const four = test.up != null;
  const res = $('#testResults');
  res.classList.toggle('four', four);
  res.innerHTML = box('Ping', fmtMs(test.ping), 'ms') + box('Jitter', fmtMs(test.jitter), 'ms') + box('Download', fmtMbps(test.down), 'Mbps') + (four ? box('Upload', fmtMbps(test.up), 'Mbps') : '');
  const v = $('#verdict');
  if (test.at && test.ping != null) {
    const sc = scoreOf({ ping: test.ping, jitter: test.jitter, down: test.down });
    const st = statusOf(sc);
    const up = test.up != null ? test.up : test.down != null ? test.down * 0.45 : null;
    const okFor = ACTS.filter((a) => matchOf({ ping: test.ping, jitter: test.jitter, down: test.down, up, loss: 0.3 }, a).score >= 0.7).map((a) => a.short);
    v.innerHTML = '<div class="verdict" data-st="' + st.key + '">' + icon(st.rank >= 3 ? 'check' : 'alert') + '<div><b>' + st.label + ' connection' + (test.method === 'estimate' ? ' (browser estimate)' : '') + '.</b> ' +
      (okFor.length ? 'Good enough for ' + okFor.slice(0, 3).join(', ') + '.' : 'Too slow for most schoolwork. Try a stronger spot.') + '</div></div>';
  } else v.innerHTML = '';
  $('#startTest').innerHTML = startBtnHTML();
  $('#startTest').disabled = test.running;
  $('#attachWrap').hidden = !test.at;
}
function connLine() {
  const el = $('#connLine');
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c && c.type) {
    if (c.type === 'cellular') { el.className = 'conn-line warn'; el.innerHTML = icon('alert') + 'You’re on mobile data. Connect to the campus Wi-Fi to test it.'; el.hidden = false; return; }
    if (c.type === 'wifi') { el.className = 'conn-line'; el.innerHTML = icon('wifi') + 'Connected through Wi-Fi'; el.hidden = false; return; }
  }
  el.hidden = true;
}
async function timedFetch(url, ms) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), ms) : 0;
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res;
  } finally { clearTimeout(timer); }
}
const bust = () => 'r=' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const TEST_BASE = typeof window.WIFIND_TEST_BASE === 'string' ? window.WIFIND_TEST_BASE : ''; // folder that holds ping.txt and probe.png
const FROM_FILE = location.protocol === 'file:';
// WiFind served from this computer or the local network (Live Server, npm start, a double-clicked file)
const LOCAL_HOST = FROM_FILE || /^(localhost|\[?::1\]?|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
// Outside Claude, measure against Cloudflare's public speed test servers so the result is your real internet speed
const CLOUD = 'https://speed.cloudflare.com';
const TRY_CLOUD = !window.claude;

function randomBytes(n) {
  const a = new Uint8Array(n);
  if (window.crypto && crypto.getRandomValues) for (let i = 0; i < n; i += 65536) crypto.getRandomValues(a.subarray(i, Math.min(n, i + 65536)));
  return a;
}
async function measurePing(url, opts, onSample) {
  const samples = [];
  for (let i = 0; i < 12; i++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const t0 = performance.now();
    try {
      const r = await fetch(url(), Object.assign({ cache: 'no-store', signal: ctl.signal }, opts));
      if (r.type !== 'opaque' && !r.ok) throw new Error('HTTP ' + r.status);
      await r.arrayBuffer();
    } finally { clearTimeout(timer); }
    const dt = performance.now() - t0;
    if (i >= 2) samples.push(dt);
    onSample(dt, i);
  }
  return samples;
}
async function measureDownload(nextUrl, maxMs, onRate) {
  let bytes = 0;
  const t0 = performance.now();
  for (let run = 0; run < 8; run++) {
    const left = maxMs - (performance.now() - t0);
    if (left < 150) break;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), left);
    try {
      const res = await fetch(nextUrl(run, performance.now() - t0, bytes), { cache: 'no-store', signal: ctl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (res.body && res.body.getReader) {
        const reader = res.body.getReader();
        for (;;) {
          const c = await reader.read();
          if (c.done) break;
          bytes += c.value.length;
          onRate(bytes, performance.now() - t0);
        }
      } else {
        bytes += (await res.arrayBuffer()).byteLength;
        onRate(bytes, performance.now() - t0);
      }
    } catch (e) {
      if (!(e && e.name === 'AbortError') && !bytes) throw e;
      break;
    } finally { clearTimeout(timer); }
  }
  return bytes * 8 / Math.max(0.05, (performance.now() - t0) / 1000) / 1e6;
}
async function measureUpload(url, maxMs, onRate) {
  const sizes = [250000, 1000000, 2000000, 4000000];
  let bytes = 0;
  const t0 = performance.now();
  for (let run = 0; run < sizes.length; run++) {
    const left = maxMs - (performance.now() - t0);
    if (left < 200) break;
    const body = randomBytes(sizes[run]);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), left + 3000);
    try {
      await fetch(url(), { method: 'POST', body, mode: 'no-cors', cache: 'no-store', signal: ctl.signal });
      bytes += body.length;
      onRate(bytes, performance.now() - t0);
    } catch (e) {
      if (!bytes) throw e;
      break;
    } finally { clearTimeout(timer); }
    if (performance.now() - t0 > maxMs * 0.6) break;
  }
  return bytes * 8 / Math.max(0.05, (performance.now() - t0) / 1000) / 1e6;
}

async function runTest() {
  if (test.running) return;
  test.running = true; test.ping = test.jitter = test.down = test.up = null; test.method = 'measured'; test.server = null;
  connLine();
  renderTestResults();
  const phase = $('#gPhase'), val = $('#gVal'), unit = $('#gUnit');
  const dots = '<span class="g-dots"><i></i><i></i><i></i></span>';
  const live = (bytes, ms) => { if (ms > 50) { const mbps = bytes * 8 / (ms / 1000) / 1e6; val.textContent = fmtMbps(mbps); setNeedleTarget(mbps); } };
  const pingUI = (dt, i) => { phase.innerHTML = dots + 'Measuring ping ' + (i + 1) + ' of 12'; val.textContent = Math.round(dt); };
  const jitterOf = (s) => { let j = 0; for (let i = 1; i < s.length; i++) j += Math.abs(s[i] - s[i - 1]); return s.length > 1 ? j / (s.length - 1) : 0; };
  setNeedleTarget(0);
  unit.textContent = 'ms';
  phase.innerHTML = dots + 'Connecting to the speed test server';
  // 1) Cloudflare's speed test servers (real internet speed, wherever WiFind runs)
  if (TRY_CLOUD) {
    const mid = Math.random().toString(36).slice(2, 10);
    try {
      const samples = await measurePing(() => CLOUD + '/__down?bytes=0&measId=' + mid + '&' + bust(), { mode: 'no-cors' }, pingUI);
      test.ping = median(samples); test.jitter = jitterOf(samples); test.server = 'cloud';
      val.textContent = Math.round(test.ping);
      renderTestResults();
      unit.textContent = 'Mbps';
      phase.innerHTML = dots + 'Measuring download speed';
      let downFromSite = false;
      try {
        test.down = await measureDownload((run, ms, bytes) => {
          const rate = bytes / Math.max(0.05, ms / 1000);
          const size = run === 0 ? 250000 : Math.round(clamp(rate * 1.5, 250000, 25e6));
          return CLOUD + '/__down?bytes=' + size + '&measId=' + mid;
        }, 6000, live);
      } catch (e) {
        if (!LOCAL_HOST && !FROM_FILE) {
          try { test.down = await measureDownload(() => TEST_BASE + 'probe.png?' + bust(), 5000, live); downFromSite = true; } catch (e2) { test.down = null; }
        }
      }
      setNeedleTarget(test.down || 0);
      renderTestResults();
      phase.innerHTML = dots + 'Measuring upload speed';
      setNeedleTarget(0);
      try { test.up = await measureUpload(() => CLOUD + '/__up?measId=' + mid, 4000, live); } catch (e) { test.up = null; }
      val.textContent = fmtMbps(test.down != null ? test.down : test.up);
      setNeedleTarget(test.down != null ? test.down : (test.up || 0));
      phase.textContent = downFromSite
        ? 'Done. Ping and upload measured with Cloudflare’s speed test servers, download from the WiFind server.'
        : 'Done. Measured over the internet with Cloudflare’s speed test servers.';
    } catch (e) {
      test.server = null; test.ping = test.jitter = test.down = test.up = null;
    }
  }
  // 2) WiFind's own website, when it runs online (Render, GitHub Pages or the Claude-hosted version)
  if (!test.server && !LOCAL_HOST) {
    try {
      unit.textContent = 'ms';
      const samples = await measurePing(() => TEST_BASE + 'ping.txt?' + bust(), {}, pingUI);
      test.ping = median(samples); test.jitter = jitterOf(samples); test.server = 'self';
      renderTestResults();
      unit.textContent = 'Mbps';
      phase.innerHTML = dots + 'Measuring download speed';
      test.down = await measureDownload(() => TEST_BASE + 'probe.png?' + bust(), 5000, live);
      val.textContent = fmtMbps(test.down);
      setNeedleTarget(test.down);
      phase.textContent = 'Done. Measured between your device and the WiFind server.';
    } catch (e) {
      test.server = null;
    }
  }
  // 3) Nothing reachable: use the browser's own estimate, never a fake local measurement
  if (!test.server) {
    const c = navigator.connection;
    if (c && c.rtt && c.downlink) {
      test.ping = c.rtt; test.jitter = null; test.down = c.downlink; test.up = null; test.method = 'estimate'; test.server = 'estimate';
      unit.textContent = 'Mbps'; val.textContent = fmtMbps(test.down); setNeedleTarget(test.down);
      phase.textContent = 'Couldn’t reach the speed test servers, so this is your browser’s own estimate.';
    } else {
      test.running = false; test.at = null;
      phase.textContent = navigator.onLine === false ? 'You’re offline. Connect to Wi-Fi and try again.' : 'Couldn’t reach the speed test servers. Check that this device is online, then try again.';
      val.textContent = '0'; setNeedleTarget(0);
      renderTestResults();
      return;
    }
  }
  test.running = false; test.at = Date.now();
  const sigNow = phoneSignal();
  test.rssi = sigNow ? sigNow.rssi : null;
  state.tests.push({ at: test.at, ping: test.ping, jitter: test.jitter, down: test.down, up: test.up, rssi: test.rssi, spot: $('#repSpot').value || null });
  state.tests = state.tests.slice(-20);
  store.set('tests', state.tests);
  $('#attachTest').checked = true;
  renderTestResults();
  renderMyTests();
  const sc = scoreOf({ ping: test.ping, jitter: test.jitter, down: test.down });
  toast({ ico: 'bolt', st: statusOf(sc).key, title: 'Test done: ' + statusOf(sc).label, body: fmtMs(test.ping) + ' ms ping · ' + fmtMbps(test.down) + ' Mbps down' + (test.up != null ? ' · ' + fmtMbps(test.up) + ' up' : '') + '. Send a report so others can see it.', ms: 4500 });
}
let rating = 0;
const issuesSel = new Set();
function spotOptionsHTML() {
  let h = '<option value="">Choose your building and floor</option>';
  BLDGS.forEach((pl) => {
    h += '<optgroup label="' + esc(pl.name) + '">' + pl.spots.map((s) => '<option value="' + s.id + '">' + esc(pl.code + ' · ' + FL(s.f)) + '</option>').join('') + '</optgroup>';
  });
  h += '<optgroup label="Other spots">' + AREAS.map((p) => '<option value="' + p.spots[0].id + '">' + esc(p.name) + '</option>').join('') + '</optgroup>';
  return h;
}
function renderReportForm() {
  const sel = $('#repSpot');
  sel.innerHTML = spotOptionsHTML();
  const last = store.get('lastSpot', '');
  sel.value = SPOT[last] ? last : '';
  const labels = ['No signal', 'Weak', 'Fair', 'Good', 'Excellent'];
  const keys = ['dead', 'weak', 'fair', 'good', 'excellent'];
  $('#rating').innerHTML = labels.map((l, i) => '<button class="rate" type="button" data-rate="' + (i + 1) + '" data-st="' + keys[i] + '" aria-pressed="false">' + barsHTML(i, keys[i]) + '<span>' + l + '</span></button>').join('');
  $$('#rating .rate').forEach((b) => b.addEventListener('click', () => {
    rating = rating === +b.dataset.rate ? 0 : +b.dataset.rate;
    $$('#rating .rate').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.rate === rating)));
  }));
  $('#issues').innerHTML = ISSUES.map((it) => '<button class="chip issue" type="button" data-issue="' + it[0] + '" aria-pressed="false">' + esc(it[1]) + '</button>').join('');
  $$('#issues .issue').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.issue;
    if (issuesSel.has(k)) issuesSel.delete(k); else issuesSel.add(k);
    b.setAttribute('aria-pressed', String(issuesSel.has(k)));
  }));
  sel.addEventListener('change', () => { store.set('lastSpot', sel.value); updateSaveNote(); });
  $('#sendReport').innerHTML = icon('flag') + 'Send report';
  updateSaveNote();
}
function canShare() { return !!state.db && state.canWrite !== false; }
function updateSaveNote() {
  $('#saveNote').innerHTML = canShare() ? icon('users') + 'Shared with everyone using WiFind' : icon('info') + 'Saved on this device';
}
async function sendReport() {
  const spot = $('#repSpot').value;
  if (!spot) { toast({ ico: 'pin', title: 'Choose where you are first', body: 'Pick the spot you are reporting from the list.', st: 'fair', ms: 3500 }); $('#repSpot').focus(); return; }
  const attach = test.at && $('#attachTest').checked;
  const sigNow = phoneSignal();
  if (!rating && !attach && !issuesSel.size && !sigNow) { toast({ ico: 'info', title: 'Add a rating or a test result', body: 'Tap how the Wi-Fi feels, or run a speed test first.', st: 'fair', ms: 3500 }); return; }
  const r = {
    spot, at: Date.now(),
    ping: attach && test.ping != null ? Math.round(test.ping * 10) / 10 : null,
    jitter: attach && test.jitter != null ? Math.round(test.jitter * 10) / 10 : null,
    down: attach && test.down != null ? Math.round(test.down * 100) / 100 : null,
    up: attach && test.up != null ? Math.round(test.up * 100) / 100 : null,
    rssi: sigNow ? sigNow.rssi : null,
    band: sigNow ? sigNow.band : null,
    rating: rating || (issuesSel.has('none') ? 1 : null),
    issues: Array.from(issuesSel),
    note: ($('#repNote').value || '').trim().slice(0, 120),
    by: state.uid || null,
  };
  const btn = $('#sendReport');
  btn.disabled = true;
  let where = 'local';
  if (canShare()) {
    try { const ref = await state.db.collection('reports').add(r); where = 'shared'; justAdded.add(ref.id); }
    catch (e) {
      if (e && e.code === 'quota_exceeded') toast({ ico: 'alert', title: 'The shared report list is full', body: 'Your report was saved on this device instead.', st: 'weak' });
      if (e && (e.code === 'invalid_argument' || e.code === 'not_granted' || e.code === 'revoked')) state.canWrite = false;
    }
  }
  if (where === 'local') {
    const lr = sanitizeReport('l-' + uid8(), Object.assign({}, r, { local: true }));
    state.local.unshift(lr);
    state.local = state.local.slice(0, 60);
    store.set('reports', state.local);
    justAdded.add(lr.id);
  }
  btn.disabled = false;
  updateSaveNote();
  rating = 0; issuesSel.clear(); $('#repNote').value = '';
  $$('#rating .rate').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  $$('#issues .issue').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  toast({ ico: 'check', st: 'excellent', title: where === 'shared' ? 'Report sent for ' + SPOT[spot].name : 'Report saved for ' + SPOT[spot].name,
    body: where === 'shared' ? 'Everyone using WiFind can see it now.' : 'It is stored on this device and updates your map.', action: { label: 'See on map', fn: () => { showView('map'); selectSpot(spot, { focus: true }); } } });
  onReportsChanged();
}
const justAdded = new Set();
async function deleteReport(id) {
  const local = state.local.find((r) => r.id === id);
  if (local) {
    state.local = state.local.filter((r) => r.id !== id);
    store.set('reports', state.local);
  } else if (state.db) {
    try { await state.db.doc('reports/' + id).delete(); } catch (e) { toast({ ico: 'alert', title: 'Could not delete that report', body: 'Try again in a moment.', st: 'weak' }); return; }
    state.shared = state.shared.filter((r) => r.id !== id);
  }
  onReportsChanged();
}
function renderRepFeed() {
  const reps = allReports().sort((a, b) => b.at - a.at);
  $('#repCount').textContent = reps.length + ' report' + (reps.length === 1 ? '' : 's');
  const ul = $('#repFeed');
  if (!reps.length) {
    ul.innerHTML = '<li class="empty">' + icon('info') + '<span>No reports yet. Run a test, choose your spot, and send the first one.</span></li>';
    return;
  }
  ul.innerHTML = reps.slice(0, 12).map(repRowHTML).join('');
  $$('.rep', ul).forEach((li) => { if (justAdded.has(li.dataset.rid)) { li.classList.add('rep-new'); justAdded.delete(li.dataset.rid); } });
  $$('[data-del]', ul).forEach((b) => b.addEventListener('click', () => deleteReport(b.dataset.del)));
}
function renderMyTests() {
  const box = $('#myTests');
  const t = state.tests.slice(-10);
  if (!t.length) {
    box.innerHTML = '<div class="empty">' + icon('bolt') + '<span>Your speed tests show up here, so you can compare spots over time.</span></div>';
    return;
  }
  const Wd = 320, Hd = 70, pad = 8;
  const vals = t.map((x) => x.down || 0);
  const max = Math.max(10, Math.max.apply(null, vals) * 1.15);
  const xs = (i) => pad + (t.length === 1 ? (Wd - 2 * pad) / 2 : i * (Wd - 2 * pad) / (t.length - 1));
  const ys = (v) => Hd - 12 - (Hd - 22) * v / max;
  const pts = vals.map((v, i) => xs(i).toFixed(1) + ',' + ys(v).toFixed(1));
  let s = '<svg class="spark" viewBox="0 0 ' + Wd + ' ' + Hd + '" role="img" aria-label="Download speed of your last ' + t.length + ' tests">';
  s += '<line class="sp-grid" x1="0" x2="' + Wd + '" y1="' + ys(max / 2).toFixed(1) + '" y2="' + ys(max / 2).toFixed(1) + '"/>';
  s += '<text class="sp-lbl" x="2" y="' + (ys(max / 2) - 4).toFixed(1) + '">' + Math.round(max / 2) + ' Mbps</text>';
  if (t.length > 1) s += '<path class="sp-area" d="M' + xs(0).toFixed(1) + ' ' + (Hd - 12) + 'L' + pts.join('L') + 'L' + xs(t.length - 1).toFixed(1) + ' ' + (Hd - 12) + 'Z"/><path class="sp-line" d="M' + pts.join('L') + '"/>';
  vals.forEach((v, i) => { s += '<circle class="sp-dot" cx="' + xs(i).toFixed(1) + '" cy="' + ys(v).toFixed(1) + '" r="' + (i === vals.length - 1 ? 5 : 3.5) + '"/>'; });
  s += '</svg>';
  const last = t.slice().reverse().slice(0, 4).map((x) => '<li class="rep"><span>' + barsHTML(statusOf(scoreOf({ ping: x.ping, jitter: x.jitter, down: x.down })).bars, statusOf(scoreOf({ ping: x.ping, jitter: x.jitter, down: x.down })).key) + '</span><span style="min-width:0"><span class="who">' + (x.spot && SPOT[x.spot] ? esc(SPOT[x.spot].short) : 'Unlabeled spot') + '</span><span class="what" style="display:block">' + fmtMs(x.ping) + ' ms · ' + fmtMbps(x.down) + ' Mbps' + (typeof x.rssi === 'number' ? ' · ' + String(x.rssi).replace('-', '−') + ' dBm' : '') + '</span></span><span class="when">' + ago(x.at) + '</span></li>').join('');
  box.innerHTML = '<div class="eyebrow">Download speed, last ' + t.length + ' test' + (t.length === 1 ? '' : 's') + '</div>' + s + '<ul class="reports-mini">' + last + '</ul>';
}
let lastOutages = new Set();
function onReportsChanged(changes) {
  computeSnapshot();
  updateMapStatus();
  renderPanel({ keepScroll: true, quiet: true });
  renderRepFeed();
  renderFind();
  // outage + followed-spot report events
  const outs = new Set();
  for (const sp of SPOTS) { const l = liveFor(sp.id, LIVE_MS); if (l && l.outage) outs.add(sp.id); }
  for (const id of outs) {
    if (!lastOutages.has(id) && state.prefs.outage) {
      const l = liveFor(id, LIVE_MS);
      pushEvent({ kind: 'Outage report', ico: 'wifiOff', st: 'dead', title: 'Possible outage at ' + SPOT[id].name, body: l.outageCount + ' students reported no Wi-Fi there in the last hour.', spot: id }, true);
    }
  }
  lastOutages = outs;
  if (changes && state.prefs.follow) {
    for (const ch of changes) {
      if (ch.type !== 'added') continue;
      const r = sanitizeReport(ch.doc.id, ch.doc.data());
      if (!r || (state.uid && r.by === state.uid) || !state.follow.has(r.spot) || Date.now() - r.at > 10 * 60e3) continue;
      const bits = [];
      if (r.ping != null) bits.push(fmtMs(r.ping) + ' ms');
      if (r.down != null) bits.push(fmtMbps(r.down) + ' Mbps');
  if (r.up != null) bits.push(fmtMbps(r.up) + ' up');
      pushEvent({ kind: 'Spot you follow', ico: 'flag', st: S(r.spot).status.key, title: 'New report at ' + SPOT[r.spot].name, body: (bits.join(' · ') || (r.rating ? 'Rated ' + ['no signal', 'weak', 'fair', 'good', 'excellent'][r.rating - 1] : 'A student sent a report')) + '.', spot: r.spot }, true);
    }
  }
  rebuildFeed();
}

/* =========================================================
   Alerts, notifications, toasts
   ========================================================= */
function toast(o) {
  const box = $('#toasts');
  while (box.children.length >= 3) box.firstElementChild.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  if (o.st) el.dataset.st = o.st;
  el.setAttribute('role', 'status');
  el.innerHTML = '<div class="t-ico">' + icon(o.ico || 'wifi') + '</div><div style="min-width:0"><b>' + esc(o.title) + '</b>' + (o.body ? '<p>' + esc(o.body) + '</p>' : '') +
    (o.action ? '<button class="btn btn-sm btn-soft t-act" type="button">' + esc(o.action.label) + '</button>' : '') + '</div><button class="t-x" type="button" aria-label="Dismiss">' + icon('x') + '</button>';
  const close = () => { if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), 360); };
  el.querySelector('.t-x').addEventListener('click', close);
  if (o.action) el.querySelector('.t-act').addEventListener('click', () => { o.action.fn(); close(); });
  let timer = setTimeout(close, o.ms || 5200);
  el.addEventListener('pointerenter', () => clearTimeout(timer));
  el.addEventListener('pointerleave', () => { timer = setTimeout(close, 2200); });
  box.appendChild(el);
  const bell = $('#bellBtn');
  bell.classList.remove('ring-bell'); void bell.offsetWidth; bell.classList.add('ring-bell');
}
let lastEventToast = 0;
function pushEvent(ev, withToast) {
  ev.id = 'ev-' + uid8();
  ev.time = Date.now();
  state.events.unshift(ev);
  state.events = state.events.slice(0, 30);
  if (withToast && Date.now() - lastEventToast > 1400) {
    lastEventToast = Date.now();
    toast({ ico: ev.ico, st: ev.st, title: ev.title, body: ev.body, action: ev.spot ? { label: 'Show me', fn: () => { showView('map'); selectSpot(ev.spot, { focus: true }); } } : null });
  }
  rebuildFeed();
}
function crowdWindow(sp) {
  const scores = [];
  for (let h = H0; h <= H1; h += 0.5) scores.push([h, scoreOf(modelAt(sp, h))]);
  const max = Math.max.apply(null, scores.map((s) => s[1]));
  const low = scores.filter((s) => s[1] < max - 18 && statusOf(s[1]).rank < statusOf(max).rank);
  if (!low.length) return null;
  // longest contiguous run
  let best = null, cur = null;
  scores.forEach((s) => {
    const isLow = s[1] < max - 18 && statusOf(s[1]).rank < statusOf(max).rank;
    if (isLow) { if (!cur) cur = [s[0], s[0], s[1]]; else { cur[1] = s[0]; cur[2] = Math.min(cur[2], s[1]); } }
    else if (cur) { if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur; cur = null; }
  });
  if (cur && (!best || cur[1] - cur[0] > best[1] - best[0])) best = cur;
  return best ? { from: best[0], to: best[1] + 0.5, worst: statusOf(best[2]), bestSt: statusOf(max) } : null;
}
function buildFeed() {
  const items = [];
  state.events.forEach((e) => items.push(Object.assign({}, e, { kindLabel: e.kind, when: ago(e.time) })));
  const origin = ORIGIN[state.origin];
  const whenTxt = state.viewingNow ? 'Now' : fmtHour(state.hour);
  if (state.prefs.near) {
    const b = bestNear(origin.node), st = S(b.id);
    items.push({ id: 'near-' + b.id + '-' + state.origin + '-' + st.status.key, kindLabel: 'Strong spot near you', ico: 'wifi', st: st.status.key,
      title: b.name + ' has ' + st.status.label.toLowerCase() + ' ' + WIFI,
      body: walkMin(b) + ' min from ' + origin.name + (b.climb ? ', ' + climbTxt(b) : '') + '. ' + fmtMs(st.m.ping) + ' ms ping and ' + fmtMbps(st.m.down) + ' Mbps ' + (state.viewingNow ? 'right now' : 'at ' + fmtHour(state.hour)) + '.',
      when: whenTxt, spot: b.id, nav: true });
  }
  if (state.prefs.dead) {
    const deadBy = new Map();
    SPOTS.forEach((sp) => { if (S(sp.id).status.key === 'dead') { if (!deadBy.has(sp.pid)) deadBy.set(sp.pid, []); deadBy.get(sp.pid).push(sp); } });
    deadBy.forEach((list, pid) => {
      const pl = PLACE[pid];
      const better = betterSpotFor(list[0]);
      items.push({ id: 'dead-' + pid + '-' + list.length, kindLabel: 'Dead-zone warning', ico: 'wifiOff', st: 'dead',
        title: pl.isBldg ? pl.name + ': no usable ' + WIFI + ' on ' + (list.length === pl.spots.length ? 'any floor' : list.length + ' of ' + pl.spots.length + ' floors') : pl.name + ' has no usable ' + WIFI,
        body: (pl.isBldg ? 'Floors: ' + list.map((s) => FS(s.f)).join(', ') + '. ' : '') + 'Download files before you go, or use ' + (better ? better.name + ' (' + walkFromNode(list[0].node, better) + ' min away)' : 'mobile data') + '.',
        when: 'Ongoing', spot: list[0].id });
    });
    const weak = ranked().reverse().filter((sp) => S(sp.id).status.key === 'weak');
    if (weak.length) items.push({ id: 'weak-' + weak.map((s) => s.id).join('-'), kindLabel: 'Weak signal', ico: 'alert', st: 'weak',
      title: weak.length + ' weak spot' + (weak.length > 1 ? 's' : '') + ' at ' + fmtHour(state.hour),
      body: weak.slice(0, 5).map((s) => s.name).join(', ') + (weak.length > 5 ? ', and ' + (weak.length - 5) + ' more' : '') + '. Expect slow pages and dropped calls there.',
      when: whenTxt, spot: weak[0].id });
  }
  if (state.prefs.outage) {
    SPOTS.forEach((sp) => {
      const l = liveFor(sp.id, LIVE_MS);
      if (l && l.outage) items.push({ id: 'out-' + sp.id + '-' + l.lastAt, kindLabel: 'Outage report', ico: 'wifiOff', st: 'dead', title: 'Possible outage at ' + sp.name, body: l.outageCount + ' students reported no Wi-Fi there in the last hour.', when: ago(l.lastAt), spot: sp.id });
    });
  }
  if (state.prefs.crowd) {
    SPOTS.filter((sp) => !sp.noService).map((sp) => ({ sp, w: crowdWindow(sp) })).filter((x) => x.w)
      .sort((a, b) => ((b.w.bestSt.rank - b.w.worst.rank) - (a.w.bestSt.rank - a.w.worst.rank)) || ((b.w.to - b.w.from) - (a.w.to - a.w.from)))
      .slice(0, 3)
      .forEach(({ sp, w }) => items.push({ id: 'crowd-' + sp.id, kindLabel: 'Crowd forecast', ico: 'users', st: w.worst.key,
        title: sp.name + ' slows down ' + fmtHour(w.from).replace(':00', '') + '–' + fmtHour(w.to).replace(':00', ''),
        body: 'It drops from ' + w.bestSt.label.toLowerCase() + ' to ' + w.worst.label.toLowerCase() + ' when it gets busy. Plan your online tasks around it.', when: 'Daily', spot: sp.id }));
  }
  return items;
}
let feedItems = [];
function rebuildFeed() {
  feedItems = buildFeed();
  const unread = feedItems.filter((i) => !state.seen.has(i.id)).length;
  const badge = $('#bellBadge');
  badge.hidden = unread === 0;
  badge.textContent = unread > 9 ? '9+' : String(unread);
  $('#alertsDot').hidden = unread === 0;
  $('#bellBtn').setAttribute('aria-label', 'Alerts' + (unread ? ', ' + unread + ' unread' : ''));
  if (state.view === 'alerts') renderAlerts();
}
function renderAlerts() {
  const feed = $('#feed');
  if (!feedItems.length) {
    feed.innerHTML = '<li class="empty">' + icon('bell') + '<span>No alerts right now. Turn on more alert types on the right, or follow a spot from the map.</span></li>';
  } else {
    feed.innerHTML = feedItems.map((it) => '<li class="note' + (state.seen.has(it.id) ? '' : ' unread') + '" data-st="' + (it.st || '') + '">' +
      '<span class="n-ico">' + icon(it.ico) + '</span><div style="min-width:0"><div class="n-kind">' + esc(it.kindLabel) + '<span>·</span><span>' + esc(it.when) + '</span></div>' +
      '<h3>' + esc(it.title) + '</h3><p>' + esc(it.body) + '</p>' +
      (it.spot ? '<div class="n-actions"><button class="btn btn-sm btn-soft" type="button" data-fgo="' + it.spot + '">' + icon('map') + 'Show on map</button>' + (it.nav ? '<button class="btn btn-sm" type="button" data-fnav="' + it.spot + '">' + icon('nav') + 'Navigate</button>' : '') + '</div>' : '') +
      '</div></li>').join('');
    $$('[data-fgo]', feed).forEach((b) => b.addEventListener('click', () => { showView('map'); selectSpot(b.dataset.fgo, { focus: true }); }));
    $$('[data-fnav]', feed).forEach((b) => b.addEventListener('click', () => { showView('map'); navigateTo(b.dataset.fnav); }));
  }
  const fl = $('#followList');
  const ids = Array.from(state.follow).filter((id) => SPOT[id]);
  fl.innerHTML = ids.length ? ids.map((id) => '<li><span class="fl-name">' + esc(SPOT[id].name) + '</span><span style="display:flex;gap:8px;align-items:center">' + pill(S(id).status) + '<button class="btn btn-sm btn-ghost" type="button" data-unf="' + id + '" aria-label="Stop following ' + esc(SPOT[id].name) + '">' + icon('x') + '</button></span></li>').join('')
    : '<li class="empty">' + icon('bell') + '<span>Open a spot on the map and tap Follow to get alerts when it changes.</span></li>';
  $$('[data-unf]', fl).forEach((b) => b.addEventListener('click', () => toggleFollow(b.dataset.unf)));
}
function renderPrefs() {
  const P = [
    ['near', 'Strong spots near me', 'The best Wi-Fi close to where you are'],
    ['dead', 'Dead-zone warnings', 'Spots with weak or no Wi-Fi'],
    ['crowd', 'Crowd forecasts', 'When busy spots slow down each day'],
    ['outage', 'Outage reports', 'When several students report no Wi-Fi'],
    ['follow', 'Spots I follow', 'When a followed spot changes or gets a new report'],
  ];
  $('#prefs').innerHTML = P.map((p) => '<div class="pref"><div><b>' + p[1] + '</b><small>' + p[2] + '</small></div><label class="switch"><input type="checkbox" id="pref-' + p[0] + '" data-pref="' + p[0] + '"' + (state.prefs[p[0]] ? ' checked' : '') + ' aria-label="' + p[1] + '"><span></span></label></div>').join('');
  $$('#prefs input').forEach((inp) => inp.addEventListener('change', () => {
    state.prefs[inp.dataset.pref] = inp.checked; store.set('prefs', state.prefs);
    rebuildFeed(); updateAlertStrip();
  }));
}
function markAllRead() {
  feedItems.forEach((i) => state.seen.add(i.id));
  store.set('seen', Array.from(state.seen).slice(-300));
  rebuildFeed();
  renderAlerts();
}
function toggleFollow(id) {
  if (state.follow.has(id)) state.follow.delete(id); else state.follow.add(id);
  store.set('follow', Array.from(state.follow));
  const on = state.follow.has(id);
  toast({ ico: on ? 'bellOn' : 'bell', st: on ? S(id).status.key : null, title: on ? 'Following ' + SPOT[id].name : 'Stopped following ' + SPOT[id].name, body: on ? 'You’ll get an alert here when its Wi-Fi changes or a student reports it.' : '', ms: 3200 });
  renderPanel({ keepScroll: true, quiet: true });
  if (state.view === 'alerts') renderAlerts();
}

/* =========================================================
   Views / navigation
   ========================================================= */
const VIEWS = ['map', 'find', 'test', 'alerts', 'learn'];
function showView(v) {
  if (VIEWS.indexOf(v) < 0) v = 'map';
  const changed = v !== state.view;
  state.view = v;
  $('#app').dataset.view = v;
  VIEWS.forEach((id) => {
    const el = $('#view-' + id);
    const on = id === v;
    el.hidden = !on;
    if (on && changed) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
  });
  $$('.tab').forEach((t) => { if (t.dataset.view === v) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
  try { history.replaceState(null, '', '#' + v); } catch (e) { /* ignore */ }
  if (v === 'map') requestAnimationFrame(() => { if (!isWide()) setSheet(sheetState); if (!userMoved) fitCampus(0); updateMarkerScale(); });
  if (v === 'find') renderFind();
  if (v === 'alerts') { renderAlerts(); setTimeout(markAllRead, 1600); }
  if (v === 'test') { renderRepFeed(); renderMyTests(); connLine(); }
  lab.active(v === 'learn');
}

/* =========================================================
   Signal lab (Learn)
   ========================================================= */
const lab = (() => {
  const L = { W: 30, H: 18, ap: { x: 16, y: 9.5 }, phone: { x: 4, y: 6.5 }, band: '5', crowd: 25, heat: true };
  const MAT = {
    glass: { name: 'Glass partition', loss: { '2.4': 3, '5': 4 }, col: '#7CC4F4' },
    drywall: { name: 'Drywall', loss: { '2.4': 3, '5': 5 }, col: '#D2B98F' },
    chb: { name: 'Hollow-block wall', loss: { '2.4': 8, '5': 12 }, col: '#A59E93' },
    brick: { name: 'Outer wall', loss: { '2.4': 10, '5': 14 }, col: '#857F77' },
    concrete: { name: 'Concrete stair core', loss: { '2.4': 13, '5': 19 }, col: '#56606E' },
  };
  const WALLS = [
    [0, 0, 30, 0, 'brick'], [30, 0, 30, 18, 'brick'], [30, 18, 0, 18, 'brick'], [0, 18, 0, 0, 'brick'],
    [12, 0, 12, 9.4, 'chb'], [12, 10.6, 12, 11, 'chb'],
    [0, 11, 10.4, 11, 'glass'],
    [6, 11, 6, 18, 'drywall'], [12, 11, 12, 15.4, 'drywall'], [12, 16.9, 12, 18, 'drywall'],
    [22, 0, 22, 7, 'concrete'], [22, 7, 28.2, 7, 'concrete'],
    [20, 12, 20, 18, 'chb'], [20, 12, 25.8, 12, 'chb'], [27.6, 12, 30, 12, 'chb'],
  ];
  const ROOMS = [['Classroom', 6, 2.4], ['Hallway', 17, 3.5], ['Stairs', 26, 3.5], ['Study area', 3, 14.8], ['Faculty', 9, 14.8], ['Lab', 25, 15.2], ['Hallway', 16, 15.2]];
  let cv, ctx, wrap, cw = 0, ch = 0, dpr = 1, heatCv, heatDirty = true, raf = 0, on = false, drag = null, colors = {};
  const cross = (x1, y1, x2, y2) => x1 * y2 - y1 * x2;
  function segX(ax, ay, bx, by, cx, cy, dx, dy) {
    const d1 = cross(dx - cx, dy - cy, ax - cx, ay - cy), d2 = cross(dx - cx, dy - cy, bx - cx, by - cy);
    const d3 = cross(bx - ax, by - ay, cx - ax, cy - ay), d4 = cross(bx - ax, by - ay, dx - ax, dy - ay);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }
  function rssiAt(px, py) {
    const d = Math.max(0.5, Math.hypot(px - L.ap.x, py - L.ap.y));
    const pl1 = L.band === '5' ? 46.4 : 40.1;
    let loss = 0; const hits = [];
    for (const w of WALLS) if (segX(L.ap.x, L.ap.y, px, py, w[0], w[1], w[2], w[3])) { loss += MAT[w[4]].loss[L.band]; hits.push(w); }
    const pathLoss = pl1 + 26 * Math.log10(d);
    return { rssi: 23 - pathLoss - loss, d, pathLoss, loss, hits };
  }
  const stKey = (r) => (r >= -55 ? 'excellent' : r >= -63 ? 'good' : r >= -70 ? 'fair' : r >= -78 ? 'weak' : 'dead');
  function phy(r) {
    const t = L.band === '5' ? [[-55, 400], [-62, 270], [-68, 150], [-74, 65], [-80, 20]] : [[-55, 120], [-62, 90], [-68, 58], [-74, 30], [-82, 11]];
    for (const [th, v] of t) if (r >= th) return v;
    return 0;
  }
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const g = (n) => cs.getPropertyValue(n).trim() || '#888';
    colors = { excellent: g('--q-excellent'), good: g('--q-good'), fair: g('--q-fair'), weak: g('--q-weak'), dead: g('--q-dead'),
      surface: g('--surface'), surface2: g('--surface-2'), line: g('--line'), ink: g('--ink'), ink2: g('--ink-2'), ink3: g('--ink-3'), accent: g('--accent'), onAccent: g('--on-accent') };
    heatDirty = true;
  }
  function hexToRgb(c) {
    const m = /^#?([0-9a-f]{6})$/i.exec(c.replace('#', '').length === 6 ? c : '');
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    const t = document.createElement('canvas').getContext('2d'); t.fillStyle = c; const v = t.fillStyle;
    if (/^#/.test(v)) { const n = parseInt(v.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return [128, 128, 128];
  }
  function buildHeat() {
    const gx = 60, gy = 36;
    if (!heatCv) { heatCv = document.createElement('canvas'); heatCv.width = gx; heatCv.height = gy; }
    const hc = heatCv.getContext('2d');
    const img = hc.createImageData(gx, gy);
    const rgb = {}; ['excellent', 'good', 'fair', 'weak', 'dead'].forEach((k) => { rgb[k] = hexToRgb(colors[k]); });
    for (let y = 0; y < gy; y++) for (let x = 0; x < gx; x++) {
      const r = rssiAt((x + 0.5) * L.W / gx, (y + 0.5) * L.H / gy).rssi;
      const c = rgb[stKey(r)], i = (y * gx + x) * 4;
      img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 120;
    }
    hc.putImageData(img, 0, 0);
    heatDirty = false;
  }
  function resize() {
    if (!wrap) return;
    const w = wrap.clientWidth;
    if (!w) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = w; ch = Math.round(w * L.H / L.W);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    cv.style.height = ch + 'px';
    draw(performance.now());
  }
  const s = () => cw / L.W;
  function draw(t) {
    if (!ctx || !cw) return;
    const k = s();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = colors.surface; ctx.fillRect(0, 0, cw, ch);
    if (L.heat) {
      if (heatDirty) buildHeat();
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(heatCv, 0, 0, cw, ch);
    }
    // grid
    ctx.strokeStyle = colors.line; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let x = 1; x < L.W; x++) { ctx.moveTo(x * k + 0.5, 0); ctx.lineTo(x * k + 0.5, ch); }
    for (let y = 1; y < L.H; y++) { ctx.moveTo(0, y * k + 0.5); ctx.lineTo(cw, y * k + 0.5); }
    ctx.stroke(); ctx.globalAlpha = 1;
    // waves
    if (!RM) {
      for (let i = 0; i < 3; i++) {
        const f = ((t / 2200) + i / 3) % 1;
        ctx.beginPath(); ctx.arc(L.ap.x * k, L.ap.y * k, f * 14 * k, 0, Math.PI * 2);
        ctx.strokeStyle = colors.accent; ctx.globalAlpha = (1 - f) * 0.45; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // rooms
    ctx.fillStyle = colors.ink2; ctx.font = '700 ' + Math.max(10, k * 0.62).toFixed(1) + 'px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center';
    ROOMS.forEach((r) => ctx.fillText(r[0].toUpperCase(), r[1] * k, r[2] * k));
    // walls
    ctx.lineCap = 'round';
    for (const w of WALLS) {
      ctx.beginPath(); ctx.moveTo(w[0] * k, w[1] * k); ctx.lineTo(w[2] * k, w[3] * k);
      ctx.strokeStyle = MAT[w[4]].col; ctx.lineWidth = w[4] === 'concrete' ? Math.max(5, k * 0.42) : w[4] === 'glass' || w[4] === 'drywall' ? Math.max(3, k * 0.22) : Math.max(4, k * 0.32);
      ctx.stroke();
    }
    // signal path
    const R = rssiAt(L.phone.x, L.phone.y);
    const key = stKey(R.rssi);
    ctx.setLineDash([6, 6]); ctx.lineWidth = 2.5; ctx.strokeStyle = colors[key];
    ctx.beginPath(); ctx.moveTo(L.ap.x * k, L.ap.y * k); ctx.lineTo(L.phone.x * k, L.phone.y * k); ctx.stroke(); ctx.setLineDash([]);
    R.hits.forEach((w) => {
      const p = intersect(L.ap.x, L.ap.y, L.phone.x, L.phone.y, w[0], w[1], w[2], w[3]);
      if (!p) return;
      ctx.beginPath(); ctx.arc(p[0] * k, p[1] * k, 7, 0, Math.PI * 2); ctx.fillStyle = colors.dead; ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = '800 9px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('×', p[0] * k, p[1] * k + 3.2);
      const lbl = '−' + MAT[w[4]].loss[L.band] + ' dB';
      ctx.font = '800 11px "JetBrains Mono", ui-monospace, monospace';
      const tw = ctx.measureText(lbl).width + 10;
      ctx.fillStyle = colors.surface; ctx.globalAlpha = 0.92; roundRect(p[0] * k + 9, p[1] * k - 20, tw, 18, 6); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = colors.dead; ctx.textAlign = 'left'; ctx.fillText(lbl, p[0] * k + 14, p[1] * k - 7);
    });
    // AP
    const ax = L.ap.x * k, ay = L.ap.y * k;
    ctx.beginPath(); ctx.arc(ax, ay, 15, 0, Math.PI * 2); ctx.fillStyle = colors.accent; ctx.fill();
    ctx.strokeStyle = colors.onAccent; ctx.lineWidth = 2; ctx.lineCap = 'round';
    [3.5, 7].forEach((r) => { ctx.beginPath(); ctx.arc(ax, ay + 4, r, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(ax, ay + 4, 1.6, 0, Math.PI * 2); ctx.fillStyle = colors.onAccent; ctx.fill();
    ctx.fillStyle = colors.ink; ctx.font = '800 11px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ACCESS POINT', ax, ay + 29);
    // phone
    const px = L.phone.x * k, py = L.phone.y * k;
    ctx.fillStyle = colors.ink; roundRect(px - 10, py - 17, 20, 34, 5); ctx.fill();
    ctx.fillStyle = colors[key]; roundRect(px - 7, py - 13, 14, 24, 2.5); ctx.fill();
    const bars = rssiBars(R.rssi);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i < bars ? colors[key] : colors.line; roundRect(px - 11 + i * 6.2, py - 24 - i * 3 - 3, 4.4, 6 + i * 3, 1.2); ctx.fill(); }
    ctx.fillStyle = colors.ink; ctx.font = '800 11px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('YOU', px, py + 30);
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function intersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const den = (ax - bx) * (cy - dy) - (ay - by) * (cx - dx);
    if (!den) return null;
    const tt = ((ax - cx) * (cy - dy) - (ay - cy) * (cx - dx)) / den;
    return [ax + tt * (bx - ax), ay + tt * (by - ay)];
  }
  function readout() {
    const R = rssiAt(L.phone.x, L.phone.y);
    const key = stKey(R.rssi);
    const active = 1 + L.crowd * 0.3;
    const speed = phy(R.rssi) * 0.5 / active;
    const ping = R.rssi < -82 ? null : 6 + L.crowd * 0.32 + (L.band === '2.4' ? 5 : 0) + (R.rssi < -70 ? (-70 - R.rssi) * 3.5 : 0);
    const label = { excellent: 'Excellent signal', good: 'Good signal', fair: 'Fair signal', weak: 'Weak signal', dead: 'Almost no signal' }[key];
    const okCall = speed >= 3 && ping != null && ping <= 90 && R.rssi >= -69;
    const okBrowse = speed >= 1.5 && ping != null && ping <= 200;
    const worstWall = R.hits.length ? MAT[R.hits.slice().sort((a, b) => MAT[b[4]].loss[L.band] - MAT[a[4]].loss[L.band])[0][4]].name.toLowerCase() : '';
    let verdict;
    if (okCall) verdict = '<b>Good enough for a video call.</b> ' + (L.crowd > 80 ? 'Fewer devices on this access point would make it faster.' : R.loss >= 8 ? 'The ' + worstWall + ' still costs you ' + R.loss + ' dB. A clear line of sight would be stronger.' : 'You are close to the access point with little in the way.');
    else if (okBrowse) verdict = '<b>Fine for browsing, but video calls may stutter.</b> ' + (R.loss >= 12 ? 'Get out from behind the ' + worstWall + '.' : L.crowd > 60 ? 'Too many devices share this access point.' : 'Move closer to the access point.');
    else verdict = '<b>Too weak for schoolwork.</b> ' + (R.loss ? 'Walls are eating ' + R.loss + ' dB of signal. ' : '') + 'Move closer to the access point' + (L.band === '5' ? ' or try 2.4 GHz, which passes through walls better.' : '.');
    const rows = '<li><span>Distance (' + R.d.toFixed(1) + ' m)</span><b>−' + Math.round(R.pathLoss - (L.band === '5' ? 46.4 : 40.1)) + ' dB</b></li>' +
      R.hits.map((w) => '<li><span>' + MAT[w[4]].name + '</span><b>−' + MAT[w[4]].loss[L.band] + ' dB</b></li>').join('') +
      (R.hits.length ? '' : '<li><span>No walls in the way</span><b>0 dB</b></li>');
    $('#labRead').innerHTML =
      '<div class="eyebrow">Your phone</div>' +
      '<div class="lr-big" data-st="' + key + '">' + barsHTML(rssiBars(R.rssi), key) + '<div><b>' + Math.round(R.rssi) + ' dBm</b><small>' + label + '</small></div></div>' +
      '<div class="lr-rows"><div class="tr-box"><small>Est. speed</small><b>' + (speed < 10 ? speed.toFixed(1) : Math.round(speed)) + '</b><em>Mbps</em></div><div class="tr-box"><small>Est. ping</small><b>' + (ping == null ? '—' : Math.round(ping)) + '</b><em>ms</em></div></div>' +
      '<div><div class="eyebrow" style="margin-bottom:6px">What weakens the signal</div><ul class="lr-path">' + rows + '</ul></div>' +
      '<div class="lr-verdict">' + verdict + '</div>' +
      '<p class="faint" style="font-size:12px">Speed is shared by the ' + L.crowd + ' device' + (L.crowd === 1 ? '' : 's') + ' on this access point. This is a teaching model, not a measurement.</p>';
  }
  function toMeters(e) { const r = cv.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) / r.width * L.W, 0.4, L.W - 0.4), y: clamp((e.clientY - r.top) / r.height * L.H, 0.4, L.H - 0.4) }; }
  function setup() {
    cv = $('#labCanvas'); wrap = $('#labWrap'); ctx = cv.getContext('2d');
    readColors();
    cv.addEventListener('pointerdown', (e) => {
      const p = toMeters(e), k = s();
      const dAp = Math.hypot(p.x - L.ap.x, p.y - L.ap.y) * k, dPh = Math.hypot(p.x - L.phone.x, p.y - L.phone.y) * k;
      drag = dAp < 26 && dAp < dPh ? 'ap' : 'phone';
      const hint = $('.lab-hint'); if (hint) hint.classList.add('gone');
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      move(p);
    });
    cv.addEventListener('pointermove', (e) => { if (drag) move(toMeters(e)); });
    const up = () => { drag = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    $$('#bandSeg button').forEach((b) => b.addEventListener('click', () => {
      L.band = b.dataset.band; heatDirty = true;
      $$('#bandSeg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      readout(); draw(performance.now());
    }));
    $$('#heatSeg button').forEach((b) => b.addEventListener('click', () => {
      L.heat = b.dataset.heat === '1';
      $$('#heatSeg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw(performance.now());
    }));
    $('#crowdRange').addEventListener('input', (e) => { L.crowd = +e.target.value; $('#crowdLbl').textContent = L.crowd + ' device' + (L.crowd === 1 ? '' : 's'); readout(); });
    if (window.ResizeObserver) new ResizeObserver(() => { if (on) resize(); }).observe(wrap);
    readout();
  }
  function move(p) {
    if (drag === 'ap') { L.ap.x = p.x; L.ap.y = p.y; heatDirty = true; } else { L.phone.x = p.x; L.phone.y = p.y; }
    readout();
    if (RM) draw(performance.now());
  }
  function loop(t) { draw(t); raf = on ? requestAnimationFrame(loop) : 0; }
  function active(v) {
    if (!cv) return;
    on = v;
    if (v) { readColors(); resize(); readout(); if (!raf) raf = requestAnimationFrame(loop); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  return { setup, active, readColors, materials: MAT };
})();

function renderLearnStatic() {
  const F = [
    ['ruler', 'Distance', 'Wi-Fi fades quickly as you move away from the access point. Every time your distance doubles, the signal drops by about 6 dB in open air, and more indoors.'],
    ['wall', 'Walls and materials', 'Each wall between you and the access point takes a bite out of the signal. Thick concrete is the worst.', true],
    ['users', 'Crowds', 'Everyone on the same access point shares its airtime. A canteen at lunch can put hundreds of phones on a few access points. Bodies also absorb Wi-Fi because they are mostly water.'],
    ['wave', '2.4 GHz vs 5 GHz', '5 GHz is faster and less crowded but does not pass through walls as well. 2.4 GHz reaches farther but shares the air with Bluetooth, microwaves and nearby networks.'],
    ['micro', 'Interference', 'Microwave ovens, Bluetooth speakers and the Wi-Fi of nearby shops use the same airwaves. More noise means more retries and higher ping.'],
    ['router', 'Access point placement', 'A room with its own access point beats a room borrowing signal from the hallway. Being able to see the access point matters more than almost anything else.'],
  ];
  const mats = [['Glass', '3–4 dB', '#7CC4F4'], ['Drywall', '3–5 dB', '#D2B98F'], ['Hollow blocks (CHB)', '8–12 dB', '#A59E93'], ['Concrete', '13–19 dB', '#56606E'], ['Metal, elevator shafts', '20+ dB', '#2F3640']];
  $('#factors').innerHTML = F.map((f) => '<div class="factor"><span class="f-ico">' + icon(f[0]) + '</span><h3>' + f[1] + '</h3><p>' + f[2] + '</p>' +
    (f[3] ? '<ul class="mat">' + mats.map((m) => '<li><i style="--mc:' + m[2] + '"></i><span>' + m[0] + '</span><b>−' + m[1] + '</b></li>').join('') + '</ul>' : '') + '</div>').join('');
  const scale = (title, segs, lbls, rows) => '<div class="scale"><h3>' + title + '</h3><div class="scale-bar">' + segs.map((k) => '<i data-st="' + k + '"></i>').join('') + '</div>' +
    '<div class="scale-lbls">' + lbls.map((l) => '<span>' + l + '</span>').join('') + '</div><div class="scale-rows">' + rows.map((r) => '<div><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div></div>';
  $('#scales').innerHTML =
    scale('Signal strength (dBm)', ['excellent', 'good', 'fair', 'weak', 'dead'], ['−30', '−55', '−63', '−70', '−78', '−90'],
      [['Excellent, right by the access point', '−30 to −55'], ['Good, fine for video calls', '−55 to −67'], ['Weak, browsing only', '−67 to −78'], ['Unreliable', 'below −78']]) +
    scale('Ping (ms)', ['excellent', 'good', 'fair', 'weak', 'dead'], ['0', '25', '50', '90', '150', '300+'],
      [['Feels instant', 'under 25'], ['Smooth video calls', 'under 50'], ['Noticeable lag in calls', '90 to 150'], ['Pages and calls stall', 'over 150']]) +
    scale('Download speed (Mbps)', ['dead', 'weak', 'fair', 'good', 'excellent'], ['0', '2', '6', '15', '30', '50+'],
      [['Research and browsing', '3+'], ['Video call (HD)', '4+ down, 3+ up'], ['Canva, Google Docs', '15+'], ['Big downloads', '30+']]) +
    scale('Jitter and packet loss', ['excellent', 'good', 'fair', 'weak', 'dead'], ['0', '6', '12', '22', '35', 'ms'],
      [['Steady calls', 'jitter under 15 ms'], ['No frozen video', 'loss under 1%'], ['Choppy audio', 'jitter over 30 ms']]);
}

/* =========================================================
   Shared reports (db capability, when the viewer provides it)
   ========================================================= */
async function initDb() {
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return;
  try {
    const [db, user] = await Promise.all([c.use('db').catch(() => null), c.use('user').catch(() => null)]);
    if (user) {
      try { state.uid = await user.id(); } catch (e) { state.uid = null; }
      try { const w = await user.can('data.write'); state.canWrite = w === null || w === undefined ? null : !!w; } catch (e) { state.canWrite = null; }
    }
    if (!db) { updateSaveNote(); return; }
    state.db = db;
    updateSaveNote();
    let first = true;
    db.collection('reports').orderBy('at', 'desc').limit(400).onSnapshot((snap) => {
      state.shared = snap.docs.map((d) => sanitizeReport(d.id, d.data())).filter(Boolean);
      state.dbReady = true;
      onReportsChanged(first ? null : snap.docChanges());
      first = false;
    }, () => { state.db = null; updateSaveNote(); });
  } catch (e) { /* runs fine without shared reports */ }
}


/* =========================================================
   Android app: the phone's real Wi-Fi signal.
   window.WiFindNative only exists inside the WiFind Android app,
   so none of this shows on the website.
   ========================================================= */
const NATIVE = (() => { const n = window.WiFindNative; return n && typeof n.getWifiInfo === 'function' ? n : null; })();
const sig = { mode: null, info: null, scan: [], scanAt: 0, hist: [], here: null, hereFrom: null, cand: null, candN: 0, poll: 0, scanTimer: 0, toldScanLimit: 0 };
const ST_BY_BARS = ['dead', 'weak', 'fair', 'good', 'excellent'];
const normB = (b) => (typeof b === 'string' && /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i.test(b) && b !== '02:00:00:00:00:00' ? b.toLowerCase() : null);
const AP_BUILTIN = {};
for (const k of Object.keys(AP_MAP)) { const b = normB(k); if (b && SPOT[AP_MAP[k]]) AP_BUILTIN[b] = AP_MAP[k]; }
function loadMyAps() {
  const m = store.get('apMap', {});
  const out = {};
  if (m && typeof m === 'object' && !Array.isArray(m)) for (const k of Object.keys(m)) { const b = normB(k), v = m[k]; if (b && v && SPOT[v.spot]) out[b] = { spot: v.spot, rssi: typeof v.rssi === 'number' ? v.rssi : -90, at: +v.at || 0 }; }
  return out;
}
let myAps = loadMyAps();
function apSpot(b) {
  b = normB(b);
  if (!b) return null;
  return myAps[b] ? myAps[b].spot : AP_BUILTIN[b] || null;
}
function nativeJSON(fn, arg) {
  if (!NATIVE || typeof NATIVE[fn] !== 'function') return null;
  try {
    const out = arg === undefined ? NATIVE[fn]() : NATIVE[fn](arg);
    return typeof out === 'string' && out ? JSON.parse(out) : out;
  } catch (e) { return null; }
}
// The phone's current reading, or null (also null on the website)
function phoneSignal() {
  const i = sig.info;
  return i && i.connected && typeof i.rssi === 'number' && i.rssi < 0 && i.rssi > -127 ? { rssi: Math.round(i.rssi), band: i.band || null, bssid: normB(i.bssid) } : null;
}
function sigMode(i) {
  if (!i || !i.ok) return 'error';
  if (!i.wifiEnabled) return 'wifiOff';
  if (!i.connected) return 'disconnected';
  return 'ok';
}

function sigHeadHTML(title, sub, live) {
  return '<div class="sg-head"><div><div class="eyebrow">Your ' + WIFI + ' signal</div><h2>' + title + '</h2>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div>' +
    (live ? '<span class="tag tag-live">Live</span>' : '') + '</div>';
}
function nearbyHTML() {
  return '<div class="section-title"><h3>Nearby access points</h3><button class="btn btn-sm" type="button" data-sg="scan">' + icon('refresh') + 'Scan</button></div><ul class="sg-near" id="sgNearby"></ul>';
}
function renderSignalCard() {
  const card = $('#signalCard');
  const m = sig.mode;
  if (m === 'error') {
    card.innerHTML = sigHeadHTML('Couldn’t read this phone’s ' + WIFI, 'Close WiFind and open it again. If it keeps happening, restart ' + WIFI + '.');
  } else if (m === 'wifiOff' || m === 'disconnected') {
    card.innerHTML = sigHeadHTML(m === 'wifiOff' ? WIFI + ' is off' : 'Not connected to ' + WIFI,
      'Connect to the campus ' + WIFI + ' to see your signal strength and which access point you’re on.') +
      '<div class="sg-actions"><button class="btn btn-primary" type="button" data-sg="wifi">' + icon('wifi') + 'Open ' + WIFI + ' settings</button></div>' +
      '<div class="sg-note" id="sgPerm" hidden></div>' + nearbyHTML();
  } else {
    card.innerHTML = sigHeadHTML('Live from this phone', '', true) +
      '<div class="sg-grid"><div class="sg-col">' +
        '<div class="sg-read" id="sgRead"><span id="sgBars"></span><span class="sg-num"><b id="sgVal">—</b><small>dBm</small></span><span class="sg-lbl" id="sgLbl"></span></div>' +
        '<svg class="sg-spark" id="sgSpark" viewBox="0 0 300 56" preserveAspectRatio="none" aria-hidden="true"></svg>' +
        '<div class="sg-scale"><span>Last 90 seconds</span><span>−30 dBm is best · −90 dBm is unusable</span></div>' +
        '<div class="sg-note" id="sgPerm" hidden></div>' +
        '<div class="sg-facts" id="sgFacts"></div>' +
      '</div><div class="sg-col">' +
        '<div id="sgHere"></div>' +
        '<div class="sg-tag"><label class="field-label" for="sgSpot">This access point is in</label>' +
          '<div class="sg-tagrow"><select class="select" id="sgSpot"></select><button class="btn btn-primary" type="button" data-sg="save">' + icon('pin') + 'Save</button></div>' +
          '<div class="sg-mapped" id="sgMapped"></div></div>' +
      '</div></div>' + nearbyHTML();
    const sel = $('#sgSpot');
    sel.innerHTML = spotOptionsHTML();
    sel.value = sig.here || $('#repSpot').value || '';
  }
  updateLive();
  renderNearby();
}
function updateLive() {
  const i = sig.info;
  if (!i) return;
  const ps = phoneSignal();
  if ($('#sgVal')) {
    const bars = ps ? rssiBars(ps.rssi) : 0;
    const st = ST_BY_BARS[bars];
    $('#sgRead').dataset.st = st;
    $('#sgBars').innerHTML = barsHTML(bars, st);
    $('#sgVal').textContent = ps ? String(ps.rssi).replace('-', '−') : '—';
    $('#sgLbl').textContent = ps ? describe.rssi(ps.rssi) : 'Reading…';
    drawSpark(st);
    const fact = (lbl, val, mono) => '<div class="sg-fact"><small>' + lbl + '</small><b' + (mono ? ' class="mono"' : '') + '>' + esc(val) + '</b></div>';
    const b = normB(i.bssid);
    $('#sgFacts').innerHTML =
      fact('Network', i.ssid || 'Hidden') +
      fact('Band', (i.band || '—') + (i.channel ? ' · ch ' + i.channel : '')) +
      fact('Link speed', i.linkSpeed > 0 ? i.linkSpeed + ' Mbps' : '—') +
      fact('Access point', b || 'Hidden', !!b) +
      (i.standard ? fact('Standard', i.standard) : '');
    updateHere();
  }
  const pn = $('#sgPerm');
  if (pn) {
    let h = '';
    if (i.permission !== 'granted') {
      const blocked = i.permission === 'blocked';
      h = icon('pin') + '<span>' + (blocked
        ? 'Location access is off for WiFind, so Android hides the network name and access point. Turn on <b>Location → Allow</b> in WiFind’s settings.'
        : 'Allow location so Android shares the network name and which access point you’re on. WiFind only uses it to match the access point to a building and floor.') + '</span>' +
        '<button class="btn btn-sm btn-soft" type="button" data-sg="' + (blocked ? 'app' : 'perm') + '">' + (blocked ? 'Open settings' : 'Allow') + '</button>';
    } else if (!i.locationEnabled) {
      h = icon('pin') + '<span>Turn on Location on this phone. Android hides ' + WIFI + ' details while Location is off.</span><button class="btn btn-sm btn-soft" type="button" data-sg="location">Turn on</button>';
    }
    pn.hidden = !h;
    if (pn.innerHTML !== h) pn.innerHTML = h;
  }
}
function drawSpark(st) {
  const svg = $('#sgSpark');
  if (!svg) return;
  svg.dataset.st = st;
  const v = sig.hist;
  if (v.length < 2) { svg.innerHTML = ''; return; }
  const W = 300, H = 56, n = 45;
  const x = (k) => W - (v.length - 1 - k) * (W / (n - 1));
  const y = (r) => 4 + (H - 8) * (1 - clamp((r + 95) / 65, 0, 1));
  const pts = v.map((r, k) => x(k).toFixed(1) + ',' + y(r).toFixed(1));
  svg.innerHTML = '<line class="sg-mid" x1="0" x2="' + W + '" y1="' + y(-67).toFixed(1) + '" y2="' + y(-67).toFixed(1) + '"/>' +
    '<path class="sg-area" d="M' + x(0).toFixed(1) + ' ' + H + 'L' + pts.join('L') + 'L' + W + ' ' + H + 'Z"/>' +
    '<path class="sg-line" d="M' + pts.join('L') + '"/>' +
    '<circle class="sg-dot" cx="' + x(v.length - 1).toFixed(1) + '" cy="' + y(v[v.length - 1]).toFixed(1) + '" r="3.5"/>';
}
function updateHere() {
  const el = $('#sgHere');
  if (!el) return;
  const i = sig.info || {};
  const b = normB(i.bssid);
  let h;
  if (sig.here) {
    const sp = SPOT[sig.here], st = S(sig.here).status;
    h = '<div class="sg-loc" data-st="' + st.key + '">' + icon('pin') + '<div><b>You’re at ' + esc(sp.name) + '</b><small>Matched by the access point you’re ' + (sig.hereFrom === 'connected' ? 'connected to' : 'closest to') + '</small></div>' +
      '<button class="btn btn-sm" type="button" data-sg="show">Map</button></div>';
  } else if (b) {
    h = '<div class="sg-loc unknown">' + icon('info') + '<div><b>This access point isn’t on the map yet</b><small>Pick where you are below and tap Save. Next time, WiFind will know where you are.</small></div></div>';
  } else {
    h = '<div class="sg-loc unknown">' + icon('info') + '<div><b>Where are you?</b><small>WiFind can find your building and floor from the access point once location is allowed.</small></div></div>';
  }
  if (el.innerHTML !== h) el.innerHTML = h;
  const nMine = Object.keys(myAps).length, nBuilt = Object.keys(AP_BUILTIN).length;
  const mh = '<span>' + nMine + ' access point' + (nMine === 1 ? '' : 's') + ' saved on this phone' + (nBuilt ? ' · ' + nBuilt + ' built in' : '') + '</span>' +
    (nMine ? '<span class="sg-links"><button class="linkbtn" type="button" data-sg="share">Share list</button><button class="linkbtn" type="button" data-sg="clear">Clear</button></span>' : '');
  const mp = $('#sgMapped');
  if (mp.innerHTML !== mh) mp.innerHTML = mh;
}
function renderNearby() {
  const ul = $('#sgNearby');
  if (!ul) return;
  const i = sig.info || {};
  let h;
  if (i.permission !== 'granted') h = '<li class="empty">' + icon('info') + '<span>Allow location to see the access points around you.</span></li>';
  else if (!i.locationEnabled) h = '<li class="empty">' + icon('info') + '<span>Turn on Location to scan for access points.</span></li>';
  else if (!sig.scan.length) h = '<li class="empty">' + icon('refresh') + '<span>' + (sig.scanAt ? 'No access points found yet. Tap Scan to try again.' : 'Scanning…') + '</span></li>';
  else {
    const cur = normB(i.bssid);
    h = sig.scan.slice(0, 8).map((r) => {
      const b = normB(r.bssid), bars = rssiBars(r.rssi), st = ST_BY_BARS[bars], sp = apSpot(b);
      const right = b && b === cur ? 'Connected' : sp ? SPOT[sp].short : 'dBm';
      return '<li class="sg-ap' + (b && b === cur ? ' cur' : '') + '"><span>' + barsHTML(bars, st) + '</span><span class="sg-ap-name"><b>' + esc(r.ssid || 'Hidden network') + '</b><small>' + esc([b, r.band, r.channel ? 'ch ' + r.channel : ''].filter(Boolean).join(' · ')) + '</small></span>' +
        '<span class="sg-ap-right"><b>' + String(r.rssi).replace('-', '−') + '</b><small>' + esc(right) + '</small></span></li>';
    }).join('') + (sig.scan.length > 8 ? '<li class="sg-more">and ' + (sig.scan.length - 8) + ' more</li>' : '');
  }
  if (ul.innerHTML !== h) ul.innerHTML = h;
}

// Where am I? The connected access point wins; otherwise the strongest known one nearby.
function locate() {
  const i = sig.info || {};
  let spot = null, from = null;
  const b = normB(i.bssid);
  if (i.connected && b && apSpot(b)) { spot = apSpot(b); from = 'connected'; }
  else if (Date.now() - sig.scanAt < 120e3) {
    for (const r of sig.scan) { const s = apSpot(r.bssid); if (s && r.rssi >= -75) { spot = s; from = 'nearby'; break; } }
  }
  if (spot === sig.here) { sig.hereFrom = from; sig.cand = null; sig.candN = 0; return; }
  // wait for two readings in a row before moving, so a flickering access point doesn't bounce you around
  if (spot !== sig.cand) { sig.cand = spot; sig.candN = 1; return; }
  if (++sig.candN < 2) return;
  sig.here = spot; sig.hereFrom = from; sig.cand = null; sig.candN = 0;
  if (spot) onLocated(spot);
}
function onLocated(spot) {
  const sp = SPOT[spot];
  $('#repSpot').value = spot; store.set('lastSpot', spot);
  const sel = $('#sgSpot');
  if (sel && document.activeElement !== sel) sel.value = spot;
  if (ORIGIN[sp.pid] && state.origin !== sp.pid) setOrigin(sp.pid);
  toast({ ico: 'pin', st: S(spot).status.key, title: 'You’re at ' + sp.name, body: 'Found from the ' + WIFI + ' access point. Walking times and reports now start here.', ms: 4200,
    action: { label: 'See on map', fn: () => { showView('map'); selectSpot(spot, { focus: true }); } } });
}

function saveHere() {
  const spot = $('#sgSpot').value;
  if (!SPOT[spot]) { toast({ ico: 'pin', title: 'Choose where you are first', body: 'Pick the building and floor this access point is in.', st: 'fair', ms: 3500 }); $('#sgSpot').focus(); return; }
  const i = sig.info || {};
  const cur = normB(i.bssid);
  if (!i.connected || !cur) {
    toast({ ico: 'wifi', title: 'Can’t see the access point', body: i.permission !== 'granted' ? 'Allow location first, so Android shares which access point you’re on.' : 'Connect to the campus ' + WIFI + ' first.', st: 'fair', ms: 4000 });
    return;
  }
  const saved = store.get('apMap', {});
  const mine = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  const now = Date.now();
  let n = 0;
  const put = (b, rssi) => {
    const old = mine[b];
    if (old && old.spot !== spot && typeof old.rssi === 'number' && old.rssi > rssi + 3) return; // keep the stronger reading
    mine[b] = { spot, rssi, at: now }; n++;
  };
  put(cur, typeof i.rssi === 'number' ? Math.round(i.rssi) : -70);
  // strong access points of the same network around you belong to this spot too
  if (i.ssid && Date.now() - sig.scanAt < 120e3) sig.scan.forEach((r) => { const b = normB(r.bssid); if (b && b !== cur && r.ssid === i.ssid && r.rssi >= -67) put(b, r.rssi); });
  store.set('apMap', mine);
  myAps = loadMyAps();
  sig.here = spot; sig.hereFrom = 'connected'; sig.cand = null; sig.candN = 0;
  $('#repSpot').value = spot; store.set('lastSpot', spot);
  updateHere(); renderNearby();
  toast({ ico: 'check', st: 'excellent', title: 'Saved ' + n + ' access point' + (n === 1 ? '' : 's'), body: 'WiFind now knows they’re at ' + SPOT[spot].name + '. Use “Share list” to send them to your team.', ms: 4200 });
}
function shareAps() {
  const all = Object.assign({}, AP_BUILTIN);
  for (const b of Object.keys(myAps)) all[b] = myAps[b].spot;
  const keys = Object.keys(all).sort((a, b) => (all[a] + a).localeCompare(all[b] + b));
  const text = 'WiFind access points (' + keys.length + ')\nPaste these lines inside AP_MAP near the top of js/app.js:\n\n' +
    keys.map((b) => "  '" + b + "': '" + all[b] + "', // " + SPOT[all[b]].name).join('\n') + '\n';
  if (NATIVE && typeof NATIVE.share === 'function') { try { NATIVE.share(text); return; } catch (e) { /* fall through */ } }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast({ ico: 'check', st: 'excellent', title: 'Copied the list', ms: 2500 }), () => {});
}
function clearAps() {
  toast({ ico: 'trash', st: 'weak', title: 'Clear saved access points?', body: 'This removes the ' + Object.keys(myAps).length + ' access points saved on this phone. Share the list first if your team needs it.', ms: 6000,
    action: { label: 'Clear them', fn: () => { store.set('apMap', {}); myAps = {}; sig.here = null; updateHere(); renderNearby(); } } });
}

function readScan() {
  const d = nativeJSON('getScanResults');
  if (!d || !Array.isArray(d.results)) return;
  sig.scan = d.results.filter((r) => r && typeof r.rssi === 'number' && normB(r.bssid)).sort((a, b) => b.rssi - a.rssi);
  sig.scanAt = Date.now();
  locate();
  renderNearby(); updateHere();
}
function doScan(byUser) {
  if (!NATIVE) return;
  const ok = nativeJSON('startScan');
  if (byUser && ok === false && Date.now() - sig.toldScanLimit > 60e3) {
    sig.toldScanLimit = Date.now();
    toast({ ico: 'clock', title: 'Android limits ' + WIFI + ' scans', body: 'Phones allow about 4 scans every 2 minutes, so these are the latest results.', st: 'fair', ms: 4000 });
  }
  readScan();
  setTimeout(readScan, 4000); // in case the phone doesn’t announce new results
}
function pollSignal() {
  sig.info = nativeJSON('getWifiInfo') || { ok: false };
  const ps = phoneSignal();
  if (ps) { sig.hist.push(ps.rssi); if (sig.hist.length > 45) sig.hist.shift(); }
  else sig.hist = [];
  const mode = sigMode(sig.info);
  if (mode !== sig.mode) { sig.mode = mode; renderSignalCard(); }
  else { updateLive(); renderNearby(); }
  locate();
  const note = $('#sgAttach');
  if (note) {
    note.hidden = !ps;
    if (ps) note.innerHTML = icon('signal') + '<span>Your phone’s signal (' + String(ps.rssi).replace('-', '−') + ' dBm' + (ps.band ? ', ' + esc(ps.band) : '') + ') is added to the report automatically.</span>';
  }
}
function startSignal() {
  if (sig.poll || !NATIVE) return;
  pollSignal();
  doScan(false);
  sig.poll = setInterval(pollSignal, 2000);
  sig.scanTimer = setInterval(() => doScan(false), 40000);
}
function stopSignal() { clearInterval(sig.poll); clearInterval(sig.scanTimer); sig.poll = sig.scanTimer = 0; }
function onSigClick(e) {
  const btn = e.target.closest('[data-sg]');
  if (!btn) return;
  const a = btn.dataset.sg;
  if (a === 'perm') NATIVE.requestPermission();
  else if (a === 'app' || a === 'location' || a === 'wifi') NATIVE.openSettings(a);
  else if (a === 'scan') doScan(true);
  else if (a === 'save') saveHere();
  else if (a === 'share') shareAps();
  else if (a === 'clear') clearAps();
  else if (a === 'show' && sig.here) { showView('map'); selectSpot(sig.here, { focus: true }); }
}
function initSignal() {
  if (!NATIVE) return;
  document.documentElement.classList.add('in-app');
  const card = $('#signalCard');
  card.hidden = false;
  card.addEventListener('click', onSigClick);
  window.__wifindNative = (type) => {
    if (type === 'scan') readScan();
    else if (type === 'permission') { pollSignal(); doScan(false); }
    else if (type === 'resume') { pollSignal(); readScan(); }
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? stopSignal() : startSignal()));
  startSignal();
  if (!store.get('sawSignalTip', false)) {
    store.set('sawSignalTip', true);
    setTimeout(() => toast({ ico: 'signal', st: 'good', title: 'See your real ' + WIFI + ' signal', body: 'The Test tab shows your phone’s signal strength and which access point you’re on.', ms: 6500,
      action: { label: 'Show me', fn: () => showView('test') } }), 9000);
  }
}

/* =========================================================
   Init
   ========================================================= */
function renderFloorPick() {
  const opts = ['all'].concat(Array.from({ length: MAXF }, (_, i) => String(i + 1)));
  const html = '<span class="fp-title">Floor</span>' + opts.map((f) => '<button type="button" data-floor="' + f + '" aria-pressed="' + (String(state.floor) === f) + '" title="' + (f === 'all' ? 'All floors: each building shows its best floor' : FL(+f)) + '">' + (f === 'all' ? 'All' : f === '1' ? 'G' : f) + '</button>').join('');
  ['#floorPick', '#floorPickM'].forEach((s) => {
    const el = $(s);
    el.innerHTML = html;
    $$('button', el).forEach((b) => b.addEventListener('click', () => setFloor(b.dataset.floor)));
  });
}
function init() {
  refreshClock();
  state.hour = state.campusOpen ? nowSlot() : 8;
  computeSnapshot();
  buildMap();
  renderFloorPick();
  updateMapStatus();
  updateYou();
  $('#originSel').innerHTML = originOptions(state.origin);
  $('#originSel').addEventListener('change', (e) => setOrigin(e.target.value));
  setupMapInput();
  setupSheet();
  setSheet('peek');
  renderPanel();
  updateTimeUI();
  updateSpec();
  // layer toggles
  $$('[data-layer]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.layer;
    state.layers[k] = !state.layers[k];
    b.setAttribute('aria-pressed', String(state.layers[k]));
    updateMapStatus(); updateMarkerScale();
  }));
  $('#layerBtn').addEventListener('click', () => {
    const open = !$('#layerChips').classList.contains('open');
    $('#layerChips').classList.toggle('open', open);
    $('#layerBtn').setAttribute('aria-expanded', String(open));
  });
  // time controls
  $('#hourRange').addEventListener('input', (e) => { if (state.playing) stopPlay(); setHour(+e.target.value, { light: true }); });
  $('#hourRange').addEventListener('change', () => { renderFind(); rebuildFeed(); });
  $('#findRange').addEventListener('input', (e) => setHour(+e.target.value, { light: true }));
  $('#findRange').addEventListener('change', () => { renderFind(true); rebuildFeed(); });
  $('#findNow').addEventListener('click', goNow);
  $('#playBtn').addEventListener('click', togglePlay);
  $('#timeChip').addEventListener('click', () => {
    if (state.campusOpen && !state.viewingNow) { goNow(); return; }
    showView('map');
    $('#hourRange').focus();
  });
  // top bar
  $('#bellBtn').addEventListener('click', () => showView('alerts'));
  $('#sampleChip').addEventListener('click', (e) => {
    e.stopPropagation();
    const pop = $('#samplePop');
    pop.hidden = !pop.hidden;
    $('#sampleChip').setAttribute('aria-expanded', String(!pop.hidden));
  });
  document.addEventListener('click', (e) => {
    const pop = $('#samplePop');
    if (!pop.hidden && !pop.contains(e.target) && !$('#sampleChip').contains(e.target)) { pop.hidden = true; $('#sampleChip').setAttribute('aria-expanded', 'false'); }
  });
  $('#brandLink').addEventListener('click', (e) => { e.preventDefault(); showView('map'); selectSpot(null); });
  $$('.tab').forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));
  // find
  renderActs();
  renderFindOrigins();
  $('#findOrigin').addEventListener('change', (e) => setOrigin(e.target.value));
  $('#nearbyToggle').addEventListener('change', (e) => { state.find.nearby = e.target.checked; renderFind(true); });
  $('#noStairs').addEventListener('change', (e) => { state.find.noStairs = e.target.checked; renderFind(true); });
  renderFind();
  // test
  buildGauge();
  renderTestResults();
  renderReportForm();
  $('#startTest').addEventListener('click', runTest);
  $('#sendReport').addEventListener('click', sendReport);
  renderRepFeed();
  renderMyTests();
  initSignal();
  // alerts
  $('#markRead').innerHTML = icon('check') + 'Mark all read';
  $('#markRead').addEventListener('click', markAllRead);
  renderPrefs();
  rebuildFeed();
  // learn
  renderLearnStatic();
  lab.setup();
  const reColor = () => { lab.readColors(); };
  if (window.matchMedia) { const mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', reColor); }
  if (window.MutationObserver) new MutationObserver(reColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // layout changes
  let wasWide = isWide();
  const onResize = () => {
    const w = isWide();
    if (w !== wasWide) { wasWide = w; setSheet(sheetState); fitCampus(0); }
    else { if (!w) setSheet(sheetState); if (!userMoved) fitCampus(0); }
    updateMarkerScale();
  };
  if (window.ResizeObserver) new ResizeObserver(onResize).observe($('#mapCard'));
  else window.addEventListener('resize', onResize);
  // first view (#find, #test, a spot like #b5-2, or a building like #b5)
  const h = (location.hash || '').slice(1);
  if (VIEWS.indexOf(h) >= 0) showView(h);
  else showView('map');
  requestAnimationFrame(() => {
    fitCampus(0);
    if (SPOT[h]) selectSpot(h, { focus: true });
    else if (PLACE[h]) openPlace(h);
    radarIntro();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { sizeLabels(); });
  window.addEventListener('hashchange', () => {
    const v = (location.hash || '').slice(1);
    if (VIEWS.indexOf(v) >= 0 && v !== state.view) showView(v);
    else if (SPOT[v]) { showView('map'); selectSpot(v, { focus: true }); }
    else if (PLACE[v]) { showView('map'); openPlace(v); }
  });
  // the welcome notification
  setTimeout(() => {
    if (!state.prefs.near) return;
    const b = bestNear(ORIGIN[state.origin].node), st = S(b.id);
    toast({ ico: 'wifi', st: st.status.key, title: 'Strong ' + WIFI + ' near you: ' + b.name, body: st.status.label + ' at ' + fmtHour(state.hour) + ' · ' + fmtMs(st.m.ping) + ' ms ping · ' + walkMin(b) + ' min' + (b.climb ? ', ' + climbTxt(b) : ' walk'), action: { label: 'Show me', fn: () => { showView('map'); selectSpot(b.id, { focus: true }); } }, ms: 6500 });
  }, RM ? 600 : 2700);
  // keep "now" fresh
  setInterval(() => {
    const wasNow = state.viewingNow;
    refreshClock();
    if (wasNow && state.campusOpen && Math.abs(nowSlot() - state.hour) >= 0.25 && !state.playing) setHour(nowSlot());
    else updateTimeUI();
  }, 30000);
  initDb();
}
init();
})();
