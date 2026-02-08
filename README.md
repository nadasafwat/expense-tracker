# Expense Tracker PWA

A **simple, offline-first Expense Tracker Progressive Web App (PWA)** built using **pure HTML, CSS, and Vanilla JavaScript** — no frameworks, no libraries, no backend.

The app helps users track their daily expenses, manage monthly income, and analyze spending by month and category. It works fully offline and can be installed on mobile devices as a PWA.

---

## 🚀 Features

### 🔐 Authentication

* User **Registration & Login**
* Multiple users supported
* User data stored securely in **LocalStorage**
* Session-based auto-login using **SessionStorage**

### 💰 Income Management

* Set **monthly income** per user
* Income is stored **per month & year**
* Automatically recalculates balance when income changes

### 🧾 Expense Management

* Add, edit, and delete expenses
* Each expense includes:

  * Date
  * Amount
  * Category
* Prevents duplicate expense entries
* Expenses are grouped by **date** with daily totals

### 📊 Dashboard & Analytics

* View expenses by **selected month and year**
* Automatically calculates:

  * Total expenses
  * Remaining balance
* Color indication when balance becomes negative

### 🗂 Category Filter

* Dynamic **category dropdown**
* Categories update automatically based on the selected month
* Filter expenses by category or view all

### 📤 Export Data

* Export all expenses to **CSV file**
* CSV supports **Arabic & English** (UTF-8 with BOM)
* Compatible with Microsoft Excel

### 🌐 Progressive Web App (PWA)

* Installable on mobile and desktop
* Works **100% offline** using Service Worker
* Custom app icon
* Loads instantly after first visit

---

## 🛠️ Tech Stack

* **HTML5**
* **CSS3**
* **Vanilla JavaScript**
* **LocalStorage & SessionStorage**
* **Service Worker**
* **Web App Manifest**

❌ No frameworks
❌ No libraries
❌ No backend

---

## 📁 Project Structure

```
expense-tracker/
│
├── index.html
├── style.css
├── script.js
├── service-worker.js
├── manifest.json
├── icons/
│   └── icon-192.png
└── README.md
```

---

## 📲 How to Install as PWA

1. Open the app URL in Chrome or Edge
2. From browser menu, choose **Add to Home Screen**
3. The app will be installed like a native app
4. Works offline after first load

---

## 🧪 How to Run Locally

> ⚠️ Service Workers require a local server

### Option 1: VS Code Live Server

* Open project folder in VS Code
* Right-click `index.html`
* Choose **Open with Live Server**

### Option 2: Simple HTTP Server

```bash
npx serve
```

---

## 🧠 Design Principles

* Clean code structure
* Separation of concerns
* No unnecessary complexity
* Same logic preserved with improved readability
* Optimized DOM updates

---

## 🔒 Data Storage

* All data is stored **locally on the user's device**
* No data is sent to any server
* Clearing browser data will remove app data

---

## 📌 Limitations

* No cloud sync
* No password encryption (demo / learning purpose)
* Data is device-specific
