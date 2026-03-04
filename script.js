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
    // read two separate income fields (cash + card)
    const cashIncome = parseFloat(document.getElementById('reg-income-cash').value) || 0;
    const cardIncome = parseFloat(document.getElementById('reg-income-card').value) || 0;

    if (cashIncome < 0 || cardIncome < 0) {
        showToast('Income values cannot be negative', 'error');
        return;
    }

    const users = getAllUsers();
    if (users.some(u => u.Name === name)) {
        showToast('Username already exists!', 'error');
        return;
    }

    const monthKey = getMonthKey(currentViewDate.year, currentViewDate.month);
    // store as object so we can track separately later
    const incomeMap = { [monthKey]: { cash: cashIncome, card: cardIncome } };

    users.push({
        Name: name,
        Password: pass,
        Monthly_Income: incomeMap,
        expenses: [],
        Total_Expenses: 0,
        Remaining_Balance: cashIncome + cardIncome
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
    const cash = parseFloat(document.getElementById('current-income-cash').value) || 0;
    const card = parseFloat(document.getElementById('current-income-card').value) || 0;

    if (cash < 0 || card < 0) {
        showToast('Income cannot be negative', 'error');
        return;
    }

    if (!currentUser.Monthly_Income) currentUser.Monthly_Income = {};
    currentUser.Monthly_Income[monthKey] = { cash, card };
    updateCurrentUserInStorage();
    renderDashboardData();
}

function renderDashboardData() {
    const monthKey = getMonthKey(currentViewDate.year, currentViewDate.month);

    // retrieve income object, handle legacy numeric format
    let monthlyIncome = currentUser.Monthly_Income[monthKey];
    if (monthlyIncome == null) {
        monthlyIncome = { cash: 0, card: 0 };
    } else if (typeof monthlyIncome === 'number') {
        // migrate old format to new
        monthlyIncome = { cash: monthlyIncome, card: 0 };
        currentUser.Monthly_Income[monthKey] = monthlyIncome;
        updateCurrentUserInStorage();
    }

    document.getElementById('current-income-cash').value = monthlyIncome.cash;
    document.getElementById('current-income-card').value = monthlyIncome.card;
    document.getElementById('total-income-display').innerText = (monthlyIncome.cash + monthlyIncome.card).toLocaleString();

    const monthlyExpenses = currentUser.expenses.filter(exp => {
        const d = new Date(exp.Date);
        return d.getFullYear() === currentViewDate.year &&
               d.getMonth() + 1 === currentViewDate.month;
    });

    // calculate separate amounts by payment method
    const cashExpenses = monthlyExpenses
        .filter(e => (e.PaymentMethod || 'Cash') === 'Cash')
        .reduce((s, e) => s + e.Amount, 0);
    const cardExpenses = monthlyExpenses
        .filter(e => e.PaymentMethod === 'Card')
        .reduce((s, e) => s + e.Amount, 0);
    const totalExpenses = cashExpenses + cardExpenses;

    const cashBalance = monthlyIncome.cash - cashExpenses;
    const cardBalance = monthlyIncome.card - cardExpenses;
    const totalBalance = cashBalance + cardBalance;

    document.getElementById('total-expenses-display').innerText = totalExpenses.toLocaleString();
    document.getElementById('cash-balance-display').innerText = cashBalance.toLocaleString();
    document.getElementById('card-balance-display').innerText = cardBalance.toLocaleString();
    const balEl = document.getElementById('remaining-balance-display');
    balEl.innerText = totalBalance.toLocaleString();
    balEl.style.color = totalBalance < 0 ? 'var(--danger)' : 'var(--text)';

    currentUser.Total_Expenses = totalExpenses;
    currentUser.Remaining_Balance = totalBalance;
    updateCurrentUserInStorage();

    updateCategoryFilter(monthlyExpenses);
    applyCategoryFilter(monthlyExpenses);
}

/* ---------- CATEGORY FILTER ---------- */
function updateCategoryFilter(expenses) {
    const container = document.getElementById('category-filter-chips');
    const categories = getUniqueCategories(expenses);
    
    // Get previously selected values to restore
    const prev = Array.from(container.querySelectorAll('.filter-chip.active'))
        .map(el => el.dataset.value);
    
    container.innerHTML = '';
    
    // Add "All" chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'filter-chip';
    allChip.dataset.value = 'all';
    allChip.innerText = 'All';
    if (prev.length === 0 || prev.includes('all')) {
        allChip.classList.add('active');
    }
    allChip.addEventListener('click', (e) => {
        e.preventDefault();
        container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        allChip.classList.add('active');
        const monthExpenses = currentUser.expenses.filter(exp => {
            const d = new Date(exp.Date);
            return d.getFullYear() === currentViewDate.year &&
                   d.getMonth() + 1 === currentViewDate.month;
        });
        applyCategoryFilter(monthExpenses);
    });
    container.appendChild(allChip);
    
    // Add category chips
    categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip';
        chip.dataset.value = cat;
        chip.innerText = cat;
        if (prev.includes(cat)) {
            chip.classList.add('active');
            // remove all active if any category is selected
            allChip.classList.remove('active');
        }
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            chip.classList.toggle('active');
            // if all chips are deselected, activate "All"
            const activeChips = container.querySelectorAll('.filter-chip.active:not([data-value="all"])');
            if (activeChips.length === 0) {
                allChip.classList.add('active');
            } else {
                allChip.classList.remove('active');
            }
            const monthExpenses = currentUser.expenses.filter(exp => {
                const d = new Date(exp.Date);
                return d.getFullYear() === currentViewDate.year &&
                       d.getMonth() + 1 === currentViewDate.month;
            });
            applyCategoryFilter(monthExpenses);
        });
        container.appendChild(chip);
    });
}

