/* =========================================
   1. GLOBAL STATE & CONFIG
   ========================================= */
const STORAGE_KEY = 'expense_manager_data';
let currentUser = null;
let currentViewDate = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

/* =========================================
   2. DATA LAYER (LocalStorage)
   ========================================= */

function getAllUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAllUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function updateCurrentUserInStorage() {
    const users = getAllUsers();
    const index = users.findIndex(u => u.Name === currentUser.Name);
    if (index !== -1) {
        users[index] = currentUser;
        saveAllUsers(users);
    }
}

/* =========================================*/

/* =========================================
   3. AUTHENTICATION
   ========================================= */

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const btns = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

// REGISTER
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    const income = parseFloat(document.getElementById('reg-income').value);

    const users = getAllUsers();
    if (users.some(u => u.Name === name)) {
        showToast('Username already exists!', 'error');
        return;
    }

    const monthKey = getMonthKey(currentViewDate.year, currentViewDate.month);
    const incomeMap = { [monthKey]: income };

    users.push({
        Name: name,
        Password: pass,
        Monthly_Income: incomeMap,
        expenses: [],
        Total_Expenses: 0,
        Remaining_Balance: income
    });

    saveAllUsers(users);
    showToast('Registration successful!');
    switchAuthTab('login');
    e.target.reset();
});

// LOGIN
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('login-name').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    const user = getAllUsers().find(u => u.Name === name && u.Password === pass);
    if (!user) return showToast('Invalid credentials', 'error');

    currentUser = user;
    sessionStorage.setItem('current_session_user', name);
    initDashboard();
});
function logout() {
    currentUser = null;
    sessionStorage.removeItem('current_session_user');
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
}

/* =========================================
   4. DASHBOARD LOGIC
   ========================================= */
function initDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('display-username').textContent = currentUser.Name;

    populateDateSelectors();
    renderDashboardData();
}

function populateDateSelectors() {
    const yearSel = document.getElementById('sel-year');
    const monthSel = document.getElementById('sel-month');

    yearSel.innerHTML = '';
    monthSel.innerHTML = '';

    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
        yearSel.innerHTML += `<option ${y === currentViewDate.year ? 'selected' : ''}>${y}</option>`;
    }

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    months.forEach((m, i) => {
        monthSel.innerHTML += `
            <option value="${i + 1}" ${i + 1 === currentViewDate.month ? 'selected' : ''}>
                ${i + 1} - ${m}
            </option>`;
    });

    yearSel.onchange = e => {
        currentViewDate.year = parseInt(e.target.value);
        renderDashboardData();
    };

    monthSel.onchange = e => {
        currentViewDate.month = parseInt(e.target.value);
        renderDashboardData();
    };
}

function updateIncome() {
    const monthKey = getMonthKey(currentViewDate.year, currentViewDate.month);
    const income = parseFloat(document.getElementById('current-income-input').value);
    
    if (income <= 0) {
        showToast('Income must be positive', 'error');
        return;
    }
    
    if (!currentUser.Monthly_Income) currentUser.Monthly_Income = {};
    currentUser.Monthly_Income[monthKey] = income;
    updateCurrentUserInStorage();
    renderDashboardData();
}

function renderDashboardData() {
    const monthKey = getMonthKey(currentViewDate.year, currentViewDate.month);

    const monthlyIncome = currentUser.Monthly_Income[monthKey] ?? 0;
    document.getElementById('current-income-input').value = monthlyIncome;

    const monthlyExpenses = currentUser.expenses.filter(exp => {
        const d = new Date(exp.Date);
        return d.getFullYear() === currentViewDate.year &&
               d.getMonth() + 1 === currentViewDate.month;
    });

    const totalExpenses = monthlyExpenses.reduce((s, e) => s + e.Amount, 0);
    const balance = monthlyIncome - totalExpenses;

    document.getElementById('total-expenses-display').innerText = totalExpenses.toLocaleString();
    const balEl = document.getElementById('remaining-balance-display');
    balEl.innerText = balance.toLocaleString();
    balEl.style.color = balance < 0 ? 'var(--danger)' : 'var(--text)';

    currentUser.Total_Expenses = totalExpenses;
    currentUser.Remaining_Balance = balance;
    updateCurrentUserInStorage();

    updateCategoryFilter(monthlyExpenses);
    applyCategoryFilter(monthlyExpenses);
}

/* ---------- CATEGORY FILTER ---------- */
function updateCategoryFilter(expenses) {
    const select = document.getElementById('category-filter');
    const currentValue = select.value;

    select.innerHTML = '<option value="all">All</option>';

    getUniqueCategories(expenses).forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        if (cat === currentValue) opt.selected = true;
        select.appendChild(opt);
    });
}

function applyCategoryFilter(expenses) {
    const selected = document.getElementById('category-filter').value;
    renderExpenseList(
        selected === 'all'
            ? expenses
            : expenses.filter(e => e.Category === selected)
    );
}

