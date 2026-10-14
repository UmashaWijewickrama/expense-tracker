const form = document.getElementById("expense-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const list = document.getElementById("expense-list");
const totalDisplay = document.getElementById("total");
const summaryList = document.getElementById("summary-list");
const errorMessage = document.getElementById("error-message");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editingIndex = null;  
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function showError(message) {
  errorMessage.textContent = message;
}

function startEdit(index) {
  const expense = expenses[index];
  descriptionInput.value = expense.description;
  amountInput.value = expense.amount;
  categoryInput.value = expense.category || "Other";

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
}

function render() {
  list.innerHTML = "";
  summaryList.innerHTML = "";
  let total = 0;
  const byCategory = {};

  expenses.forEach(function (expense, index) {
    const category = expense.category || "Other";

    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = expense.description + " (" + category + ")";

    if (expense.date) {
      const dateSmall = document.createElement("small");
      dateSmall.className = "date";
      dateSmall.textContent = " - " + expense.date;
      nameSpan.appendChild(dateSmall);
    }

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

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;

  if (description === "") {
    showError("Please enter a description.");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showError("Amount must be greater than 0.");
    return;
  }
  showError("");

  if (editingIndex === null) {
    expenses.push({
      description: description,
      amount: amount,
      category: category,
      date: new Date().toLocaleDateString()
    });
  } else {
    expenses[editingIndex].description = description;
    expenses[editingIndex].amount = amount;
    expenses[editingIndex].category = category;
  }

  saveExpenses();
  stopEdit();
  render();
});

cancelBtn.addEventListener("click", function () {
  showError("");
  stopEdit();
});

render();