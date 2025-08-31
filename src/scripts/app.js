const currentYear = new Date().getFullYear();
const yearRange = Array.from({length: 11}, (_, i) => currentYear - 5 + i); // 5 years back, 5 years forward
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Data structure: { [year]: [{online, cash}, ...12 months] }
const allIncomeData = {};
const allExpensesData = {}; // { [year]: [ {month, date, shop, amount} ] }
yearRange.forEach(year => {
    allIncomeData[year] = Array.from({length: 12}, () => ({online: 0, cash: 0}));
    allExpensesData[year] = [];
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
    const online = parseFloat(document.getElementById('online-income').value) || 0;
    const cash = parseFloat(document.getElementById('cash-income').value) || 0;
    getIncomeData()[monthIdx] = { online, cash };
    updateIncomeTable();
    // Optionally, reset form
    // this.reset();
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
    const shop = document.getElementById('shop-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    if (!shop || isNaN(monthIdx)) return;
    getExpensesData().push({ month: monthIdx, date, shop, amount });
    updateExpensesTable();
    // Keep income table minimized if it was minimized before
    if (incomeTableMinimized) {
        incomeTable.classList.add('hidden');
    }
    // Optionally, reset form
    // this.reset();
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