document.getElementById('category-filter').addEventListener('change', () => {
    const monthExpenses = currentUser.expenses.filter(exp => {
        const d = new Date(exp.Date);
        return d.getFullYear() === currentViewDate.year &&
               d.getMonth() + 1 === currentViewDate.month;
    });
    applyCategoryFilter(monthExpenses);
});

/* =========================================
   5. EXPENSE LIST RENDER
   ========================================= */
function renderExpenseList(expenses) {
    const container = document.getElementById('expense-list-container');
    container.innerHTML = '';

    if (!expenses.length) {
        container.innerHTML =
            '<div style="text-align:center; padding:20px; color:#aaa;">No expenses for this month.</div>';
        return;
    }

    expenses.sort((a, b) => new Date(b.Date) - new Date(a.Date));

    const groups = {};
    expenses.forEach(e => {
        groups[e.Date] ??= [];
        groups[e.Date].push(e);
    });

    Object.entries(groups).forEach(([date, items]) => {
        const dayTotal = items.reduce((s, i) => s + i.Amount, 0);

        container.innerHTML += `
        <div class="day-group">
            <div class="day-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span>📅 ${date}</span>
                <span>Total: ${dayTotal} EGP</span>
            </div>
            <div class="day-content">
                ${items.map(exp => {
                    const idx = currentUser.expenses.indexOf(exp);
                    return `
                    <div class="expense-item">
                        <div class="expense-info">
                            <h4>${exp.Category}</h4>
                            <small>${exp.Amount} EGP</small>
                        </div>
                        <div class="expense-actions">
                            <button onclick="editExpense(${idx})">✏️</button>
                            <button onclick="deleteExpense(${idx})">🗑️</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    });
}

/* =========================================
   6. EXPENSE CRUD
   ========================================= */
const modal = document.getElementById('expense-modal');
const expenseForm = document.getElementById('expense-form');

function openModal(index = null) {
    modal.classList.remove('hidden');
    document.getElementById('edit-index').value = index ?? '';

    if (index !== null) {
        const exp = currentUser.expenses[index];
        document.getElementById('modal-title').innerText = 'Edit Expense';
        document.getElementById('exp-date').value = exp.Date;
        document.getElementById('exp-amount').value = exp.Amount;
        document.getElementById('exp-category').value = exp.Category;
    } else {
        document.getElementById('modal-title').innerText = 'Add Expense';
        expenseForm.reset();
        document.getElementById('exp-date').value =
            `${currentViewDate.year}-${String(currentViewDate.month).padStart(2,'0')}-01`;
    }
}

function closeModal() {
    modal.classList.add('hidden');
}

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const date = document.getElementById('exp-date').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value.trim();
    const editIdx = document.getElementById('edit-index').value;

    if (amount <= 0) {
        showToast('Amount must be positive', 'error');
        return;
    }

    const isDuplicate = currentUser.expenses.some((e, i) =>
        (editIdx === '' || i != editIdx) &&
        e.Date === date && e.Amount === amount && e.Category === category
    );

    if (isDuplicate) {
        showToast('Duplicate expense entry!', 'error');
        return;
    }

    if (editIdx !== '') {
        currentUser.expenses[editIdx] = { Date: date, Amount: amount, Category: category };
        showToast('Expense updated');
    } else {
        currentUser.expenses.push({ Date: date, Amount: amount, Category: category });
        showToast('Expense added');
    }

    updateCurrentUserInStorage();
    renderDashboardData();
    closeModal();
});

function editExpense(index) {
    openModal(index);
}

function deleteExpense(index) {
    if (confirm('Delete this expense?')) {
        currentUser.expenses.splice(index, 1);
        updateCurrentUserInStorage();
        renderDashboardData();
        showToast('Expense deleted');
    }
}

/* =========================================
   7. UTILITIES
   ========================================= */
function getMonthKey(y, m) {
    return `${y}-${String(m).padStart(2, '0')}`;
}

function getUniqueCategories(expenses) {
    return [...new Set(expenses.map(e => e.Category))];
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.background = type === 'error' ? '#FF7675' : '#333';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function exportCSV() {
    if (!currentUser.expenses.length) {
        showToast('No data to export', 'error');
        return;
    }

    const rows = [
        'Date,Amount,Category,Month,Year',
        ...currentUser.expenses.map(e => {
            const d = new Date(e.Date);
            return `${e.Date},${e.Amount},${e.Category},${d.getMonth()+1},${d.getFullYear()}`;
        })
    ];

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentUser.Name}_expenses.csv`;
    link.click();
}

/* =========================================
   8. AUTO LOGIN
   ========================================= */
window.onload = () => {
    const name = sessionStorage.getItem('current_session_user');
    if (!name) return;

    const user = getAllUsers().find(u => u.Name === name);
    if (user) {
        currentUser = user;
        initDashboard();
    }
};
