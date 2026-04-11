let allStudents = [];
let allResults = [];
let allAuditLogs = [];
let allHistory = [];
let studentPage = 1;
let statusPage = 1;
let resultPage = 1;
let auditPage = 1;
let historyPage = 1;
const itemsPerPage = 10;

let studentSortCol = 'regNo';
let studentSortDir = 'asc';
let auditSortCol = 'timestamp';
let auditSortDir = 'desc';

let resultDistChart, gradeDistChart, deptPassChart;

function initCharts() {
    const ctx1 = document.getElementById('resultDistChart')?.getContext('2d');
    if (ctx1) {
        resultDistChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Pass', 'Fail'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '70%'
            }
        });
    }

    const ctx2 = document.getElementById('gradeDistChart')?.getContext('2d');
    if (ctx2) {
        gradeDistChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['A+', 'A', 'B+', 'B', 'C+', 'D', 'F'],
                datasets: [{
                    label: 'Students',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#2563eb',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
            }
        });
    }

    const ctx3 = document.getElementById('deptPassChart')?.getContext('2d');
    if (ctx3) {
        deptPassChart = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Pass Rate (%)',
                    data: [],
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, max: 100, grid: { display: false } }, y: { grid: { display: false } } }
            }
        });
    }
}

async function loadAnalytics() {
    try {
        const res = await request('/admin/analytics');
        const a = res.data;

        document.getElementById('analyticsCards').innerHTML = `
            <div class="col-md-3">
                <div class="card stat-card p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted fw-bold">Total Students</small>
                            <h3 class="fw-bold mb-0">${a.totalStudents}</h3>
                        </div>
                        <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                            <i class="bi bi-people"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted fw-bold">Total Results</small>
                            <h3 class="fw-bold mb-0">${a.totalResults}</h3>
                        </div>
                        <div class="stat-icon bg-info bg-opacity-10 text-info">
                            <i class="bi bi-file-earmark-text"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted fw-bold">Pass Rate</small>
                            <h3 class="fw-bold mb-0">${a.passRate.toFixed(1)}%</h3>
                            <small class="text-success">${a.passed} passed</small>
                        </div>
                        <div class="stat-icon bg-success bg-opacity-10 text-success">
                            <i class="bi bi-graph-up-arrow"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stat-card p-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted fw-bold">Fail Rate</small>
                            <h3 class="fw-bold mb-0">${a.failRate.toFixed(1)}%</h3>
                            <small class="text-danger">${a.failed} failed</small>
                        </div>
                        <div class="stat-icon bg-danger bg-opacity-10 text-danger">
                            <i class="bi bi-mortarboard"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (resultDistChart) {
            resultDistChart.data.datasets[0].data = [a.passed, a.failed];
            resultDistChart.update();
        }

        if (gradeDistChart) {
            gradeDistChart.data.datasets[0].data = Object.values(a.gradeDistribution);
            gradeDistChart.update();
        }

        if (deptPassChart) {
            deptPassChart.data.labels = a.deptPassRates.map(d => d.department);
            deptPassChart.data.datasets[0].data = a.deptPassRates.map(d => d.passRate);
            deptPassChart.update();
        }
    } catch (err) {
        console.error(err);
    }
}

function showSection(section) {
    ['dashboard', 'students', 'status-management', 'results', 'history', 'upload', 'audit', 'settings'].forEach(s => {
        const el = document.getElementById(s === 'status-management' ? 'statusManagementSection' : s + 'Section');
        if (el) el.style.display = s === section ? 'block' : 'none';
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(`'${section}'`)) {
            link.classList.add('active');
        }
    });

    if (section === 'dashboard') loadAnalytics();
    if (section === 'students') loadStudents();
    if (section === 'status-management') loadStatusManagement();
    if (section === 'results') loadResults();
    if (section === 'history') loadResultHistory();
    if (section === 'audit') loadAuditLogs();
    if (section === 'settings') loadThemeSettings();
}

// Student Management
async function loadStudents(page = 1) {
    try {
        const status = document.getElementById('studentStatusFilter')?.value || '';
        const res = await request(`/admin/students?page=${page}&limit=${itemsPerPage}&status=${status}&sort=${studentSortCol}&order=${studentSortDir}`);
        const { data, pagination } = res.data;
        allStudents = data;
        studentPage = pagination.page;
        document.getElementById('studentCountText').innerText = `${pagination.total} total students`;
        renderStudentTable(pagination);
        updateStudentSortIcons();
    } catch (err) {
        console.error(err);
    }
}

function sortStudents(col) {
    if (studentSortCol === col) {
        studentSortDir = studentSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        studentSortCol = col;
        studentSortDir = 'asc';
    }
    loadStudents(1);
}

function updateStudentSortIcons() {
    document.querySelectorAll('#studentsSection th i').forEach(icon => {
        icon.className = 'bi bi-arrow-down-up sort-icon text-muted opacity-50';
    });

    const activeHeader = document.querySelector(`#studentsSection th[onclick*="'${studentSortCol}'"] i`);
    if (activeHeader) {
        activeHeader.className = `bi bi-arrow-${studentSortDir === 'asc' ? 'up' : 'down'} sort-icon text-primary`;
        activeHeader.classList.remove('opacity-50');
    }
}

function filterStudents() {
    loadStudents(1);
}

function renderStudentTable(pagination) {
    const tbody = document.getElementById('studentTableBody');
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const deptFilter = document.getElementById('deptFilter').value;
    
    // Client-side search on the current page (or we could implement server-side search)
    const filtered = allStudents.filter(s => {
        const matchesSearch = s.regNo.toLowerCase().includes(searchTerm) || 
                            s.name.toLowerCase().includes(searchTerm);
        const matchesDept = !deptFilter || s.department === deptFilter;
        return matchesSearch && matchesDept;
    });

    tbody.innerHTML = filtered.map(s => `
        <tr>
            <td><input type="checkbox" class="student-checkbox form-check-input" value="${s.regNo}"></td>
            <td><code class="fw-bold">${s.regNo}</code></td>
            <td>
                <div class="fw-bold">${s.name}</div>
                <div class="text-muted small">${s.email || ''}</div>
            </td>
            <td>${s.department || '-'}</td>
            <td>${s.semester || '-'}</td>
            <td>${s.dob || '-'}</td>
            <td><span class="badge ${s.status === 'Inactive' ? 'badge-fail' : 'badge-active'}">${s.status || 'Active'}</span></td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="getGeminiInsight('${s.regNo}')" title="AI Analysis">
                        <i class="bi bi-sparkles"></i>
                    </button>
                    <button class="btn btn-sm btn-light border" onclick="openEditModal('${s.regNo}', '${s.name}', '${s.email || ''}', '${s.department || ''}', ${s.semester || 1}, '${s.dob || ''}', '${s.status || 'Active'}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-light border text-danger" onclick="openDeleteModal('${s.regNo}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination('studentPagination', pagination.total, pagination.page, (p) => {
        loadStudents(p);
    });
    document.getElementById('selectAllStudents').checked = false;
}

function toggleSelectAllStudents() {
    const isChecked = document.getElementById('selectAllStudents').checked;
    document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = isChecked);
}

async function bulkUpdateStudentStatus(status) {
    const selected = Array.from(document.querySelectorAll('.student-checkbox:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        showToast('Please select at least one student', 'warning');
        return;
    }

    if (!confirm(`Are you sure you want to mark ${selected.length} students as ${status}?`)) return;

    try {
        const res = await request('/admin/bulk-update-status', {
            method: 'POST',
            body: JSON.stringify({ regNos: selected, status })
        });

        if (res.status === 'success') {
            showToast(`Successfully updated ${selected.length} students to ${status}`, 'success');
            loadStudents(studentPage);
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

// Result Management
async function loadResults(page = 1) {
    try {
        const semester = document.getElementById('resSemesterFilter')?.value || '';
        const status = document.getElementById('resStatusFilter')?.value || '';
        const res = await request(`/admin/results?page=${page}&limit=${itemsPerPage}&semester=${semester}&status=${status}`);
        const { data, pagination } = res.data;
        
        allResults = data;
        resultPage = pagination.page;

        document.getElementById('resultCountText').innerText = `${pagination.total} total results`;
        renderResultTable(pagination);
    } catch (err) {
        console.error(err);
    }
}

function exportResultsToCSV() {
    if (!allResults || allResults.length === 0) {
        showToast('No results to export', 'warning');
        return;
    }

    const headers = ['Roll No', 'Name', 'Semester', 'Total', 'Result'];
    const csvRows = [headers.join(',')];

    allResults.forEach(r => {
        const row = [
            r.regNo,
            `"${r.studentName || 'Unknown'}"`,
            r.semester,
            r.total,
            r.result
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GTTC_Results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Results exported successfully', 'success');
}

function exportHistoryToCSV() {
    if (!allHistory || allHistory.length === 0) {
        showToast('No history to export', 'warning');
        return;
    }

    const headers = ['Roll No', 'Action', 'Performed By', 'Details', 'Timestamp'];
    const csvRows = [headers.join(',')];

    allHistory.forEach(log => {
        const regNoMatch = (log.details || '').match(/RegNo:\s*(\w+)/);
        const regNo = regNoMatch ? regNoMatch[1] : (log.action === 'RESULT_VIEW' ? log.user : '-');
        
        const row = [
            regNo,
            log.action,
            `"${log.user}"`,
            `"${(log.details || '').replace(/"/g, '""')}"`,
            `"${new Date(log.timestamp).toLocaleString()}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Result_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('History exported successfully', 'success');
}

function filterResults() {
    loadResults(1);
}

function renderResultTable(pagination) {
    const tbody = document.getElementById('resultTableBody');
    const searchTerm = document.getElementById('resultSearch').value.toLowerCase();
    
    const filtered = allResults.filter(r => 
        r.regNo.toLowerCase().includes(searchTerm) || 
        (r.studentName && r.studentName.toLowerCase().includes(searchTerm))
    );

    // Reset select all checkbox
    const selectAll = document.getElementById('selectAllResults');
    if (selectAll) selectAll.checked = false;
    updateResultSelection();

    tbody.innerHTML = filtered.map(r => {
        const p = (r.total / 960) * 100;
        let grade = 'F';
        if (p >= 90) grade = 'A+';
        else if (p >= 80) grade = 'A';
        else if (p >= 70) grade = 'B+';
        else if (p >= 60) grade = 'B';
        else if (p >= 50) grade = 'C+';
        else if (p >= 40) grade = 'D';

        return `
            <tr>
                <td>
                    <input type="checkbox" class="form-check-input result-checkbox" value="${r.regNo}" data-semester="${r.semester || 3}" onclick="updateResultSelection()">
                </td>
                <td><code class="fw-bold">${r.regNo}</code></td>
                <td><div class="fw-bold">${r.studentName || 'Unknown'}</div></td>
                <td>${r.semester || 3}${getOrdinal(r.semester || 3)} Sem</td>
                <td><span class="fw-bold">${r.total}</span>/960</td>
                <td><span class="badge bg-primary">${grade}</span></td>
                <td><span class="badge badge-${r.result.toLowerCase()}">${r.result}</span></td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-light border" onclick="viewStudentResult('${r.regNo}', ${r.semester || 3})" title="View">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-light border" onclick="openEditResultModal('${r.regNo}', ${r.semester || 3})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination('resultPagination', pagination.total, pagination.page, (p) => {
        loadResults(p);
    });
}

