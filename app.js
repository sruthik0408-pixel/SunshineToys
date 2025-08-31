const currentYear = new Date().getFullYear();
const yearRange = Array.from({length: 11}, (_, i) => currentYear - 5 + i); // 5 years back, 5 years forward
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Load from localStorage or initialize
function loadData(key, defaultValue) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Data structure: { [year]: [{online, cash}, ...12 months] }
let allIncomeData = loadData('allIncomeData', {});
let allExpensesData = loadData('allExpensesData', {});

yearRange.forEach(year => {
    if (!allIncomeData[year]) {
        allIncomeData[year] = Array.from({length: 12}, () => ({online: 0, cash: 0}));
    }
    if (!allExpensesData[year]) {
        allExpensesData[year] = [];
    }
});

let selectedYear = currentYear;

// Populate year selector
const yearSelect = document.getElementById('year');
yearRange.forEach(year => {
    const opt = document.createElement('option');
    opt.value = year;
    opt.textContent = year;
    if (year === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
});

function getIncomeData() {
    return allIncomeData[selectedYear];
}
function getExpensesData() {
    return allExpensesData[selectedYear];
}

function updateIncomeTable() {
    const incomeData = getIncomeData();
    const tbody = document.querySelector('#income-table tbody');
    tbody.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const online = incomeData[i].online || 0;
        const cash = incomeData[i].cash || 0;
        const total = online + cash;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${monthNames[i]}</td>
            <td>${online.toFixed(2)}</td>
            <td>${cash.toFixed(2)}</td>
            <td>${total.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    }
}

function updateExpensesTable() {
    const expensesData = getExpensesData();
    const tbody = document.querySelector('#expenses-table tbody');
    tbody.innerHTML = '';
    expensesData.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${monthNames[exp.month]}</td>
            <td>${exp.date || ''}</td>
            <td>${exp.shop}</td>
            <td>${parseFloat(exp.amount).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('income-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const monthIdx = parseInt(document.getElementById('month').value, 10);
    const onlineInput = document.getElementById('online-income');
    const cashInput = document.getElementById('cash-income');
    const online = parseFloat(onlineInput.value) || 0;
    const cash = parseFloat(cashInput.value) || 0;
    getIncomeData()[monthIdx] = { online, cash };
    saveData('allIncomeData', allIncomeData);
    updateIncomeTable();
    onlineInput.value = '';
    cashInput.value = '';
});

yearSelect.addEventListener('change', function() {
    selectedYear = parseInt(this.value, 10);
    updateIncomeTable();
    updateExpensesTable();
});

// Initial render
updateIncomeTable();
updateExpensesTable();

// Minimize/Expand Income Table
const incomeTable = document.getElementById('income-table');
const toggleIncomeBtn = document.getElementById('toggle-income-table');
let incomeTableMinimized = false;
toggleIncomeBtn.addEventListener('click', function() {
    incomeTable.classList.toggle('hidden');
    incomeTableMinimized = incomeTable.classList.contains('hidden');
});

// Minimize/Expand Expenses Table
const expensesForm = document.getElementById('expenses-form');
const expensesTable = document.getElementById('expenses-table');
const toggleExpensesBtn = document.getElementById('toggle-expenses-table');
toggleExpensesBtn.addEventListener('click', function() {
    expensesForm.classList.toggle('hidden');
    expensesTable.classList.toggle('hidden');
});

// Expenses Form
document.getElementById('expenses-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const monthIdx = parseInt(document.getElementById('expense-month').value, 10);
    const date = document.getElementById('expense-date').value;
    const shopInput = document.getElementById('shop-name');
    const amountInput = document.getElementById('expense-amount');
    const shop = shopInput.value.trim();
    const amount = parseFloat(amountInput.value) || 0;
    if (!shop || isNaN(monthIdx)) return;
    getExpensesData().push({ month: monthIdx, date, shop, amount });
    saveData('allExpensesData', allExpensesData);
    updateExpensesTable();
    if (incomeTableMinimized) {
        incomeTable.classList.add('hidden');
    }
    shopInput.value = '';
    amountInput.value = '';
    document.getElementById('expense-date').value = '';
    document.getElementById('expense-month').value = '';
});

// Download table as Excel (single file, two sheets)
document.getElementById('download-excel').addEventListener('click', function() {
    // Prepare Income Sheet
    const incomeData = getIncomeData();
    const incomeSheet = [
        ["Month", "Online", "Cash", "Total"]
    ];
    for (let i = 0; i < 12; i++) {
        const online = incomeData[i].online || 0;
        const cash = incomeData[i].cash || 0;
        const total = online + cash;
        incomeSheet.push([monthNames[i], online.toFixed(2), cash.toFixed(2), total.toFixed(2)]);
    }
    // Prepare Expenses Sheet
    const expensesData = getExpensesData();
    const expensesSheet = [
        ["Month", "Date", "Shop Name", "Expense Amount"]
    ];
    expensesData.forEach(exp => {
        expensesSheet.push([
            monthNames[exp.month],
            exp.date || '',
            exp.shop,
            parseFloat(exp.amount).toFixed(2)
        ]);
    });

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();
    const wsIncome = XLSX.utils.aoa_to_sheet(incomeSheet);
    const wsExpenses = XLSX.utils.aoa_to_sheet(expensesSheet);
    XLSX.utils.book_append_sheet(wb, wsIncome, "Income");
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Expense");

    // Download
    XLSX.writeFile(wb, `Income_Expenses_${selectedYear}.xlsx`);
});
