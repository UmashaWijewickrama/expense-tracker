# Expense Tracker

A simple, lightweight expense tracker built with plain HTML, CSS and JavaScript. Log what you spend, organise it by category, and filter it by day, week or month. All data is saved in your browser, so there is nothing to install and no account to create.

**Live demo:** https://umashawijewickrama.github.io/expense-tracker/

## Features

- **Add expenses** with a description, amount, category and date
- **Edit** any expense after saving it
- **Delete** expenses you no longer need
- **Categories** (Food, Transport, Bills, Fun, Other) with a running subtotal for each
- **Filters** to view expenses for today, this week, this month, or all time
- **Live totals** that update automatically for whatever is currently shown
- **Input validation** with friendly error messages for empty descriptions, invalid amounts and missing dates
- **Persistent storage** using the browser's `localStorage`, so your data survives a page refresh
- **Spending trend charts**(daily, weekly, monthly) and Category breakdown doughnut chart.

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Structure | HTML5                              |
| Styling   | CSS3 (Flexbox)                     |
| Logic     | Vanilla JavaScript (no frameworks) |
| Storage   | Browser `localStorage`             |
| Hosting   | GitHub Pages                       |
| Charts    | Chart.js                           |

## Getting Started

No build step or dependencies are required.

1. Clone the repository:

   ```bash
   git clone https://github.com/umashawijewickrama/expense-tracker.git
   ```

2. Open the project folder:

   ```bash
   cd expense-tracker
   ```

3. Open `index.html` in your browser (double-click it, or use the Live Server extension in VS Code).

## How to Use

1. Enter a description, amount, category and date, then click **Add**.
2. Use the **Show** dropdown to filter by today, this week (Monday to Sunday), this month, or all expenses.
3. Click **Edit** on any row to load it back into the form, change it, and click **Save** (or **Cancel** to back out).
4. Click **Delete** to remove an expense.
5. Check the **Total** and the **By category** section for a summary of what is currently shown.

## Project Structure

```
expense-tracker/
├── index.html    # Page structure and form
├── style.css     # Layout and styling
├── script.js     # App logic: add, edit, delete, filter, storage
└── README.md     # Project documentation
```

## How It Works

- The app keeps all expenses in a single JavaScript array, which acts as the source of truth. The page is redrawn from that array by a `render()` function after every change.
- After each add, edit or delete, the array is saved to `localStorage` as JSON and loaded again on page load.
- Dates are stored in `YYYY-MM-DD` format, which is unambiguous and easy to compare. Filters work by comparing each expense's date against today's date (weeks start on Monday).
- When a filter is active, each visible expense keeps track of its position in the full array, so Edit and Delete always act on the correct item.
- Text entered by the user is inserted with `textContent` rather than `innerHTML`, so it is always treated as plain text and never as HTML.

## Limitations

- Data is stored per browser and per device. It does not sync between devices, and clearing your browser data will erase it.
- There is no export or backup feature yet.

## Future Improvements
- Custom date range filter
- Export to CSV
- Monthly budget with warnings when it is exceeded

## Author

Built by Umasha as a learning project.