/**
 * Calculate the total amount for filtered expenses
 * @param {Array} expenses - Array of expense objects to sum
 * @returns {number} Total amount using optimized .reduce() method
 */
function calculateCategoryTotal(expenses) {
    return expenses.reduce((total, expense) => total + expense.Amount, 0);
}

/**
 * Update the category summary card with total and title
 * @param {string} categoryName - The selected category name
 * @param {number} total - The calculated total for the category
 */
function updateCategorySummaryCard(categoryName, total) {
    const summaryCard = document.getElementById('category-summary-card');
    const titleEl = document.getElementById('category-summary-title');
    const amountEl = document.getElementById('category-summary-amount');

    // Check if elements exist before trying to modify them
    if (!summaryCard || !amountEl) {
        return;
    }

    if (total === 0) {
        summaryCard.classList.add('hidden');
    } else {
        summaryCard.classList.remove('hidden');
        if (titleEl) {
            titleEl.innerText = categoryName === 'all' ? 'Total All Categories' : `Total: ${categoryName}`;
        }
        amountEl.innerText = total.toLocaleString();
    }
}

function applyCategoryFilter(expenses) {
    const container = document.getElementById('category-filter-chips');
    const selected = Array.from(container.querySelectorAll('.filter-chip.active'))
        .map(chip => chip.dataset.value);

    let filteredExpenses;
    if (selected.length === 0 || selected.includes('all')) {
        filteredExpenses = expenses;
    } else {
        filteredExpenses = expenses.filter(e => selected.includes(e.Category));
    }

    // Calculate total using optimized .reduce() method
    const categoryTotal = calculateCategoryTotal(filteredExpenses);
    
    // Update the category summary card
    const displayName = (selected.length === 0 || selected.includes('all')) ? 'all' : selected.join(', ');
    updateCategorySummaryCard(displayName, categoryTotal);

    renderExpenseList(filteredExpenses);
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
                    const method = exp.PaymentMethod || 'Cash';
                    return `
                    <div class="expense-item">
                        <div class="expense-info">
                            <h4>${exp.Category}</h4>
                            <small>${exp.Amount} EGP · ${method}</small>
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
        document.getElementById('exp-payment-method').value = exp.PaymentMethod || 'Cash';
    } else {
        document.getElementById('modal-title').innerText = 'Add Expense';
        expenseForm.reset();
        // default to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('exp-date').value = today;
        document.getElementById('exp-payment-method').value = '';
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
    const paymentMethod = document.getElementById('exp-payment-method').value;
    const editIdx = document.getElementById('edit-index').value;

    if (amount <= 0) {
        showToast('Amount must be positive', 'error');
        return;
    }
    if (!paymentMethod) {
        showToast('Select a payment method', 'error');
        return;
    }

    const isDuplicate = currentUser.expenses.some((e, i) =>
        (editIdx === '' || i != editIdx) &&
        e.Date === date && e.Amount === amount && e.Category === category &&
        (e.PaymentMethod || 'Cash') === paymentMethod
    );

    if (isDuplicate) {
        showToast('Duplicate expense entry!', 'error');
        return;
    }

    const expenseObj = { Date: date, Amount: amount, Category: category, PaymentMethod: paymentMethod };

    if (editIdx !== '') {
        currentUser.expenses[editIdx] = expenseObj;
        showToast('Expense updated');
    } else {
        currentUser.expenses.push(expenseObj);
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
        'Date,Amount,Category,PaymentMethod,Month,Year',
        ...currentUser.expenses.map(e => {
            const d = new Date(e.Date);
            const method = e.PaymentMethod || 'Cash';
            return `${e.Date},${e.Amount},${e.Category},${method},${d.getMonth()+1},${d.getFullYear()}`;
        })
    ];

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentUser.Name}_expenses.csv`;
    link.click();
}

