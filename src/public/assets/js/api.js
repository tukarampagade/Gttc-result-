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

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/';
}

// Theme Management
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update active state in UI
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains(`theme-${theme}`)) {
            btn.classList.add('active');
        }
    });

    // Clear custom color if switching to a preset theme
    if (theme !== 'custom') {
        document.documentElement.style.removeProperty('--primary-color');
        localStorage.removeItem('custom-color');
    } else {
        const savedColor = localStorage.getItem('custom-color') || '#2563eb';
        applyCustomColor(savedColor);
    }
}

function applyCustomColor(color) {
    document.documentElement.setAttribute('data-theme', 'custom');
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('theme', 'custom');
    localStorage.setItem('custom-color', color);
    
    const colorInput = document.getElementById('colorInput');
    if (colorInput) colorInput.value = color;

    // Update active state
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains('theme-custom')) {
            btn.classList.add('active');
        }
    });
}

function resetTheme() {
    localStorage.removeItem('theme');
    localStorage.removeItem('custom-color');
    document.documentElement.style.removeProperty('--primary-color');
    setTheme('light');
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedColor = localStorage.getItem('custom-color');
    
    if (savedTheme === 'custom' && savedColor) {
        applyCustomColor(savedColor);
    } else {
        setTheme(savedTheme);
    }
    
    // Add theme picker to body if not present
    if (!document.querySelector('.theme-picker')) {
        const picker = document.createElement('div');
        picker.className = 'theme-picker';
        picker.innerHTML = `
            <button class="theme-btn theme-light ${savedTheme === 'light' ? 'active' : ''}" onclick="setTheme('light')" title="Light Mode">
                <i class="bi bi-sun"></i>
            </button>
            <button class="theme-btn theme-dark ${savedTheme === 'dark' ? 'active' : ''}" onclick="setTheme('dark')" title="Dark Mode">
                <i class="bi bi-moon-stars"></i>
            </button>
            <button class="theme-btn theme-blue ${savedTheme === 'blue' ? 'active' : ''}" onclick="setTheme('blue')" title="Blue Mode">
                <i class="bi bi-droplet"></i>
            </button>
            <div class="theme-btn theme-custom ${savedTheme === 'custom' ? 'active' : ''}" title="Custom Theme">
                <i class="bi bi-sliders"></i>
                <label for="colorInput" class="visually-hidden">Custom Theme Color</label>
                <input type="color" id="colorInput" onchange="applyCustomColor(this.value)" value="${savedColor || '#2563eb'}">
            </div>
            <button class="theme-btn" onclick="resetTheme()" title="Reset to Default" style="background: transparent; color: var(--text-muted); border: 1px dashed var(--card-border);">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>
        `;
        document.body.appendChild(picker);
    }
}

document.addEventListener('DOMContentLoaded', initTheme);
