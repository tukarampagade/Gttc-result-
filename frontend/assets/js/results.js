function getSubjectsBySemester(semester) {
    if (semester == 2) {
        return [
            { name: 'AS', code: '24AI21I', max: 120 },
            { name: 'DS&Algorithm', code: '24AI22T', max: 120 },
            { name: 'DE', code: '24AI23T', max: 120 },
            { name: 'ECS', code: '24AI24P', max: 120 },
            { name: 'DS&AI Lab', code: '24AI25P', max: 120 },
            { name: 'DE Lab', code: '24AI26P', max: 120 },
            { name: 'Engg. Desgin', code: '24AI27P', max: 120 },
            { name: 'BK-II', code: '24AI17A', max: 70 }
        ];
    }
    return [
        { name: 'EM for AI', code: '24AI31T', max: 120 },
        { name: 'PY. Programming', code: '24AI32T', max: 120 },
        { name: 'OOPS with C++', code: '24AI33T', max: 120 },
        { name: 'Intro. to MC & ES', code: '24AI34T', max: 120 },
        { name: 'C++ Lab', code: '24AI35P', max: 120 },
        { name: 'PY. Programming Lab', code: '24AI36P', max: 120 },
        { name: 'Microcontroller Lab', code: '24AI37P', max: 120 },
        { name: 'DBMS', code: '24AI38P', max: 120 }
    ];
}

