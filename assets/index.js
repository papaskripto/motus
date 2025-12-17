let db;

// Initialize IndexedDB
function initDB() {
    const request = indexedDB.open("expensesDB", 1);

    request.onerror = function(event) {
        console.error("Database error:", event.target.errorCode);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        displayCurrentMonth();
        displayExpenses();
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("expenses")) {
            db.createObjectStore("expenses", { keyPath: "id", autoIncrement: true });
        }
    };
}

// Display current month at the top
function displayCurrentMonth() {
    const monthTitle = document.getElementById("monthTitle");
    const now = new Date();
    const options = { month: "long", year: "numeric" };
    monthTitle.textContent = now.toLocaleDateString(undefined, options); // e.g., December, 2024
}

// Add expense to DB
function addExpense(item, amount) {
    const transaction = db.transaction(["expenses"], "readwrite");
    const store = transaction.objectStore("expenses");

    const expense = {
        item: item,
        amount: parseFloat(amount),
        date: new Date().toISOString()
    };

    const request = store.add(expense);

    request.onsuccess = function() {
        displayExpenses();
        document.getElementById("expenseForm").reset();
    };

    request.onerror = function(event) {
        console.error("Error adding expense:", event.target.errorCode);
    };
}

// Display all expenses
function displayExpenses() {
    const transaction = db.transaction(["expenses"], "readonly");
    const store = transaction.objectStore("expenses");
    const request = store.openCursor();

    const expenseList = document.getElementById("expenseList");
    expenseList.innerHTML = "";
    let total = 0;
    let hasExpenses = false;

    // Get current month string to filter
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const exp = cursor.value;
            const expDate = new Date(exp.date);

            // Only show expenses for the current month and year
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                hasExpenses = true;

                const div = document.createElement("div");
                div.className = "expense-item";
                div.dataset.id = exp.id;
                div.innerHTML = `
                    <span class="expense-name">${exp.item}</span>
                    <span class="expense-amount">KES ${exp.amount.toFixed(2)}</span>
                    <button class="delete-btn">Delete</button>
                `;
                expenseList.appendChild(div);

                total += exp.amount;
            }

            cursor.continue();
        } else {
            if (!hasExpenses) {
                expenseList.innerHTML = `<div class="empty-state"><p>No expenses for this month yet. Add your first expense above!</p></div>`;
                document.getElementById("totalSection").style.display = "none";
            } else {
                document.getElementById("totalAmount").textContent = `KES ${total.toFixed(2)}`;
                document.getElementById("totalSection").style.display = "block";
                attachDeleteEvents();
            }
        }
    };
}

// Delete expense
function deleteExpense(id) {
    const transaction = db.transaction(["expenses"], "readwrite");
    const store = transaction.objectStore("expenses");
    const request = store.delete(id);

    request.onsuccess = function() {
        displayExpenses();
    };

    request.onerror = function(event) {
        console.error("Error deleting expense:", event.target.errorCode);
    };
}

// Attach delete button listeners
function attachDeleteEvents() {
    const buttons = document.querySelectorAll(".delete-btn");
    buttons.forEach(button => {
        button.onclick = function() {
            const id = parseInt(this.parentElement.dataset.id);
            deleteExpense(id);
        };
    });
}

// Handle form submission
document.getElementById("expenseForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const item = document.getElementById("item").value.trim();
    const amount = document.getElementById("amount").value.trim();

    if (!item || !amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid item and amount.");
        return;
    }

    addExpense(item, amount);
});

// Initialize DB on page load
window.addEventListener("DOMContentLoaded", () => {
    initDB();
    displayCurrentMonth();
});