function toggleSelectAllResults() {
    const selectAll = document.getElementById('selectAllResults');
    const checkboxes = document.querySelectorAll('.result-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
    updateResultSelection();
}

function updateResultSelection() {
    const checkboxes = document.querySelectorAll('.result-checkbox:checked');
    const bulkActions = document.getElementById('resultBulkActions');
    const countText = document.getElementById('selectedResultsCount');
    
    if (bulkActions && countText) {
        if (checkboxes.length > 0) {
            bulkActions.style.setProperty('display', 'flex', 'important');
            countText.innerText = `${checkboxes.length} selected`;
        } else {
            bulkActions.style.setProperty('display', 'none', 'important');
        }
    }
}

async function bulkDeleteResults() {
    const checkboxes = document.querySelectorAll('.result-checkbox:checked');
    const selected = Array.from(checkboxes).map(cb => ({
        regNo: cb.value,
        semester: parseInt(cb.getAttribute('data-semester'))
    }));
    
    if (selected.length === 0) return;

    // We need to group by semester because our bulk delete API takes one semester at a time
    // Or we can modify the API to handle multiple semesters.
    // For simplicity, let's check if all selected are for the same semester.
    const semesters = [...new Set(selected.map(s => s.semester))];
    
    if (semesters.length > 1) {
        showToast('Please select results from the same semester for bulk deletion.', 'warning');
        return;
    }

    const semester = semesters[0];
    const regNos = selected.map(s => s.regNo);

    showConfirm(
        'Bulk Delete Results',
        `Are you sure you want to delete results for ${regNos.length} students in Semester ${semester}? This action cannot be undone.`,
        async () => {
            try {
                const res = await request('/admin/bulk-delete-results', {
                    method: 'POST',
                    body: JSON.stringify({ regNos, semester })
                });
                
                if (res.status === 'success') {
                    showToast(`Successfully deleted ${regNos.length} results.`, 'success');
                    loadResults(resultPage);
                } else {
                    throw new Error(res.message);
                }
            } catch (err) {
                showToast(err.message, 'danger');
            }
        }
    );
}

function openEditModal(regNo, name, email, department, semester, dob, status) {
    document.getElementById('editRegNoHidden').value = regNo;
    document.getElementById('editRegNo').value = regNo;
    document.getElementById('editName').value = name;
    document.getElementById('editEmail').value = email || '';
    document.getElementById('editDepartment').value = department || 'Artificial Intelligence';
    document.getElementById('editSemester').value = semester || 1;
    document.getElementById('editDob').value = dob || '';
    document.getElementById('editStatus').value = status || 'Active';
    
    const modal = new bootstrap.Modal(document.getElementById('editStudentModal'));
    modal.show();
}

document.getElementById('addStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        regNo: document.getElementById('newRegNo').value,
        name: document.getElementById('newName').value,
        email: document.getElementById('newEmail').value,
        department: document.getElementById('newDepartment').value,
        semester: parseInt(document.getElementById('newSemester').value),
        dob: document.getElementById('newDob').value,
        status: document.getElementById('newStatus').value
    };

    try {
        await request('/admin/add-student', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
        loadStudents();
        loadAnalytics();
        showToast('Student added successfully', 'success');
        e.target.reset();
    } catch (err) {
        showToast(err.message, 'danger');
    }
});

