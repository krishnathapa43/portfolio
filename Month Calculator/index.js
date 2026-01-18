// Elements
const startDateEl = document.getElementById("startDate");
const endDateEl = document.getElementById("endDate");
const customIntervalEl = document.getElementById("customInterval");
const totalMonthsEl = document.getElementById("totalMonths");
const ymBreakdownEl = document.getElementById("ymBreakdown");
const resultBody = document.getElementById("resultBody");
const msg = document.getElementById("msg");
const yearEl = document.getElementById("year");

const calcBtn = document.getElementById("calcBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const csvBtn = document.getElementById("csvBtn");
const printBtn = document.getElementById("printBtn");

const themeToggle = document.getElementById("themeToggle");

const timeline = document.getElementById("timeline");
const tlStart = document.getElementById("tlStart");
const tlEnd = document.getElementById("tlEnd");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const HISTORY_KEY = "monthCalcHistory_v1";
const THEME_KEY = "monthCalcTheme_v1";

// Init
yearEl.textContent = new Date().getFullYear();
loadTheme();
renderHistory();

// Live calculation (debounced)
let liveTimer = null;
[startDateEl, endDateEl, customIntervalEl].forEach(el => {
  el.addEventListener("input", () => {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => calculate(false), 250);
  });
});

calcBtn.addEventListener("click", () => calculate(true));
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", copyTable);
csvBtn.addEventListener("click", exportCSV);
printBtn.addEventListener("click", () => window.print());

themeToggle.addEventListener("click", toggleTheme);

// Presets
document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    const total = Number(btn.dataset.preset);
    customIntervalEl.value = presetIntervals(total).join(",");
    calculate(true);
  });
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  setMessage("History cleared.", "good");
});

/* ---------------- Main ---------------- */

function calculate(saveToHistory) {
  clearMessage();
  resultBody.innerHTML = "";
  clearTimelineMarkers();

  const start = parseDate(startDateEl.value);
  const end = parseDate(endDateEl.value);

  // Missing inputs
  if (!start || !end) {
    totalMonthsEl.textContent = "0";
    ymBreakdownEl.textContent = "0 years 0 months";
    buildTimeline(start, end, []);
    if (start || end) setMessage("ℹ Select both Start Date and End Date.", "warn");
    return;
  }

  // Validation: end before start
  if (end < start) {
    totalMonthsEl.textContent = "0";
    ymBreakdownEl.textContent = "0 years 0 months";
    buildTimeline(start, end, []);
    setMessage("❌ End Date is earlier than Start Date. Please correct it.", "bad");
    return;
  }

  // Month diff + breakdown
  const diff = monthDiff(start, end);
  totalMonthsEl.textContent = diff.toString();
  ymBreakdownEl.textContent = yearsMonths(diff);

  // Parse intervals
  const intervals = parseIntervals(customIntervalEl.value);

  // Table rows
  if (intervals.length === 0) {
    buildTimeline(start, end, []);
    setMessage("✅ Dates calculated. Add custom intervals (optional) like: 3,6,9,12", "good");
    if (saveToHistory) saveHistory(start, end, diff, []);
    return;
  }

  const rows = intervals.map(m => {
    const reached = addMonthsSafe(start, m);
    const over = m > diff;
    return {
      interval: m,
      date: formatDate(reached),
      status: over ? "Exceeds end date" : "Within range",
      over
    };
  });

  // Render table
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.className = r.over ? "row-warn" : "row-ok";
    tr.innerHTML = `
      <td>${r.interval}</td>
      <td>${r.date}</td>
      <td><span class="status-pill">${r.over ? "⚠ Exceeds" : "✅ OK"}</span></td>
    `;
    resultBody.appendChild(tr);
  });

  // Timeline
  buildTimeline(start, end, rows);

  // Message
  const overCount = rows.filter(r => r.over).length;
  if (overCount > 0) {
    setMessage(`⚠ Done. ${overCount} interval(s) exceed the end date range.`, "warn");
  } else {
    setMessage("✅ Done. All intervals are within the selected date range.", "good");
  }

  // History save
  if (saveToHistory) saveHistory(start, end, diff, intervals);
}

/* ---------------- Timeline ---------------- */

function buildTimeline(start, end, rows) {
  const startLabel = start ? formatDate(start) : "Start";
  const endLabel = end ? formatDate(end) : "End";
  tlStart.textContent = startLabel;
  tlEnd.textContent = endLabel;

  if (!start || !end) return;

  const total = monthDiff(start, end);
  if (total <= 0) return;

  // Markers based on intervals (cap at total)
  rows.forEach(r => {
    const percent = Math.max(0, Math.min(100, (r.interval / total) * 100));
    const marker = document.createElement("div");
    marker.className = "marker";
    marker.style.left = `calc(${percent}% )`;

    const dot = document.createElement("div");
    dot.className = "marker-dot";
    if (r.over) dot.style.background = "var(--warn)";

    const text = document.createElement("div");
    text.className = "marker-text";
    text.textContent = `${r.interval}m`;

    marker.appendChild(dot);
    marker.appendChild(text);
    timeline.appendChild(marker);
  });
}

function clearTimelineMarkers(){
  timeline.querySelectorAll(".marker").forEach(m => m.remove());
}

/* ---------------- History ---------------- */

function saveHistory(start, end, diff, intervals){
  const item = {
    id: cryptoRandomId(),
    ts: Date.now(),
    start: formatDate(start),
    end: formatDate(end),
    diff,
    intervals
  };

  const list = getHistory();
  list.unshift(item);
  const trimmed = list.slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  renderHistory();
}

