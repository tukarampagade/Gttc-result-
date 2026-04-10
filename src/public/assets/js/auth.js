document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const semester = document.getElementById('semester')?.value;
    const message = document.getElementById('message');

    try {
        const res = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        if (semester) localStorage.setItem('selectedSemester', semester);
        
        if (res.data.role === 'STUDENT') {
            window.location.href = '/result.html';
        } else {
            window.location.href = '/admin/panel.html';
        }
    } catch (err) {
        message.innerHTML = `<span class="text-danger">${err.message}</span>`;
    }
});

document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    try {
        const res = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        window.location.href = '/admin/panel.html';
    } catch (err) {
        message.innerHTML = `<span class="text-danger">${err.message}</span>`;
    }
});