document.getElementById('editStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        regNo: document.getElementById('editRegNoHidden').value,
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        department: document.getElementById('editDepartment').value,
        semester: parseInt(document.getElementById('editSemester').value),
        dob: document.getElementById('editDob').value,
        status: document.getElementById('editStatus').value
    };

    try {
        await request('/admin/update-student', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        bootstrap.Modal.getInstance(document.getElementById('editStudentModal')).hide();
        loadStudents();
        showToast('Student updated successfully', 'success');
    } catch (err) {
        showToast(err.message, 'danger');
    }
});

async function openEditResultModal(regNo, semester) {
    document.getElementById('editResultRegNo').value = regNo;
    try {
        const endpoint = semester ? `/admin/result/${regNo}?semester=${semester}` : `/admin/result/${regNo}`;
        const res = await request(endpoint);
        const r = res.data;
        
        if (r) {
            document.getElementById('res_semester').value = r.semester || semester || 3;
            for (let i = 1; i <= 8; i++) {
                document.getElementById(`res_subject${i}_ia`).value = r[`subject${i}_ia`] || 0;
                document.getElementById(`res_subject${i}_e`).value = r[`subject${i}_e`] || 0;
            }
            updateResultLiveDisplay();
        } else {
            document.getElementById('res_semester').value = 3;
            for (let i = 1; i <= 8; i++) {
                document.getElementById(`res_subject${i}_ia`).value = 0;
                document.getElementById(`res_subject${i}_e`).value = 0;
            }
            updateResultLiveDisplay();
        }
        new bootstrap.Modal(document.getElementById('editResultModal')).show();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

function updateResultLiveDisplay() {
    let total = 0;
    let fail = false;
    for (let i = 1; i <= 8; i++) {
        const ia = parseInt(document.getElementById(`res_subject${i}_ia`).value) || 0;
        const e = parseInt(document.getElementById(`res_subject${i}_e`).value) || 0;
        const subTotal = ia + e;
        total += subTotal;
        if (ia < 35 || e < 25 || subTotal < 60) fail = true;
    }
    
    const statusDisplay = document.getElementById('res_status_display');
    document.getElementById('res_total_display').innerText = total;
    statusDisplay.innerText = fail ? 'FAIL' : 'PASS';
    statusDisplay.className = fail ? 'h4 mb-0 fw-bold text-danger' : 'h4 mb-0 fw-bold text-success';
}

// Add listeners for live updates
for (let i = 1; i <= 8; i++) {
    document.getElementById(`res_subject${i}_ia`)?.addEventListener('input', updateResultLiveDisplay);
    document.getElementById(`res_subject${i}_e`)?.addEventListener('input', updateResultLiveDisplay);
}

document.getElementById('editResultForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNo = document.getElementById('editResultRegNo').value;
    const data = { 
        regNo,
        semester: parseInt(document.getElementById('res_semester').value)
    };
    for (let i = 1; i <= 8; i++) {
        data[`subject${i}_ia`] = parseInt(document.getElementById(`res_subject${i}_ia`).value) || 0;
        data[`subject${i}_e`] = parseInt(document.getElementById(`res_subject${i}_e`).value) || 0;
    }

    try {
        await request('/admin/update-result', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        bootstrap.Modal.getInstance(document.getElementById('editResultModal')).hide();
        showToast('Result updated successfully', 'success');
        loadResults(resultPage);
        loadAnalytics();
    } catch (err) {
        showToast(err.message, 'danger');
    }
});

let studentToDelete = null;
function openDeleteModal(regNo) {
    studentToDelete = regNo;
    document.getElementById('deleteRegNoText').innerText = regNo;
    new bootstrap.Modal(document.getElementById('deleteConfirmModal')).show();
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!studentToDelete) return;
    try {
        await request(`/admin/delete-student/${studentToDelete}`, {
            method: 'DELETE'
        });
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
        loadStudents();
        loadAnalytics();
        showToast('Student deleted successfully', 'success');
    } catch (err) {
        showToast(err.message, 'danger');
    }
});