function getHistory(){
  try{
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderHistory(){
  const list = getHistory();
  historyList.innerHTML = "";

  if(list.length === 0){
    historyList.innerHTML = `<div class="muted" style="padding:4px 0;">No history yet. Click <b>Calculate</b> to save.</div>`;
    return;
  }

  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "hItem";
    const when = new Date(item.ts).toLocaleString();

    div.innerHTML = `
      <b>${item.start} → ${item.end}</b>
      <div class="hMeta">
        Total: <b>${item.diff}</b> months (${yearsMonths(item.diff)})<br>
        Intervals: <b>${(item.intervals && item.intervals.length) ? item.intervals.join(", ") : "—"}</b><br>
        Saved: ${when}
      </div>
      <div class="hBtns">
        <button class="smallBtn" data-act="load" data-id="${item.id}">Load</button>
        <button class="smallBtn" data-act="del" data-id="${item.id}">Delete</button>
      </div>
    `;

    historyList.appendChild(div);
  });

  historyList.querySelectorAll(".smallBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      if(act === "load") loadHistoryItem(id);
      if(act === "del") deleteHistoryItem(id);
    });
  });
}

function loadHistoryItem(id){
  const list = getHistory();
  const item = list.find(x => x.id === id);
  if(!item) return;

  startDateEl.value = item.start;
  endDateEl.value = item.end;
  customIntervalEl.value = (item.intervals && item.intervals.length) ? item.intervals.join(",") : "";
  calculate(false);
  setMessage("✅ Loaded from history.", "good");
}

function deleteHistoryItem(id){
  const list = getHistory().filter(x => x.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  renderHistory();
  setMessage("Deleted one history item.", "good");
}

/* ---------------- Export ---------------- */

function copyTable(){
  const start = startDateEl.value;
  const end = endDateEl.value;
  const total = totalMonthsEl.textContent;

  if(!start || !end){
    setMessage("⚠ Select dates first to copy results.", "warn");
    return;
  }

  // Build text
  let text = `Start: ${start}\nEnd: ${end}\nTotal Months: ${total}\nYears+Months: ${ymBreakdownEl.textContent}\n\n`;
  text += `Interval (Months)\tDate Reached\tStatus\n`;

  const rows = Array.from(resultBody.querySelectorAll("tr"));
  if(rows.length === 0){
    text += `—\t—\tNo intervals\n`;
  } else {
    rows.forEach(tr => {
      const cols = tr.querySelectorAll("td");
      text += `${cols[0].innerText}\t${cols[1].innerText}\t${cols[2].innerText}\n`;
    });
  }

  navigator.clipboard.writeText(text)
    .then(()=> setMessage("✅ Copied to clipboard.", "good"))
    .catch(()=> setMessage("❌ Copy failed (browser blocked). Try HTTPS or localhost.", "bad"));
}

function exportCSV(){
  const start = startDateEl.value;
  const end = endDateEl.value;
  const total = totalMonthsEl.textContent;

  if(!start || !end){
    setMessage("⚠ Select dates first to export CSV.", "warn");
    return;
  }

  let csv = "Start,End,TotalMonths,YearsMonths\n";
  csv += `${start},${end},${total},"${ymBreakdownEl.textContent}"\n\n`;
  csv += "IntervalMonths,DateReached,Status\n";

  const rows = Array.from(resultBody.querySelectorAll("tr"));
  if(rows.length === 0){
    csv += `,,No intervals\n`;
  } else {
    rows.forEach(tr => {
      const cols = tr.querySelectorAll("td");
      const a = cols[0].innerText.replaceAll(",", " ");
      const b = cols[1].innerText.replaceAll(",", " ");
      const c = cols[2].innerText.replaceAll(",", " ");
      csv += `${a},${b},"${c}"\n`;
    });
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "month-interval-results.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  setMessage("✅ CSV exported. Open it in Excel.", "good");
}

/* ---------------- Theme ---------------- */

function loadTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved === "light"){
    document.body.classList.add("light", "force-light");
  }
}
function toggleTheme(){
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  setMessage(isLight ? "Light theme enabled." : "Dark theme enabled.", "good");
}

/* ---------------- Clear ---------------- */

function clearAll(){
  startDateEl.value = "";
  endDateEl.value = "";
  customIntervalEl.value = "";
  totalMonthsEl.textContent = "0";
  ymBreakdownEl.textContent = "0 years 0 months";
  resultBody.innerHTML = "";
  clearTimelineMarkers();
  setMessage("Cleared.", "good");
}

/* ---------------- Messages ---------------- */

function clearMessage(){
  msg.className = "msg";
  msg.textContent = "";
}
function setMessage(text, type){
  msg.className = "msg " + (type || "");
  msg.textContent = text;
}

/* ---------------- Helpers ---------------- */

function parseDate(v){
  if(!v) return null;
  const d = new Date(v + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthDiff(a, b){
  let months = (b.getFullYear() - a.getFullYear()) * 12;
  months += (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  return Math.max(0, months);
}

function yearsMonths(months){
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y} years ${m} months`;
}

function parseIntervals(text){
  if(!text.trim()) return [];
  const nums = text
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(n => Number(n))
    .filter(n => Number.isFinite(n) && n > 0);

  // unique + sorted
  return Array.from(new Set(nums)).sort((a,b) => a-b);
}

// Preset intervals (good looking)
function presetIntervals(totalMonths){
  // common schedule: every 3 months + key milestones
  const base = [];
  for(let m = 3; m <= totalMonths; m += 3) base.push(m);
  // add final if not included
  if(!base.includes(totalMonths)) base.push(totalMonths);
  // keep it not too long for large values
  return base.slice(0, 16);
}

function addMonthsSafe(date, monthsToAdd){
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsToAdd);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function formatDate(d){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function cryptoRandomId(){
  // fallback-safe
  if(window.crypto && crypto.getRandomValues){
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return a[0].toString(16) + a[1].toString(16);
  }
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
