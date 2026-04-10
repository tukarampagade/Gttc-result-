const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    } catch (err) {
        console.error(`API Request failed [${endpoint}]:`, err);
        throw err;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/';
}
