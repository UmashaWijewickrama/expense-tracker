// ---------- Elements ----------

const form = document.getElementById("expense-form");
const formTitle = document.getElementById("form-title");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const list = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total");
const countDisplay = document.getElementById("count");
const topCategoryDisplay = document.getElementById("top-category");
const summaryList = document.getElementById("summary-list");
const errorMessage = document.getElementById("error-message");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const trendInsight = document.getElementById("trend-insight");

// ---------- State ----------

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editingIndex = null;   // null = adding, a number = editing that expense
let currentFilter = "all"; // list filter: all, day, week, month
let currentTrend = "day";  // trend chart: day, week, month
let categoryChart = null;
let trendChart = null;

const CATEGORY_COLORS = {
  Food: "#f59e0b",
  Transport: "#3b82f6",
  Bills: "#ef4444",
  Fun: "#a855f7",
  Other: "#6b7280"
};

function colorFor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
}

// ---------- Storage and messages ----------

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function showError(message) {
  errorMessage.textContent = message;
}

// ---------- Date helpers ----------

function pad(n) {
  return String(n).padStart(2, "0");
}

// Date object -> "YYYY-MM-DD" (the format the date input uses)
function toISO(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

// Text -> Date at local midnight, or null if it can't be read
function parseDate(str) {
  if (!str) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const d = new Date(str); // older expenses saved in the old format
  if (isNaN(d)) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Stops the date box from accepting days after today
function updateDateLimit() {
  dateInput.max = toISO(new Date());
}

function matchesFilter(expense, filter) {
  if (filter === "all") return true;

  const day = parseDate(expense.date);
  if (!day) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "day") {
    return day.getTime() === today.getTime();
  }

  if (filter === "week") {
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceMonday);
    const nextWeekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7);
    return day >= weekStart && day < nextWeekStart;
  }

  if (filter === "month") {
    return day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth();
  }

  return true;
}

// ---------- Trend chart data ----------

// Builds the list of time buckets (days, weeks or months) and adds up
// the spending that falls inside each one.
function getTrendData(mode) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = [];

  if (mode === "day") {
    // last 7 days, ending today
    for (let i = 6; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
      buckets.push({
        start: start,
        end: end,
        label: start.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        total: 0
      });
    }
  } else if (mode === "week") {
    // last 8 weeks, each starting on Monday, ending with this week
    const daysSinceMonday = (today.getDay() + 6) % 7;
    for (let i = 7; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceMonday - i * 7);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      buckets.push({
        start: start,
        end: end,
        label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        total: 0
      });
    }
  } else {
    // last 6 months, ending with this month
    for (let i = 5; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({
        start: start,
        end: end,
        label: start.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        total: 0
      });
    }
  }

  expenses.forEach(function (expense) {
    const d = parseDate(expense.date);
    if (!d) return;
    buckets.forEach(function (bucket) {
      if (d >= bucket.start && d < bucket.end) {
        bucket.total += expense.amount;
      }
    });
  });

  return buckets;
}

// A short sentence comparing the current period with the previous one
function buildInsight(values) {
  const names = {
    day: ["Today", "yesterday"],
    week: ["This week", "last week"],
    month: ["This month", "last month"]
  }[currentTrend];

  const last = values[values.length - 1];
  const prev = values[values.length - 2];

  if (last === 0 && prev === 0) {
    return "No spending recorded for these periods yet.";
  }
  if (prev === 0) {
    return names[0] + ": Rs. " + last.toFixed(2) + ". Nothing was recorded " + names[1] + " to compare with.";
  }

  const change = ((last - prev) / prev) * 100;
  if (Math.abs(change) < 0.5) {
    return names[0] + ": Rs. " + last.toFixed(2) + ", about the same as " + names[1] + ".";
  }
  const direction = change > 0 ? "more" : "less";
  return names[0] + ": Rs. " + last.toFixed(2) + ", " + Math.abs(change).toFixed(0) + "% " + direction + " than " + names[1] + ".";
}

// ---------- Charts ----------

function updateTrendChart() {
  const buckets = getTrendData(currentTrend);
  const labels = buckets.map(function (b) { return b.label; });
  const values = buckets.map(function (b) { return b.total; });
  // highlight the current period (the last bar)
  const colors = values.map(function (v, i) {
    return i === values.length - 1 ? "#6366f1" : "#c7d2fe";
  });
  const titles = {
    day: "Last 7 days",
    week: "Last 8 weeks (weeks start on Monday)",
    month: "Last 6 months"
  };

  if (typeof Chart !== "undefined") {
    if (!trendChart) {
      trendChart = new Chart(document.getElementById("trend-chart"), {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{ data: values, backgroundColor: colors, borderRadius: 6 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: true, text: titles[currentTrend] },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return "Rs. " + context.parsed.y.toFixed(2);
                }
              }
            }
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    } else {
      trendChart.data.labels = labels;
      trendChart.data.datasets[0].data = values;
      trendChart.data.datasets[0].backgroundColor = colors;
      trendChart.options.plugins.title.text = titles[currentTrend];
      trendChart.update();
    }
  }

  trendInsight.textContent = buildInsight(values);
}

function updateCategoryChart(byCategory) {
  if (typeof Chart === "undefined") return;

  const labels = Object.keys(byCategory);
  const values = labels.map(function (c) { return byCategory[c]; });
  const colors = labels.map(colorFor);

  if (!categoryChart) {
    categoryChart = new Chart(document.getElementById("category-chart"), {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 2 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.label + ": Rs. " + context.parsed.toFixed(2);
              }
            }
          }
        }
      }
    });
  } else {
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = values;
    categoryChart.data.datasets[0].backgroundColor = colors;
    categoryChart.update();
  }
}