async function viewStudentResult(regNo, semester) {
    const content = document.getElementById('modalResultContent');
    content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    new bootstrap.Modal(document.getElementById('viewResultModal')).show();

    try {
        const endpoint = semester ? `/admin/result/${regNo}?semester=${semester}` : `/admin/result/${regNo}`;
        const res = await request(endpoint);
        const r = res.data;

        if (!r) {
            content.innerHTML = '<div class="alert alert-warning">No result found for this student.</div>';
            return;
        }

        const subjects = [
            { name: 'Advanced Math for AI', code: '24AI41T', ia: r.subject1_ia, e: r.subject1_e, marks: r.subject1_t, max: 120 },
            { name: 'Data Warehousing', code: '24AI42T', ia: r.subject2_ia, e: r.subject2_e, marks: r.subject2_t, max: 120 },
            { name: 'Machine Learning', code: '24AI43T', ia: r.subject3_ia, e: r.subject3_e, marks: r.subject3_t, max: 120 },
            { name: 'Deep Learning', code: '24AI44T', ia: r.subject4_ia, e: r.subject4_e, marks: r.subject4_t, max: 120 },
            { name: 'ML Lab', code: '24AI45P', ia: r.subject5_ia, e: r.subject5_e, marks: r.subject5_t, max: 120 },
            { name: 'Data Science Lab', code: '24AI46P', ia: r.subject6_ia, e: r.subject6_e, marks: r.subject6_t, max: 120 },
            { name: 'Deep Learning Lab', code: '24AI47P', ia: r.subject7_ia, e: r.subject7_e, marks: r.subject7_t, max: 120 },
            { name: 'Mini Project', code: '24AI48P', ia: r.subject8_ia, e: r.subject8_e, marks: r.subject8_t, max: 120 }
        ];

        const getGrade = (marks, max) => {
            const p = (marks / max) * 100;
            if (p >= 90) return { label: 'A+', class: 'bg-success-subtle text-success' };
            if (p >= 80) return { label: 'A', class: 'bg-success-subtle text-success' };
            if (p >= 70) return { label: 'B+', class: 'bg-primary-subtle text-primary' };
            if (p >= 60) return { label: 'B', class: 'bg-info-subtle text-info' };
            return { label: 'F', class: 'bg-danger-subtle text-danger' };
        };

        const percentage = ((r.total / 960) * 100).toFixed(2);

        content.innerHTML = `
            <div class="bg-light rounded-4 p-4 mb-4">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <p class="text-uppercase small fw-bold text-muted mb-1">Student Details</p>
                        <h4 class="fw-bold mb-1">${r.name}</h4>
                        <div class="text-muted small">Roll: <strong>${r.regNo}</strong> | Sem: <strong>${r.semester}${getOrdinal(r.semester)}</strong></div>
                    </div>
                    <div class="col-md-4 text-md-end mt-3 mt-md-0">
                        <div class="h2 fw-bold text-primary mb-0">${percentage}%</div>
                        <div class="text-muted small text-uppercase fw-bold">Percentage</div>
                    </div>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Subject</th>
                            <th class="text-center">IA</th>
                            <th class="text-center">Exam</th>
                            <th class="text-center">Total</th>
                            <th class="text-center">Grade</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjects.map(s => {
                            const grade = getGrade(s.marks, s.max);
                            const isPass = s.ia >= 35 && s.e >= 25 && s.marks >= 60;
                            return `
                                <tr>
                                    <td>
                                        <div class="fw-medium">${s.name}</div>
                                        <code class="x-small text-muted">${s.code}</code>
                                    </td>
                                    <td class="text-center">${s.ia}</td>
                                    <td class="text-center">${s.e}</td>
                                    <td class="text-center"><strong>${s.marks}</strong><span class="text-muted small">/${s.max}</span></td>
                                    <td class="text-center">
                                        <span class="badge rounded-pill ${grade.class}">${grade.label}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge ${isPass ? 'bg-success' : 'bg-danger'}">${isPass ? 'Pass' : 'Fail'}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot class="table-light">
                        <tr class="fw-bold">
                            <td>GRAND TOTAL</td>
                            <td class="text-center text-primary h5 mb-0">${r.total}</td>
                            <td colspan="2" class="text-center">
                                <span class="badge ${r.result === 'PASS' ? 'bg-success' : 'bg-danger'} px-3">
                                    FINAL: ${r.result}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    } catch (err) {
        content.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
}

// Audit Logs
async function loadAuditLogs(page = 1) {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div> Loading audit logs...</td></tr>';
    
    try {
        const res = await request(`/admin/audit-logs?page=${page}&limit=${itemsPerPage}`);
        const { data, pagination } = res.data;
        allAuditLogs = data;
        auditPage = pagination.page;
        renderAuditTable(pagination);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">Error: ${err.message}</td></tr>`;
    }
}

function renderAuditTable(pagination) {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    const total = pagination ? pagination.total : allAuditLogs.length;
    const page = pagination ? pagination.page : auditPage;

    if (allAuditLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No audit logs found.</td></tr>';
    } else {
        tbody.innerHTML = allAuditLogs.map(log => {
            let detailsHtml = '-';
            let actionBadgeClass = 'bg-light text-dark';
            
            // Determine badge color based on action
            const actionType = log.action.split(':')[0];
            if (actionType.includes('ADD')) actionBadgeClass = 'bg-success-subtle text-success border-success-subtle';
            else if (actionType.includes('UPDATE')) actionBadgeClass = 'bg-primary-subtle text-primary border-primary-subtle';
            else if (actionType.includes('DELETE')) actionBadgeClass = 'bg-danger-subtle text-danger border-danger-subtle';
            else if (actionType.includes('LOGIN')) actionBadgeClass = 'bg-info-subtle text-info border-info-subtle';
            else if (actionType.includes('UPLOAD')) actionBadgeClass = 'bg-warning-subtle text-warning border-warning-subtle';
            else if (actionType.includes('BULK')) actionBadgeClass = 'bg-purple-subtle text-purple border-purple-subtle';

            if (log.details) {
                if (log.details.includes('Updated fields:')) {
                    const fields = log.details.replace('Updated fields: ', '').split(', ');
                    detailsHtml = `<div class="d-flex flex-wrap gap-1">
                        ${fields.map(f => `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 small" style="font-size: 0.7rem; font-weight: 500;">${f}</span>`).join('')}
                    </div>`;
                } else if (log.details.includes('Updated status to')) {
                    const parts = log.details.split(': ');
                    const statusInfo = parts[0];
                    const students = parts[1] ? parts[1].split(', ') : [];
                    detailsHtml = `<div>
                        <div class="fw-bold small mb-1 text-primary">${statusInfo}</div>
                        <div class="d-flex flex-wrap gap-1">
                            ${students.slice(0, 8).map(s => `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 small" style="font-size: 0.65rem;">${s}</span>`).join('')}
                            ${students.length > 8 ? `<span class="text-muted small" style="font-size: 0.65rem;">+${students.length - 8} more</span>` : ''}
                        </div>
                    </div>`;
                } else if (log.details.includes('Added student') || log.details.includes('Deleted student')) {
                    const isAdd = log.details.includes('Added');
                    detailsHtml = `<div class="small ${isAdd ? 'text-success' : 'text-danger'} d-flex align-items-center gap-1">
                        <i class="bi ${isAdd ? 'bi-plus-circle' : 'bi-trash'}"></i>
                        <span>${log.details}</span>
                    </div>`;
                } else if (log.details.includes('Updated theme color')) {
                    const colorMatch = log.details.match(/#[0-9a-fA-F]{6}/);
                    const color = colorMatch ? colorMatch[0] : null;
                    detailsHtml = `
                        <div class="d-flex align-items-center gap-2">
                            <span class="text-muted small">${log.details}</span>
                            ${color ? `<div style="width: 14px; height: 14px; background: ${color}; border-radius: 3px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></div>` : ''}
                        </div>
                    `;
                } else {
                    detailsHtml = `<span class="text-muted small">${log.details}</span>`;
                }
            }

            return `
                <tr>
                    <td>
                        <div class="d-flex flex-column">
                            <span class="badge ${actionBadgeClass} border mb-1" style="width: fit-content; font-size: 0.7rem;">${log.action.split(': ')[0]}</span>
                            ${log.action.includes(': ') ? `<span class="text-muted font-monospace" style="font-size: 0.7rem;">ID: ${log.action.split(': ')[1]}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="bg-light rounded-circle d-flex align-items-center justify-content-center border" style="width: 28px; height: 28px;">
                                <i class="bi bi-person text-secondary small"></i>
                            </div>
                            <div class="fw-medium small text-slate-700">${log.user}</div>
                        </div>
                    </td>
                    <td>${detailsHtml}</td>
                    <td>
                        <div class="text-muted small">
                            <div class="fw-medium text-slate-600">${new Date(log.timestamp).toLocaleDateString()}</div>
                            <div style="font-size: 0.7rem; opacity: 0.8;">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPagination('auditPagination', total, page, (p) => {
        loadAuditLogs(p);
    });

    updateSortIcons();
}

// Result History
async function loadResultHistory() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</td></tr>';
    
    try {
        const res = await request('/admin/audit-logs');
        // Filter for result related actions
        allHistory = res.data.filter(log => 
            log.action === 'ADD_RESULT' || 
            log.action === 'UPDATE_RESULT' || 
            log.action === 'RESULT_VIEW'
        );
        
        // Sort by timestamp descending
        allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        renderHistoryTable();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${err.message}</td></tr>`;
    }
}

function filterHistory() {
    historyPage = 1;
    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    
    const filtered = allHistory.filter(log => {
        const regNoMatch = (log.details || '').toLowerCase().includes(searchTerm);
        const userMatch = (log.user || '').toLowerCase().includes(searchTerm);
        const actionMatch = (log.action || '').toLowerCase().includes(searchTerm);
        return regNoMatch || userMatch || actionMatch;
    });

    const start = (historyPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    tbody.innerHTML = paginated.map(log => {
        // Extract RegNo from details if possible (e.g., "RegNo: 8080142, ...")
        const regNoMatch = (log.details || '').match(/RegNo:\s*(\w+)/);
        const regNo = regNoMatch ? regNoMatch[1] : (log.action === 'RESULT_VIEW' ? log.user : '-');
        
        let actionBadge = 'bg-secondary';
        if (log.action === 'ADD_RESULT') actionBadge = 'bg-success';
        if (log.action === 'UPDATE_RESULT') actionBadge = 'bg-warning text-dark';
        if (log.action === 'RESULT_VIEW') actionBadge = 'bg-info text-dark';

        return `
            <tr>
                <td><code class="fw-bold">${regNo}</code></td>
                <td><span class="badge ${actionBadge}">${log.action}</span></td>
                <td><div class="fw-medium">${log.user}</div></td>
                <td><small class="text-muted">${log.details || '-'}</small></td>
                <td><small>${new Date(log.timestamp).toLocaleString()}</small></td>
            </tr>
        `;
    }).join('');

    renderPagination('historyPagination', filtered.length, historyPage, (p) => {
        historyPage = p;
        renderHistoryTable();
    });
}

// Pagination Helper
function renderPagination(elementId, totalItems, currentPage, onPageChange) {
    const container = document.getElementById(elementId);
    if (!container) return;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); window.changePage('${elementId}', ${currentPage - 1})">Previous</a>
        </li>
    `;

    // Show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="event.preventDefault(); window.changePage('${elementId}', ${i})">${i}</a>
            </li>
        `;
    }

    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="event.preventDefault(); window.changePage('${elementId}', ${currentPage + 1})">Next</a>
        </li>
    `;

    container.innerHTML = html;
    
    // Use a unique property for each pagination instance to avoid conflicts
    if (!window.paginationHandlers) window.paginationHandlers = {};
    window.paginationHandlers[elementId] = onPageChange;
    
    window.changePage = (id, p) => {
        if (window.paginationHandlers[id]) {
            window.paginationHandlers[id](p);
        }
    };
}

function sortAudit(col) {
    if (auditSortCol === col) {
        auditSortDir = auditSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        auditSortCol = col;
        auditSortDir = 'asc';
    }

    allAuditLogs.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];

        if (col === 'timestamp') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else {
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
        }

        if (valA < valB) return auditSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return auditSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    auditPage = 1;
    renderAuditTable();
}

function updateSortIcons() {
    document.querySelectorAll('#auditTable th i').forEach(icon => {
        icon.className = 'bi bi-arrow-down-up sort-icon text-muted opacity-50';
    });

    const activeHeader = document.querySelector(`#auditTable th[onclick*="'${auditSortCol}'"] i`);
    if (activeHeader) {
        activeHeader.className = `bi bi-arrow-${auditSortDir === 'asc' ? 'up' : 'down'} sort-icon text-primary`;
        activeHeader.classList.remove('opacity-50');
    }
}

document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    
    if (file.size > 2 * 1024 * 1024) { // 2MB
        showConfirm('Large File Upload', `The file "${file.name}" is quite large (${(file.size / 1024 / 1024).toFixed(2)} MB). Processing might take a moment. Do you want to continue?`, async () => {
            await processUpload(file);
        });
    } else {
        await processUpload(file);
    }
});

async function uploadCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const status = document.getElementById('csvUploadStatus');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a CSV file', 'warning');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showToast('Please select a valid CSV file', 'danger');
        return;
    }

    await processUpload(file, status);
}

async function uploadPDF() {
    const fileInput = document.getElementById('pdfFileInput');
    const status = document.getElementById('pdfUploadStatus');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select a document file', 'warning');
        return;
    }
    
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'pptx'].includes(ext)) {
        showToast('Please select a valid PDF, Word, or PowerPoint file', 'danger');
        return;
    }

    await processUpload(file, status);
}