/* =========================================
   8. CSV IMPORT
   ========================================= */

/**
 * Validate a single expense row from CSV
 * @param {Object} row - CSV row object
 * @param {number} rowIndex - Row number for error reporting
 * @returns {Object} {isValid: boolean, expense: Object, error: string}
 */
function validateExpenseRow(row, rowIndex) {
    // Check for required fields
    if (!row.Date || !row.Amount || !row.Category) {
        return {
            isValid: false,
            error: `Row ${rowIndex}: Missing required field (Date, Amount, or Category)`
        };
    }

    // Validate and parse Date (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.Date.trim())) {
        return {
            isValid: false,
            error: `Row ${rowIndex}: Invalid date format. Expected YYYY-MM-DD, got "${row.Date}"`
        };
    }

    // Validate date is real
    const parsedDate = new Date(row.Date);
    if (isNaN(parsedDate.getTime())) {
        return {
            isValid: false,
            error: `Row ${rowIndex}: Invalid date "${row.Date}"`
        };
    }

    // Validate and parse Amount (positive number)
    const amount = parseFloat(row.Amount);
    if (isNaN(amount) || amount <= 0) {
        return {
            isValid: false,
            error: `Row ${rowIndex}: Amount must be a positive number, got "${row.Amount}"`
        };
    }

    // Validate Category (non-empty string)
    const category = row.Category.trim();
    if (!category || category.length === 0) {
        return {
            isValid: false,
            error: `Row ${rowIndex}: Category cannot be empty`
        };
    }

    // optional payment method
    let paymentMethod = 'Cash';
    if (row.PaymentMethod) {
        const pm = row.PaymentMethod.trim();
        if (pm === 'Card' || pm === 'Cash') {
            paymentMethod = pm;
        } else {
            return {
                isValid: false,
                error: `Row ${rowIndex}: Invalid payment method "${row.PaymentMethod}"`
            };
        }
    }

    return {
        isValid: true,
        expense: {
            Date: row.Date,
            Amount: amount,
            Category: category,
            Description: row.Description ? row.Description.trim() : '',
            PaymentMethod: paymentMethod
        },
        error: null
    };
}

/**
 * Parse CSV file and validate all rows
 * @param {string} csvContent - Raw CSV content
 * @returns {Object} {validExpenses: Array, errors: Array, summary: Object}
 */
