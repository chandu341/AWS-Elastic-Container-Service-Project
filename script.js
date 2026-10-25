"use strict";

const toast = document.querySelector("#toast");
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}

const rangeLabels = {
  "1h": { period: "Last hour", labels: ["14:00", "14:10", "14:20", "14:30", "14:40", "14:50", "15:00"], cpu: [32, 37, 34, 42, 39, 31, 34], memory: [55, 57, 53, 60, 58, 56, 59] },
  "6h": { period: "Last 6 hours", labels: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"], cpu: [35, 40, 37, 44, 41, 50, 45], memory: [53, 57, 54, 60, 56, 65, 60] },
  "24h": { period: "Last 24 hours", labels: ["15:00", "19:00", "23:00", "03:00", "07:00", "11:00", "15:00"], cpu: [28, 37, 31, 49, 42, 56, 45], memory: [48, 52, 50, 58, 54, 67, 60] },
  "7d": { period: "Last 7 days", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], cpu: [31, 39, 35, 47, 42, 38, 45], memory: [48, 54, 51, 62, 57, 55, 60] }
};

function makeLinePath(values) {
  const points = values.map((value, index) => ({
    x: (720 / (values.length - 1)) * index,
    y: 190 - (value / 100) * 175
  }));

  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x} ${point.y}`;
    const previous = points[index - 1];
    const middleX = (previous.x + point.x) / 2;
    return `${path} C${middleX} ${previous.y} ${middleX} ${point.y} ${point.x} ${point.y}`;
  }, "");
}

function updateChart(range) {
  const data = rangeLabels[range];
  const cpuPath = makeLinePath(data.cpu);
  const memoryPath = makeLinePath(data.memory);
  document.querySelector("#cpu-line").setAttribute("d", cpuPath);
  document.querySelector("#memory-line").setAttribute("d", memoryPath);
  document.querySelector("#cpu-fill-path").setAttribute("d", `${cpuPath} V210 H0Z`);
  document.querySelector("#memory-fill-path").setAttribute("d", `${memoryPath} V210 H0Z`);

  const finalCpu = data.cpu[data.cpu.length - 1];
  document.querySelector("#chart-point").setAttribute("cy", String(190 - (finalCpu / 100) * 175));
  document.querySelector("#chart-period").textContent = data.period;

  const labels = document.querySelector("#chart-x-labels");
  labels.replaceChildren(...data.labels.map((label) => {
    const item = document.createElement("span");
    item.textContent = label;
    return item;
  }));

  document.querySelectorAll(".range-button").forEach((button) => {
    const selected = button.dataset.range === range;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

document.querySelectorAll(".range-button").forEach((button) => {
  button.setAttribute("aria-pressed", String(button.classList.contains("active")));
  button.addEventListener("click", () => updateChart(button.dataset.range));
});
updateChart("6h");

const now = new Date();
document.querySelector("#dashboard-date").textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric"
}).format(now).toUpperCase();
const hour = now.getHours();
document.querySelector("#greeting").textContent = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

const serviceRows = [...document.querySelectorAll("#service-rows tr")];
const serviceSearch = document.querySelector("#service-search");
const filterButton = document.querySelector("#filter-button");
const filterCount = document.querySelector("#filter-count");
const serviceResultCount = document.querySelector("#service-result-count");
let healthyOnly = false;

function filterServices() {
  const query = serviceSearch.value.trim().toLowerCase();
  let visibleCount = 0;

  serviceRows.forEach((row) => {
    const matchesQuery = row.textContent.toLowerCase().includes(query);
    const matchesStatus = !healthyOnly || row.dataset.status === "healthy";
    const visible = matchesQuery && matchesStatus;
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  serviceResultCount.textContent = String(visibleCount);
  let emptyRow = document.querySelector("#empty-service-row");
  if (visibleCount === 0 && !emptyRow) {
    emptyRow = document.createElement("tr");
    emptyRow.id = "empty-service-row";
    emptyRow.innerHTML = '<td class="empty-state" colspan="6">No services match your search.</td>';
    document.querySelector("#service-rows").append(emptyRow);
  } else if (visibleCount > 0 && emptyRow) {
    emptyRow.remove();
  }

  filterButton.setAttribute("aria-pressed", String(healthyOnly));
  filterCount.hidden = !healthyOnly;
}

serviceSearch.addEventListener("input", filterServices);
filterButton.addEventListener("click", () => {
  healthyOnly = !healthyOnly;
  filterServices();
});

const refreshButton = document.querySelector("#refresh-button");
const refreshLabel = document.querySelector("#refresh-label");
refreshButton.addEventListener("click", () => {
  const now = new Date();
  document.querySelector("#updated-time").textContent = `at ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  refreshLabel.textContent = "Updated";
  refreshButton.disabled = true;
  showToast("Dashboard sample data refreshed.");
  window.setTimeout(() => {
    refreshLabel.textContent = "Refresh";
    refreshButton.disabled = false;
  }, 1400);
});

const deployDialog = document.querySelector("#deploy-dialog");
document.querySelector("#deploy-button").addEventListener("click", () => deployDialog.showModal());

const sidebar = document.querySelector("#sidebar");
const menuToggle = document.querySelector("#menu-toggle");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");

function setSidebarOpen(isOpen) {
  sidebar.classList.toggle("open", isOpen);
  sidebarBackdrop.classList.toggle("visible", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
}

menuToggle.addEventListener("click", () => setSidebarOpen(!sidebar.classList.contains("open")));
sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setSidebarOpen(false)));

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

document.querySelectorAll(".row-menu, .more-button").forEach((button) => {
  button.addEventListener("click", () => showToast("Service actions are available when connected to your ECS account."));
});