async function processUpload(file, statusElement) {
    const formData = new FormData();
    const filename = file.name.toLowerCase();
    const isCsv = filename.endsWith('.csv');
    const endpoint = isCsv ? '/api/admin/upload-csv' : '/api/admin/upload-pdf';
    const fieldName = isCsv ? 'csv' : 'pdf';
    
    formData.append(fieldName, file);

    statusElement.innerHTML = '<div class="spinner-border spinner-border-sm text-primary"></div> Processing...';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const res = await response.json();
        if (response.ok) {
            const count = res.data.count !== undefined ? res.data.count : (res.data.length || 0);
            statusElement.innerHTML = `<div class="alert alert-success">Success! Processed ${count} records.</div>`;
            loadAnalytics();
            showToast(`Successfully processed ${count} records from ${file.name}`, 'success');
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        statusElement.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        showToast(err.message, 'danger');
    }
}

function downloadSampleCSV() {
    const headers = ['regNo', 'name', 'semester', 'sub1_ia', 'sub1_e', 'sub2_ia', 'sub2_e', 'sub3_ia', 'sub3_e', 'sub4_ia', 'sub4_e', 'sub5_ia', 'sub5_e', 'sub6_ia', 'sub6_e', 'sub7_ia', 'sub7_e', 'sub8_ia', 'sub8_e'];
    const sampleData = ['8080142', 'Tukaram Pagade', '3', '40', '50', '40', '50', '40', '50', '40', '50', '40', '50', '40', '50', '40', '50', '40', '50'];
    
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "GTTC_Sample_Results.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Modal Helpers
function showConfirm(title, message, onConfirm) {
    document.getElementById('genericConfirmTitle').innerText = title;
    document.getElementById('genericConfirmMessage').innerText = message;
    const btn = document.getElementById('genericConfirmBtn');
    
    // Remove old listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
        onConfirm();
        bootstrap.Modal.getInstance(document.getElementById('genericConfirmModal')).hide();
    });
    
    new bootstrap.Modal(document.getElementById('genericConfirmModal')).show();
}

