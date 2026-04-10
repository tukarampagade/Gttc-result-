async function loadResult(specificSemester) {
    console.log('loadResult called with:', specificSemester);
    const resultContent = document.getElementById('resultContent');
    if (!resultContent) return;

    // Show loading spinner
    resultContent.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900"></div>
        </div>
    `;

    try {
        const endpoint = specificSemester ? `/result/get?semester=${specificSemester}` : '/result/get';
        console.log('Fetching result from:', endpoint);
        const res = await request(endpoint);
        console.log('Result response received:', res);
        
        if (!res || !res.data) {
            throw new Error('No result data found for this semester.');
        }
        
        const r = res.data;
        const semester = specificSemester ? `${specificSemester}${getOrdinal(specificSemester)} Semester` : (localStorage.getItem('selectedSemester') || '3rd Semester');

        const subjects = [
            { name: 'EM for AI', code: '24AI31T', ia: r.subject1_ia, e: r.subject1_e, marks: r.subject1_t, max: 120 },
            { name: 'Python Programming', code: '24AI32T', ia: r.subject2_ia, e: r.subject2_e, marks: r.subject2_t, max: 120 },
            { name: 'OOPS with C++', code: '24AI33T', ia: r.subject3_ia, e: r.subject3_e, marks: r.subject3_t, max: 120 },
            { name: 'Intro. to MC & ES', code: '24AI34T', ia: r.subject4_ia, e: r.subject4_e, marks: r.subject4_t, max: 120 },
            { name: 'C++ Lab', code: '24AI35P', ia: r.subject5_ia, e: r.subject5_e, marks: r.subject5_t, max: 120 },
            { name: 'Python Programming Lab', code: '24AI36P', ia: r.subject6_ia, e: r.subject6_e, marks: r.subject6_t, max: 120 },
            { name: 'Microcontroller Lab', code: '24AI37P', ia: r.subject7_ia, e: r.subject7_e, marks: r.subject7_t, max: 120 },
            { name: 'DBMS', code: '24AI38P', ia: r.subject8_ia, e: r.subject8_e, marks: r.subject8_t, max: 120 }
        ];

        const getGrade = (marks, max) => {
            const p = (marks / max) * 100;
            if (p >= 90) return { label: 'A+', class: 'bg-success-subtle text-success' };
            if (p >= 80) return { label: 'A', class: 'bg-success-subtle text-success' };
            if (p >= 70) return { label: 'B+', class: 'bg-primary-subtle text-primary' };
            if (p >= 60) return { label: 'B', class: 'bg-info-subtle text-info' };
            return { label: 'F', class: 'bg-danger-subtle text-danger' };
        };

        const passedCount = subjects.filter(s => s.ia >= 35 && s.e >= 25 && s.marks >= 60).length;
        const failedCount = subjects.length - passedCount;
        const percentage = ((r.total / 960) * 100).toFixed(2);
        const rank = r.rank || '-';

        resultContent.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                <div class="p-6 sm:p-10">
                    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                        <div class="flex-grow">
                            <p class="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Student Details</p>
                            <h2 class="text-slate-900 text-3xl sm:text-4xl font-black tracking-tight mb-3">${r.name.toUpperCase()}</h2>
                            <div class="flex flex-wrap gap-y-2 gap-x-6 text-slate-600 text-sm font-medium">
                                <span class="flex items-center gap-2">Roll: <b class="text-slate-900">${r.regNo}</b></span>
                                <span class="flex items-center gap-2">Dept: <b class="text-slate-900">${r.department || 'Artificial Intelligence & Machine Learning'}</b></span>
                                <span class="flex items-center gap-2">Sem: <b class="text-slate-900">${semester.split(' ')[0]}</b></span>
                            </div>
                        </div>
                        <div class="flex items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full lg:w-auto">
                            <div class="text-center">
                                <div class="text-slate-900 text-4xl font-black leading-none">${percentage}%</div>
                                <div class="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">Percentage</div>
                            </div>
                            <div class="h-10 w-[1px] bg-slate-200"></div>
                            <div class="flex flex-col items-center gap-2">
                                <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                    <i class="bi ${r.result === 'PASS' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} mr-1"></i>
                                    ${r.result}ED
                                </span>
                                <div class="text-slate-900 font-bold text-sm">Rank: #${rank}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
                            <div class="text-slate-900 text-2xl font-black mb-1">${subjects.length}</div>
                            <div class="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Total Subjects</div>
                        </div>
                        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
                            <div class="text-emerald-600 text-2xl font-black mb-1">${passedCount}</div>
                            <div class="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Passed</div>
                        </div>
                        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
                            <div class="text-rose-600 text-2xl font-black mb-1">${failedCount}</div>
                            <div class="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Failed</div>
                        </div>
                        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
                            <div class="text-indigo-600 text-2xl font-black mb-1">${r.total}/960</div>
                            <div class="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Total Marks</div>
                        </div>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-slate-900 font-bold text-lg mb-4">Subject-wise Results</h3>
                        <div class="overflow-hidden rounded-2xl border border-slate-200">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">#</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Code</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">IA</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Exam</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Total</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Grade</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${subjects.map((s, i) => {
                                        const grade = getGrade(s.marks, s.max);
                                        return `
                                            <tr class="hover:bg-slate-50/50 transition-colors">
                                                <td class="px-6 py-4 text-sm text-slate-400 font-medium">${i + 1}</td>
                                                <td class="px-6 py-4 text-sm text-slate-900 font-bold">${s.name}</td>
                                                <td class="px-6 py-4 text-xs text-slate-500 font-mono">${s.code}</td>
                                                <td class="px-6 py-4 text-sm text-center font-medium text-slate-600">${s.ia}</td>
                                                <td class="px-6 py-4 text-sm text-center font-medium text-slate-600">${s.e}</td>
                                                <td class="px-6 py-4 text-sm text-center font-black text-slate-900">${s.marks}<span class="text-slate-400 font-medium ml-1">/${s.max}</span></td>
                                                <td class="px-6 py-4 text-center">
                                                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${grade.class.replace('bg-', 'bg-opacity-20 bg-')}">${grade.label}</span>
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.ia >= 35 && s.e >= 25 && s.marks >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                                        ${s.ia >= 35 && s.e >= 25 && s.marks >= 60 ? 'Pass' : 'Fail'}
                                                    </span>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row justify-between items-center gap-6 mt-12 pt-8 border-t border-slate-100">
                        <div class="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                            <p class="mb-1">System Generated Provisional Sheet</p>
                            <p>Issued on: ${new Date().toLocaleDateString()}</p>
                        </div>
                        <button onclick="window.print()" class="no-print flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                            <i class="bi bi-printer-fill"></i>
                            <span>Print Official Result</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Load history after current result is loaded
        if (!specificSemester) loadHistory();
    } catch (err) {
        resultContent.innerHTML = `
            <div class="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl flex items-center gap-4">
                <i class="bi bi-exclamation-circle-fill text-xl"></i>
                <p class="font-semibold">${err.message}</p>
            </div>
        `;
    }
}

