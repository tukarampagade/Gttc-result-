let allStudents = [];
let allResults = [];
let allAuditLogs = [];
let allHistory = [];
let studentPage = 1;
let resultPage = 1;
let auditPage = 1;
let historyPage = 1;
const itemsPerPage = 10;

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
    ['dashboard', 'students', 'results', 'history', 'upload', 'audit'].forEach(s => {
        const el = document.getElementById(s + 'Section');
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
    if (section === 'results') loadResults();
    if (section === 'history') loadResultHistory();
    if (section === 'audit') loadAuditLogs();
}

// Student Management
async function loadStudents() {
    try {
        const res = await request('/admin/students');
        allStudents = res.data;
        document.getElementById('studentCountText').innerText = `${allStudents.length} total students`;
        renderStudentTable();
    } catch (err) {
        console.error(err);
    }
}

function filterStudents() {
    studentPage = 1;
    renderStudentTable();
}

function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const deptFilter = document.getElementById('deptFilter').value;
    
    const filtered = allStudents.filter(s => {
        const matchesSearch = s.regNo.toLowerCase().includes(searchTerm) || 
                            s.name.toLowerCase().includes(searchTerm);
        const matchesDept = !deptFilter || s.department === deptFilter;
        return matchesSearch && matchesDept;
    });

    const start = (studentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    tbody.innerHTML = paginated.map(s => `
        <tr>
            <td><code class="fw-bold">${s.regNo}</code></td>
            <td>
                <div class="fw-bold">${s.name}</div>
                <div class="text-muted small">${s.email || ''}</div>
            </td>
            <td>${s.department || '-'}</td>
            <td>${s.semester || '-'}</td>
            <td>${s.dob || '-'}</td>
            <td><span class="badge badge-active">${s.status || 'Active'}</span></td>
            <td>
                <div class="d-flex gap-2">
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

    renderPagination('studentPagination', filtered.length, studentPage, (p) => {
        studentPage = p;
        renderStudentTable();
    });
}

// Result Management
async function loadResults() {
    try {
        const studentsRes = await request('/admin/students');
        const students = studentsRes.data;
        
        const resultsRes = await request('/admin/results');
        allResults = resultsRes.data.map(r => {
            const student = students.find(s => s.regNo === r.regNo);
            return { ...r, studentName: student ? student.name : 'Unknown' };
        });

        document.getElementById('resultCountText').innerText = `${allResults.length} total results`;
        renderResultTable();
    } catch (err) {
        console.error(err);
    }
}

function exportResultsToCSV() {
    if (!allResults || allResults.length === 0) {
        showToast('No results to export', 'warning');
        return;
    }

    const headers = ['Roll No', 'Name', 'Subject 1', 'Subject 2', 'Subject 3', 'Subject 4', 'Subject 5', 'Subject 6', 'Subject 7', 'Subject 8', 'Total', 'Result'];
    const csvRows = [headers.join(',')];

    allResults.forEach(r => {
        const row = [
            r.regNo,
            `"${r.studentName}"`,
            r.subject1,
            r.subject2,
            r.subject3,
            r.subject4,
            r.subject5,
            r.subject6,
            r.subject7,
            r.subject8,
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
    resultPage = 1;
    renderResultTable();
}

function renderResultTable() {
    const tbody = document.getElementById('resultTableBody');
    const searchTerm = document.getElementById('resultSearch').value.toLowerCase();
    
    const filtered = allResults.filter(r => 
        r.regNo.toLowerCase().includes(searchTerm) || 
        r.studentName.toLowerCase().includes(searchTerm)
    );

    const start = (resultPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    tbody.innerHTML = paginated.map(r => {
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
                <td><code class="fw-bold">${r.regNo}</code></td>
                <td><div class="fw-bold">${r.studentName}</div></td>
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

    renderPagination('resultPagination', filtered.length, resultPage, (p) => {
        resultPage = p;
        renderResultTable();
    });
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
                document.getElementById(`res_subject${i}`).value = r[`subject${i}`];
            }
            updateResultLiveDisplay();
        } else {
            document.getElementById('res_semester').value = 3;
            for (let i = 1; i <= 8; i++) {
                document.getElementById(`res_subject${i}`).value = 0;
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
        const val = parseInt(document.getElementById(`res_subject${i}`).value) || 0;
        total += val;
        if (val < 60) fail = true; // Assuming 60 is min marks based on previous view
    }
    
    const statusDisplay = document.getElementById('res_status_display');
    document.getElementById('res_total_display').innerText = total;
    statusDisplay.innerText = fail ? 'FAIL' : 'PASS';
    statusDisplay.className = fail ? 'h4 mb-0 fw-bold text-danger' : 'h4 mb-0 fw-bold text-success';
}

// Add listeners for live updates
for (let i = 1; i <= 8; i++) {
    document.getElementById(`res_subject${i}`)?.addEventListener('input', updateResultLiveDisplay);
}

document.getElementById('editResultForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNo = document.getElementById('editResultRegNo').value;
    const data = { 
        regNo,
        semester: parseInt(document.getElementById('res_semester').value)
    };
    for (let i = 1; i <= 8; i++) {
        data[`subject${i}`] = parseInt(document.getElementById(`res_subject${i}`).value) || 0;
    }

    try {
        await request('/admin/update-result', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        bootstrap.Modal.getInstance(document.getElementById('editResultModal')).hide();
        showToast('Result updated successfully', 'success');
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
            { name: 'EM for AI', code: '24AI31T', marks: r.subject1, max: 120 },
            { name: 'Python Programming', code: '24AI32T', marks: r.subject2, max: 120 },
            { name: 'OOPS with C++', code: '24AI33T', marks: r.subject3, max: 120 },
            { name: 'Intro. to MC & ES', code: '24AI34T', marks: r.subject4, max: 120 },
            { name: 'C++ Lab', code: '24AI35P', marks: r.subject5, max: 120 },
            { name: 'Python Programming Lab', code: '24AI36P', marks: r.subject6, max: 120 },
            { name: 'Microcontroller Lab', code: '24AI37P', marks: r.subject7, max: 120 },
            { name: 'DBMS', code: '24AI38P', marks: r.subject8, max: 120 }
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
                            <th class="text-center">Marks</th>
                            <th class="text-center">Grade</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjects.map(s => {
                            const grade = getGrade(s.marks, s.max);
                            return `
                                <tr>
                                    <td>
                                        <div class="fw-medium">${s.name}</div>
                                        <code class="x-small text-muted">${s.code}</code>
                                    </td>
                                    <td class="text-center"><strong>${s.marks}</strong><span class="text-muted small">/${s.max}</span></td>
                                    <td class="text-center">
                                        <span class="badge rounded-pill ${grade.class}">${grade.label}</span>
                                    </td>
                                    <td class="text-center">
                                        <span class="badge ${s.marks >= 60 ? 'bg-success' : 'bg-danger'}">${s.marks >= 60 ? 'Pass' : 'Fail'}</span>
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
async function loadAuditLogs() {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm text-primary"></div> Loading...</td></tr>';
    
    try {
        const res = await request('/admin/audit-logs');
        allAuditLogs = res.data;
        
        // Apply initial sort
        allAuditLogs.sort((a, b) => {
            let valA = a[auditSortCol];
            let valB = b[auditSortCol];
            if (auditSortCol === 'timestamp') {
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

        renderAuditTable();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${err.message}</td></tr>`;
    }
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

function renderAuditTable() {
    const tbody = document.getElementById('auditTableBody');
    const start = (auditPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = allAuditLogs.slice(start, end);

    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No logs found.</td></tr>';
    } else {
        tbody.innerHTML = paginated.map(log => `
            <tr>
                <td><span class="badge bg-light text-dark border">${log.action}</span></td>
                <td>${log.user}</td>
                <td class="small">${log.details || '-'}</td>
                <td class="text-muted small">${new Date(log.timestamp).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    renderPagination('auditPagination', allAuditLogs.length, auditPage, (p) => {
        auditPage = p;
        renderAuditTable();
    });

    updateSortIcons();
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

    for (let i = 1; i <= totalPages; i++) {
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
    
    // Expose changePage globally for the onclick handlers
    window.changePage = (id, p) => {
        onPageChange(p);
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

async function processUpload(file) {
    const status = document.getElementById('uploadStatus');
    const formData = new FormData();
    formData.append('pdf', file);

    status.innerHTML = '<div class="spinner-border spinner-border-sm text-primary"></div> Processing...';

    try {
        const response = await fetch('/api/admin/upload-pdf', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const res = await response.json();
        if (response.ok) {
            status.innerHTML = `<div class="alert alert-success">Success! Processed ${res.data.count} students.</div>`;
            loadAnalytics();
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        status.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
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