function showToast(message, type = 'primary') {
    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    toastContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show shadow" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.appendChild(toastContainer);
    setTimeout(() => toastContainer.remove(), 3000);
}

async function loadThemeSettings() {
    try {
        const res = await fetch('/api/theme/color');
        const data = await res.json();
        if (data.status === 'success' && data.data) {
            const color = data.data;
            const picker = document.getElementById('themeColorPicker');
            const hexText = document.getElementById('themeColorHex');
            if (picker) picker.value = color;
            if (hexText) hexText.innerText = color;
        }
    } catch (err) {
        console.error('Failed to load theme settings:', err);
    }
}

async function saveThemeColor() {
    const color = document.getElementById('themeColorPicker').value;
    const btn = document.getElementById('saveThemeBtn');
    const originalText = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
        
        const res = await request('/admin/update-theme', {
            method: 'POST',
            body: JSON.stringify({ color })
        });
        
        if (res.status === 'success') {
            showToast('Theme color updated successfully!', 'success');
            // Apply theme immediately
            if (typeof applyTheme === 'function') applyTheme();
            document.getElementById('themeColorHex').innerText = color;
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        showToast(err.message, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function getGeminiInsight(regNo) {
    const modal = new bootstrap.Modal(document.getElementById('geminiInsightModal'));
    const content = document.getElementById('geminiInsightContent');
    content.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3"></div>
            <p class="text-muted">Gemini is analyzing student performance for ${regNo}...</p>
        </div>
    `;
    modal.show();

    try {
        const res = await request(`/admin/analyze-student/${regNo}`);
        if (res.status !== 'success') throw new Error(res.message);
        
        content.innerHTML = `
            <div class="gemini-analysis">
                ${res.data}
            </div>
            <div class="mt-4 p-3 bg-light rounded small text-muted">
                <i class="bi bi-info-circle me-1"></i> This analysis is generated by AI and should be used as a reference only.
            </div>
        `;

    } catch (err) {
        console.error(err);
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i> Error generating insight: ${err.message}
            </div>
        `;
    }
}

// Add event listener for live hex update
document.getElementById('themeColorPicker')?.addEventListener('input', (e) => {
    document.getElementById('themeColorHex').innerText = e.target.value;
});

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

if (window.location.pathname.includes('panel.html')) {
    if (checkAdminAuth()) {
        initCharts();
        showSection('dashboard');
    }
}