async function loadHistory() {
    console.log('loadHistory called');
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    
    try {
        console.log('Fetching history...');
        const res = await request('/result/history');
        console.log('History response received:', res);
        const history = res.data.history;

        if (!history || history.length <= 1) {
            historyContent.innerHTML = '';
            return;
        }

        historyContent.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                <div class="p-6 sm:p-10">
                    <h4 class="text-slate-900 font-black text-xl mb-6 flex items-center gap-3">
                        <i class="bi bi-clock-history text-indigo-600"></i>
                        Historical Results
                    </h4>
                    <div class="overflow-hidden rounded-2xl border border-slate-200">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Semester</th>
                                    <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Total Marks</th>
                                    <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Percentage</th>
                                    <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${history.map(h => `
                                    <tr class="hover:bg-slate-50/50 transition-colors">
                                        <td class="px-6 py-4 text-sm text-slate-900 font-bold">${h.semester}${getOrdinal(h.semester)} Semester</td>
                                        <td class="px-6 py-4 text-sm text-center font-black text-slate-900">${h.total}</td>
                                        <td class="px-6 py-4 text-sm text-center font-black text-slate-900">${((h.total / 960) * 100).toFixed(2)}%</td>
                                        <td class="px-6 py-4 text-center">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${h.result === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                                ${h.result}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-end">
                                            <button onclick="loadResult(${h.semester})" class="text-indigo-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-800 transition-colors">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Failed to load history:', err);
    }
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
}

function checkStudentAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

if (window.location.pathname.includes('result.html')) {
    if (checkStudentAuth()) {
        loadResult();
    }
}
