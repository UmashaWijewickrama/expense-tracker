const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");               // new
const filterSelect = document.getElementById("filter");          // new
const list = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total");
const summaryList = document.getElementById("summary-list");
const errorMessage = document.getElementById("error-message");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editingIndex = null;
let currentFilter = "all";                                       // new

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function showError(message) {
  errorMessage.textContent = message;
}

// ---------- new: date helpers ----------

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
  const d = new Date(str); // older expenses saved with the old format
  if (isNaN(d)) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function matchesFilter(expense, filter) {
  if (filter === "all") return true;

  const day = parseDate(expense.date);
  if (!day) return false; // date can't be read, so show it only under "All"

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "day") {
    return day.getTime() === today.getTime();
  }

  if (filter === "week") {
    // weeks start on Monday
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

// ---------- edit mode ----------

function startEdit(index) {
  const expense = expenses[index];
  descriptionInput.value = expense.description;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category || "Other";
  dateInput.value = toISO(parseDate(expense.date) || new Date());   // new

  editingIndex = index;
  submitBtn.textContent = "Save";
  cancelBtn.hidden = false;
  descriptionInput.focus();
}

function stopEdit() {
  editingIndex = null;
  submitBtn.textContent = "Add";
  cancelBtn.hidden = true;
  form.reset();
  dateInput.value = toISO(new Date());                              // new: default to today
}

// ---------- drawing the page ----------

function render() {
  list.innerHTML = "";
  summaryList.innerHTML = "";
  let total = 0;
  const byCategory = {};

  // new: keep each expense together with its position in the full array,
  // so Edit and Delete still hit the right item while a filter is active
  const visible = [];
  expenses.forEach(function (expense, index) {
    if (matchesFilter(expense, currentFilter)) {
      visible.push({ expense: expense, index: index });
    }
  });

  if (visible.length === 0) {                                       // new
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "No expenses for this period.";
    list.appendChild(emptyLi);
  }

  visible.forEach(function (item) {                                 // changed
    const expense = item.expense;
    const index = item.index;
    const category = expense.category || "Other";

    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = expense.description + " (" + category + ")";

    const shownDate = parseDate(expense.date);                      // changed
    const dateSmall = document.createElement("small");
    dateSmall.className = "date";
    dateSmall.textContent = " - " + (shownDate ? shownDate.toLocaleDateString() : (expense.date || "no date"));
    nameSpan.appendChild(dateSmall);

    const amountSpan = document.createElement("span");
    amountSpan.textContent = "Rs. " + expense.amount.toFixed(2);

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

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);

    total += expense.amount;
    byCategory[category] = (byCategory[category] || 0) + expense.amount;
  });

  totalDisplay.textContent = total.toFixed(2);

  Object.keys(byCategory).forEach(function (category) {
    const li = document.createElement("li");
    li.textContent = category + ": Rs. " + byCategory[category].toFixed(2);
    summaryList.appendChild(li);
  });
}

// ---------- events ----------

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;                                     // new

  if (description === "") {
    showError("Please enter a description.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showError("Amount must be greater than 0.");
    return;
  }
  if (date === "") {                                                // new
    showError("Please pick a date.");
    return;
  }
  showError("");

  if (editingIndex === null) {
    expenses.push({
      description: description,
      amount: amount,
      category: category,
      date: date                                                    // changed
    });
  } else {
    expenses[editingIndex].description = description;
    expenses[editingIndex].amount = amount;
    expenses[editingIndex].category = category;
    expenses[editingIndex].date = date;                             // new
  }

  saveExpenses();
  stopEdit();
  render();
});

cancelBtn.addEventListener("click", function () {
  showError("");
  stopEdit();
});

filterSelect.addEventListener("change", function () {               // new
  currentFilter = filterSelect.value;
  stopEdit();
  render();
});

dateInput.value = toISO(new Date());                                // new: default to today
render();