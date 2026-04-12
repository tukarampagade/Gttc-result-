document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNo = document.getElementById('username').value;
    const password = document.getElementById('password').value; // In this app, password is the full name for students
    const semester = document.getElementById('semester').value;
    const message = document.getElementById('message');

    try {
        message.innerHTML = '<div class="spinner-border spinner-border-sm text-primary"></div> Authenticating...';
        const res = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ regNo, password })
        });

        if (res.status === 'success') {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', 'STUDENT');
            localStorage.setItem('selectedSemester', semester);
            window.location.href = '/result.html';
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        message.innerHTML = `<div class="alert alert-danger py-2 small">${err.message}</div>`;
    }
});

document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');

    try {
        message.innerHTML = '<div class="spinner-border spinner-border-sm text-primary"></div> Authenticating...';
        const res = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, isAdmin: true })
        });

        if (res.status === 'success') {
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', 'ADMIN');
            window.location.href = '/admin/panel.html';
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        message.innerHTML = `<div class="alert alert-danger py-2 small">${err.message}</div>`;
    }
});

// Password Toggle Logic
document.getElementById('togglePassword')?.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
});