function parseCSVData(csvContent) {
    const result = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: ','
    });

    if (result.errors.length > 0) {
        return {
            validExpenses: [],
            errors: result.errors.map(e => `Parse error: ${e.message}`),
            summary: { total: 0, valid: 0, invalid: 0 }
        };
    }

    const validExpenses = [];
    const errors = [];
    const rows = result.data;

    rows.forEach((row, index) => {
        // Skip completely empty rows
        if (!row.Date && !row.Amount && !row.Category) {
            return;
        }

        const validation = validateExpenseRow(row, index + 2); // +2 because index 0 is header, 1-based
        if (validation.isValid) {
            validExpenses.push(validation.expense);
        } else {
            errors.push(validation.error);
        }
    });

    return {
        validExpenses,
        errors,
        summary: {
            total: rows.length,
            valid: validExpenses.length,
            invalid: errors.length
        }
    };
}

/**
 * Merge imported expenses with existing data
 * @param {Array} newExpenses - Expenses to import
 * @returns {Object} {imported: number, duplicates: number, total: number}
 */
function importExpenses(newExpenses) {
    let importedCount = 0;
    let duplicateCount = 0;

    newExpenses.forEach(newExp => {
        // Check for duplicates
        const isDuplicate = currentUser.expenses.some(exp =>
            exp.Date == newExp.Date &&
            exp.Amount == newExp.Amount &&
            exp.Category == newExp.Category &&
            ((exp.PaymentMethod || 'Cash') === newExp.PaymentMethod)
        );

        if (!isDuplicate) {
            currentUser.expenses.push(newExp);
            importedCount++;
        } else {
            duplicateCount++;
        }
    });

    // Save to storage and refresh UI
    updateCurrentUserInStorage();
    renderDashboardData();

    return {
        imported: importedCount,
        duplicates: duplicateCount,
        total: importedCount + duplicateCount
    };
}

/**
 * Open CSV import modal
 */
function openCSVImportModal() {
    const modal = document.getElementById('csv-import-modal');
    modal.classList.remove('hidden');
    document.getElementById('csv-file-input').value = '';
}

/**
 * Close CSV import modal
 */
function closeCSVImportModal() {
    document.getElementById('csv-import-modal').classList.add('hidden');
}

/**
 * Start CSV import process
 */
function startCSVImport() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }

    if (!file.name.endsWith('.csv')) {
        showToast('Please select a CSV file', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const csvContent = e.target.result;
            const parseResult = parseCSVData(csvContent);

            // Check for validation errors
            if (parseResult.errors.length > 0) {
                let errorMessage = parseResult.errors.slice(0, 3).join(' | ');
                if (parseResult.errors.length > 3) {
                    errorMessage += ` | ... and ${parseResult.errors.length - 3} more errors`;
                }
                showToast(`Validation errors: ${errorMessage}`, 'error');
                return;
            }

            // No valid data to import
            if (parseResult.validExpenses.length === 0) {
                showToast('No valid records found in CSV', 'error');
                return;
            }

            // Import the data
            const result = importExpenses(parseResult.validExpenses);

            // Close modal and show success
            closeCSVImportModal();

            if (result.imported > 0) {
                let message = `✓ Imported ${result.imported} expense${result.imported !== 1 ? 's' : ''}`;
                if (result.duplicates > 0) {
                    message += ` (${result.duplicates} duplicate${result.duplicates !== 1 ? 's' : ''} skipped)`;
                }
                showToast(message);
            } else {
                showToast(`All ${result.total} rows were duplicates`, 'error');
            }

        } catch (error) {
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    reader.onerror = () => {
        showToast('Error reading file', 'error');
    };

    reader.readAsText(file);
}
window.onload = () => {
    const name = sessionStorage.getItem('current_session_user');
    if (!name) return;

    const user = getAllUsers().find(u => u.Name === name);
    if (user) {
        currentUser = user;
        initDashboard();
    }
};