// ---------- Edit mode ----------

function startEdit(index) {
  const expense = expenses[index];
  descriptionInput.value = expense.description;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category || "Other";
  dateInput.value = toISO(parseDate(expense.date) || new Date());

  editingIndex = index;
  formTitle.textContent = "Edit expense";
  submitBtn.textContent = "Save";
  cancelBtn.hidden = false;
  descriptionInput.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function stopEdit() {
  editingIndex = null;
  formTitle.textContent = "Add expense";
  submitBtn.textContent = "Add";
  cancelBtn.hidden = true;
  form.reset();
  dateInput.value = toISO(new Date());
  updateDateLimit(); 
}

// ---------- Drawing the page ----------

function render() {
  list.innerHTML = "";
  summaryList.innerHTML = "";
  let total = 0;
  const byCategory = {};

  // keep each expense together with its position in the full array,
  // so Edit and Delete hit the right item while a filter is active
  const visible = [];
  expenses.forEach(function (expense, index) {
    if (matchesFilter(expense, currentFilter)) {
      visible.push({ expense: expense, index: index });
    }
  });

  if (visible.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty";
    emptyLi.textContent = "No expenses for this period.";
    list.appendChild(emptyLi);
  }

  visible.forEach(function (item) {
    const expense = item.expense;
    const index = item.index;
    const category = expense.category || "Other";

    const li = document.createElement("li");
    li.className = "expense-item";

    // left side: description, category badge, date
    const info = document.createElement("div");
    info.className = "expense-info";

    const nameEl = document.createElement("span");
    nameEl.className = "expense-name";
    nameEl.textContent = expense.description;

    const meta = document.createElement("span");
    meta.className = "expense-meta";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = category;
    badge.style.background = colorFor(category);

    const shownDate = parseDate(expense.date);
    const dateEl = document.createElement("span");
    dateEl.textContent = shownDate ? shownDate.toLocaleDateString() : (expense.date || "no date");

    meta.appendChild(badge);
    meta.appendChild(dateEl);
    info.appendChild(nameEl);
    info.appendChild(meta);

    // amount
    const amountEl = document.createElement("span");
    amountEl.className = "expense-amount";
    amountEl.textContent = "Rs. " + expense.amount.toFixed(2);

    // buttons
    const actions = document.createElement("div");
    actions.className = "expense-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "edit-btn";
    editBtn.addEventListener("click", function () {
      startEdit(index);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", function () {
      stopEdit();
      expenses.splice(index, 1);
      saveExpenses();
      render();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(info);
    li.appendChild(amountEl);
    li.appendChild(actions);
    list.appendChild(li);

    total += expense.amount;
    byCategory[category] = (byCategory[category] || 0) + expense.amount;
  });

  // summary cards
  totalDisplay.textContent = total.toFixed(2);
  countDisplay.textContent = visible.length;

  // category list and top category
  let topCategory = "-";
  let topAmount = 0;
  Object.keys(byCategory).forEach(function (category) {
    if (byCategory[category] > topAmount) {
      topAmount = byCategory[category];
      topCategory = category;
    }

    const li = document.createElement("li");

    const nameWrap = document.createElement("span");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = colorFor(category);
    nameWrap.appendChild(dot);
    nameWrap.appendChild(document.createTextNode(category));

    const amountStrong = document.createElement("strong");
    amountStrong.textContent = "Rs. " + byCategory[category].toFixed(2);

    li.appendChild(nameWrap);
    li.appendChild(amountStrong);
    summaryList.appendChild(li);
  });
  topCategoryDisplay.textContent = topCategory;

  updateCategoryChart(byCategory);
  updateTrendChart();
}

// ---------- Events ----------

function setActive(containerSelector, activeButton) {
  document.querySelectorAll(containerSelector + " .pill").forEach(function (btn) {
    btn.classList.toggle("active", btn === activeButton);
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (description === "") {
    showError("Please enter a description.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showError("Amount must be greater than 0.");
    return;
  }
  
  if (date === "") {
    showError("Please pick a date.");
    return;
  }
  if (date > toISO(new Date())) {                      // <-- new
    showError("The date can't be in the future.");
    return;
  }
  showError("");

  if (editingIndex === null) {
    expenses.push({
      description: description,
      amount: amount,
      category: category,
      date: date
    });
  } else {
    expenses[editingIndex].description = description;
    expenses[editingIndex].amount = amount;
    expenses[editingIndex].category = category;
    expenses[editingIndex].date = date;
  }

  saveExpenses();
  stopEdit();
  render();
});

cancelBtn.addEventListener("click", function () {
  showError("");
  stopEdit();
});

// list filter buttons: All / Today / This week / This month
document.querySelectorAll("#filter-pills .pill").forEach(function (btn) {
  btn.addEventListener("click", function () {
    currentFilter = btn.dataset.filter;
    setActive("#filter-pills", btn);
    stopEdit();
    render();
  });
});

// trend chart tabs: Daily / Weekly / Monthly
document.querySelectorAll("#trend-tabs .pill").forEach(function (btn) {
  btn.addEventListener("click", function () {
    currentTrend = btn.dataset.trend;
    setActive("#trend-tabs", btn);
    updateTrendChart();
  });
});

// ---------- Start ----------

dateInput.value = toISO(new Date());
render();