async function loadResult(specificSemester) {
    console.log('loadResult called with:', specificSemester);
    const resultContent = document.getElementById('resultContent');
    if (!resultContent) return;

    const storedSemester = localStorage.getItem('selectedSemester');
    const sem = specificSemester || storedSemester;

    // Show loading spinner
    resultContent.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900"></div>
        </div>
    `;

    try {
        const endpoint = sem ? `/result/get?semester=${sem}` : '/result/get';
        console.log('Fetching result from:', endpoint);
        const res = await request(endpoint);
        console.log('Result response received:', res);
        
        if (!res || !res.data) {
            throw new Error(`No result data found for the ${sem}${getOrdinal(sem)} semester.`);
        }
        
        const r = res.data;
        const subjectsConfig = getSubjectsBySemester(r.semester);
        const subjects = subjectsConfig.map((s, i) => ({
            ...s,
            ia: r[`subject${i+1}_ia`],
            e: r[`subject${i+1}_e`],
            marks: r[`subject${i+1}_t`]
        }));

        const semesterLabel = `${r.semester}${getOrdinal(r.semester)} Semester`;

        const getGrade = (marks, max) => {
            const p = (marks / max) * 100;
            if (p >= 90) return { label: 'A+', class: 'bg-success-subtle text-success' };
            if (p >= 80) return { label: 'A', class: 'bg-success-subtle text-success' };
            if (p >= 70) return { label: 'B+', class: 'bg-primary-subtle text-primary' };
            if (p >= 60) return { label: 'B', class: 'bg-info-subtle text-info' };
            return { label: 'F', class: 'bg-danger-subtle text-danger' };
        };

        const passedCount = subjects.filter((s, i) => {
            const isIaOnly = (r.semester == 2 && i == 7);
            return isIaOnly ? (s.ia >= 35) : (s.ia >= 35 && s.e >= 25 && s.marks >= 60);
        }).length;
        const failedCount = subjects.length - passedCount;
        const maxPossible = r.semester == 2 ? 910 : 960;
        const percentage = ((r.total / maxPossible) * 100).toFixed(2);
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
                                <span class="flex items-center gap-2">Sem: <b class="text-slate-900">${r.semester}${getOrdinal(r.semester)}</b></span>
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
                            <div class="text-indigo-600 text-2xl font-black mb-1">${r.total}/${maxPossible}</div>
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
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">IA <br><span class="text-[8px] opacity-60">(Min 35)</span></th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Exam <br><span class="text-[8px] opacity-60">(Min 25)</span></th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Total <br><span class="text-[8px] opacity-60">(Min 60)</span></th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Grade</th>
                                        <th class="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${subjects.map((s, i) => {
                                        const grade = getGrade(s.marks, s.max);
                                        const isIaOnly = (r.semester == 2 && i == 7);
                                        const isPass = isIaOnly ? (s.ia >= 35) : (s.ia >= 35 && s.e >= 25 && s.marks >= 60);
                                        
                                        return `
                                            <tr class="hover:bg-slate-50/50 transition-colors">
                                                <td class="px-6 py-4 text-sm text-slate-400 font-medium">${i + 1}</td>
                                                <td class="px-6 py-4 text-sm text-slate-900 font-bold">${s.name}</td>
                                                <td class="px-6 py-4 text-xs text-slate-500 font-mono">${s.code}</td>
                                                <td class="px-6 py-4 text-center">
                                                    <div class="text-sm font-bold ${s.ia >= 35 ? 'text-emerald-600' : 'text-rose-600'}">${s.ia}</div>
                                                    <div class="text-[10px] text-slate-400">/70</div>
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    ${isIaOnly ? 
                                                        '<span class="text-slate-400 text-xs">N/A</span>' : 
                                                        `<div class="text-sm font-bold ${s.e >= 25 ? 'text-emerald-600' : 'text-rose-600'}">${s.e}</div>
                                                         <div class="text-[10px] text-slate-400">/50</div>`
                                                    }
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    <div class="text-sm font-bold ${isPass ? 'text-emerald-600' : 'text-rose-600'}">${s.marks}</div>
                                                    <div class="text-[10px] text-slate-400">/${s.max}</div>
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${grade.class.replace('bg-', 'bg-opacity-20 bg-')}">${grade.label}</span>
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                                                        ${isPass ? 'Pass' : 'Fail'}
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
                        <div class="flex gap-3 no-print">
                            <button onclick="downloadResultPDF(${r.semester})" class="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                                <i class="bi bi-file-pdf-fill"></i>
                                <span>Download PDF</span>
                            </button>
                            <button onclick="window.print()" class="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                                <i class="bi bi-printer-fill"></i>
                                <span>Print Result</span>
                            </button>
                        </div>
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

async function downloadResultPDF(semester) {
    try {
        const endpoint = semester ? `/result/get?semester=${semester}` : '/result/get';
        const res = await request(endpoint);
        const r = res.data;
        if (!r) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const subjectsConfig = getSubjectsBySemester(r.semester);
        const maxPossible = r.semester == 2 ? 910 : 960;
        const percentage = ((r.total / maxPossible) * 100).toFixed(2);

        // Helper for colors
        const colors = {
            primary: [15, 23, 42], // slate-900
            secondary: [100, 116, 139], // slate-500
            accent: [37, 99, 235], // blue-600
            success: [5, 150, 105], // emerald-600
            danger: [225, 29, 72] // rose-600
        };

        // Header Section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.secondary);
        doc.text('STUDENT DETAILS', 20, 25);

        doc.setFontSize(28);
        doc.setTextColor(...colors.primary);
        const nameLines = doc.splitTextToSize(r.name.toUpperCase(), 170);
        doc.text(nameLines, 20, 38);
        
        const nameHeight = nameLines.length * 10;
        let currentY = 38 + nameHeight;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.primary);
        doc.text(`Roll: `, 20, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`${r.regNo}`, 30, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Dept: `, 55, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`${r.department || 'Artificial Intelligence & Machine Learning'}`, 67, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Sem: `, 160, currentY);
        doc.setFont("helvetica", "bold");
        doc.text(`${r.semester}${getOrdinal(r.semester)}`, 172, currentY);

        currentY += 15;

        // Summary Box
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(20, currentY, 170, 35, 5, 5);
        
        doc.setFontSize(24);
        doc.setTextColor(...colors.primary);
        doc.text(`${percentage}%`, 35, currentY + 18);
        doc.setFontSize(9);
        doc.setTextColor(...colors.secondary);
        doc.text('PERCENTAGE', 35, currentY + 25);

        doc.setFontSize(10);
        doc.setTextColor(r.result === 'PASS' ? colors.success[0] : colors.danger[0], r.result === 'PASS' ? colors.success[1] : colors.danger[1], r.result === 'PASS' ? colors.success[2] : colors.danger[2]);
        doc.text(`PASSED`, 100, currentY + 15);
        
        doc.setFontSize(12);
        doc.setTextColor(...colors.primary);
        doc.text(`Rank: #${r.rank || '-'}`, 100, currentY + 25);

        currentY += 50;

        // Stats Row
        const stats = [
            { label: 'TOTAL SUBJECTS', value: subjectsConfig.length },
            { label: 'PASSED', value: subjectsConfig.filter((s, i) => r[`subject${i+1}_t`] >= 60).length },
            { label: 'FAILED', value: subjectsConfig.filter((s, i) => r[`subject${i+1}_t`] < 60).length },
            { label: 'TOTAL MARKS', value: `${r.total}/${maxPossible}` }
        ];

        stats.forEach((stat, i) => {
            const x = 20 + (i * 42.5);
            doc.setDrawColor(241, 245, 249); // slate-100
            doc.roundedRect(x, currentY, 40, 25, 3, 3);
            doc.setFontSize(14);
            doc.setTextColor(...colors.primary);
            doc.text(`${stat.value}`, x + 20, currentY + 12, { align: 'center' });
            doc.setFontSize(7);
            doc.setTextColor(...colors.secondary);
            doc.text(stat.label, x + 20, currentY + 19, { align: 'center' });
        });

        currentY += 40;

        // Table
        doc.setFontSize(14);
        doc.setTextColor(...colors.primary);
        doc.text('Subject-wise Results', 20, currentY);

        const tableData = subjectsConfig.map((s, i) => {
            const marks = r[`subject${i+1}_t`];
            const p = (marks / s.max) * 100;
            let grade = 'F';
            if (p >= 90) grade = 'A+';
            else if (p >= 80) grade = 'A';
            else if (p >= 70) grade = 'B+';
            else if (p >= 60) grade = 'B';
            
            const isPass = (r.semester == 2 && i == 7) ? (r[`subject${i+1}_ia`] >= 35) : (r[`subject${i+1}_ia`] >= 35 && r[`subject${i+1}_e`] >= 25 && marks >= 60);

            return [
                i + 1,
                s.name,
                s.code,
                r[`subject${i+1}_ia`],
                r[`subject${i+1}_e`],
                `${marks} /${s.max}`,
                grade,
                isPass ? 'PASS' : 'FAIL'
            ];
        });

        doc.autoTable({
            startY: currentY + 8,
            head: [['#', 'SUBJECT', 'CODE', 'IA (Min 35)', 'EXAM (Min 25)', 'TOTAL (Min 60)', 'GRA', 'STATUS']],
            body: tableData,
            theme: 'plain',
            headStyles: { 
                fillColor: [248, 250, 252], 
                textColor: colors.secondary,
                fontSize: 8,
                fontStyle: 'bold'
            },
            bodyStyles: { 
                fontSize: 9,
                textColor: colors.primary
            },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { fontStyle: 'bold' },
                5: { fontStyle: 'bold' },
                6: { fontStyle: 'bold' }
            },
            didDrawPage: function (data) {
                // Footer
                doc.setFontSize(8);
                doc.setTextColor(...colors.secondary);
                doc.text('SYSTEM GENERATED PROVISIONAL SHEET', 20, doc.internal.pageSize.height - 20);
                doc.text(`ISSUED ON: ${new Date().toLocaleDateString()}`, 20, doc.internal.pageSize.height - 15);
            }
        });

        doc.save(`Result_${r.regNo}_Sem${r.semester}.pdf`);
    } catch (err) {
        alert('Error generating PDF: ' + err.message);
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
                                        <td class="px-6 py-4 text-sm text-center font-black text-slate-900">${((h.total / (h.semester == 2 ? 910 : 960)) * 100).toFixed(2)}%</td>
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
