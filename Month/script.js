const THEME_KEY = "monthCalcTheme_v3";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const startDateEl = document.getElementById("startDate");
const endDateEl = document.getElementById("endDate");
const intervalsEl = document.getElementById("intervals");

const totalMonthsEl = document.getElementById("totalMonths");
const ymEl = document.getElementById("ym");
const msgEl = document.getElementById("msg");
const tableBody = document.getElementById("tableBody");

const themeToggle = document.getElementById("themeToggle");

const timelineEl = document.getElementById("timeline");
const tlStartEl = document.getElementById("tlStart");
const tlEndEl = document.getElementById("tlEnd");

document.getElementById("year").textContent = new Date().getFullYear();

/* Theme init */
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved === "light") document.body.classList.add("light");
})();
themeToggle.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
});

/* Calendar icon works */
document.querySelectorAll(".calBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.for);
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else { input.focus(); input.click(); }
  });
});

/* Helpers */
function parseDate(v){
  if(!v) return null;
  const d = new Date(v + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}
function monthDiff(a,b){
  let m = (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return Math.max(0,m);
}
function yearsMonths(months){
  const y = Math.floor(months/12);
  const m = months % 12;
  return `${y} years ${m} months`;
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
function dateNumber(d){
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function dateWord(d){
  const dd = String(d.getDate()).padStart(2,"0");
  const monthWord = MONTHS[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}/${monthWord}/${yyyy}`;
}
function dateBothInline(d){
  return `
    <span class="dateInline">
      <span>${dateNumber(d)}</span>
      <span class="sep">|</span>
      <span>${dateWord(d)}</span>
    </span>
  `;
}
function parseIntervals(text){
  if(!text.trim()) return [];
  const nums = text.split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(n => Number(n))
    .filter(n => Number.isFinite(n) && n > 0);
  return Array.from(new Set(nums)).sort((a,b)=>a-b);
}
function setMsg(text, type){
  msgEl.textContent = text || "";
  msgEl.className = "msg " + (type || "");
}

/* Timeline helpers */
function clearTimelineMarkers(){
  timelineEl.querySelectorAll(".marker").forEach(m => m.remove());
}
function setTimelineLabels(start, end){
  tlStartEl.textContent = start ? `${dateNumber(start)}` : "Start";
  tlEndEl.textContent = end ? `${dateNumber(end)}` : "End";
}
function renderTimeline(start, end, intervals){
  clearTimelineMarkers();
  setTimelineLabels(start, end);

  if(!start || !end) return;

  const total = monthDiff(start, end);
  if(total <= 0) return;

  intervals.forEach(m => {
    const percent = Math.max(0, Math.min(100, (m / total) * 100));
    const marker = document.createElement("div");
    marker.className = "marker";
    marker.style.left = `calc(${percent}% )`;

    const dot = document.createElement("div");
    dot.className = "markerDot" + (m > total ? " warn" : "");

    const text = document.createElement("div");
    text.className = "markerText";
    text.textContent = `${m}m`;

    marker.appendChild(dot);
    marker.appendChild(text);
    timelineEl.appendChild(marker);
  });
}

/* Auto totals when dates change (NO auto custom calc) */
function updateTotalsOnly(){
  setMsg("", "");
  const start = parseDate(startDateEl.value);
  const end = parseDate(endDateEl.value);

  // Update labels even if only one is set
  setTimelineLabels(start, end);

  if(!start || !end){
    totalMonthsEl.textContent = "0";
    ymEl.textContent = "0 years 0 months";
    clearTimelineMarkers(); // keep clean until calculate
    return;
  }

  if(end < start){
    totalMonthsEl.textContent = "0";
    ymEl.textContent = "0 years 0 months";
    clearTimelineMarkers();
    setMsg("End Date is earlier than Start Date.", "bad");
    return;
  }

  const diff = monthDiff(start, end);
  totalMonthsEl.textContent = String(diff);
  ymEl.textContent = yearsMonths(diff);

  // Keep markers only from the last Calculate click (do not change here)
  // But if date range changed, markers should reset to avoid wrong preview
  clearTimelineMarkers();
}

/* Calculate custom intervals on button click */
function calculateCustomIntervals(){
  tableBody.innerHTML = "";
  setMsg("", "");

  const start = parseDate(startDateEl.value);
  const end = parseDate(endDateEl.value);

  if(!start || !end){
    setMsg("Select both Start Date and End Date first.", "warn");
    setTimelineLabels(start, end);
    clearTimelineMarkers();
    return;
  }
  if(end < start){
    setMsg("End Date is earlier than Start Date.", "bad");
    setTimelineLabels(start, end);
    clearTimelineMarkers();
    return;
  }

  const diff = monthDiff(start, end);
  totalMonthsEl.textContent = String(diff);
  ymEl.textContent = yearsMonths(diff);

  const intervals = parseIntervals(intervalsEl.value);
  if(intervals.length === 0){
    setMsg("Add custom intervals like: 3,6,9,12 then click Calculate.", "warn");
    renderTimeline(start, end, []); // show bar + labels only
    return;
  }

  intervals.forEach(m => {
    const reached = addMonthsSafe(start, m);
    const over = m > diff;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Interval (Months)">${m}</td>
      <td data-label="Date Reached">${dateBothInline(reached)}</td>
      <td data-label="Status" class="${over ? "status-warn" : "status-ok"}">${over ? "Exceeds" : "OK"}</td>
    `;
    tableBody.appendChild(tr);
  });

  // 🔥 Timeline markers (killer feature)
  renderTimeline(start, end, intervals);

  const overCount = intervals.filter(m => m > diff).length;
  if(overCount) setMsg(`⚠ Done. ${overCount} interval(s) exceed End Date range.`, "warn");
  else setMsg("✅ Done. All intervals are within the selected date range.", "good");

  // Optional: scroll to results on mobile for better UX
  if (window.matchMedia("(max-width: 720px)").matches) {
    document.getElementById("timeline").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* Clear */
function clearAll(){
  startDateEl.value = "";
  endDateEl.value = "";
  intervalsEl.value = "";
  totalMonthsEl.textContent = "0";
  ymEl.textContent = "0 years 0 months";
  tableBody.innerHTML = "";
  setMsg("Cleared.", "good");
  setTimelineLabels(null, null);
  clearTimelineMarkers();
}

/* Events */
startDateEl.addEventListener("input", updateTotalsOnly);
endDateEl.addEventListener("input", updateTotalsOnly);

document.getElementById("calcBtn").addEventListener("click", calculateCustomIntervals);
document.getElementById("clearBtn").addEventListener("click", clearAll);

// Initial labels
setTimelineLabels(null, null);
