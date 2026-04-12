console.log('theme.js loaded');
async function applyTheme() {
    try {
        const res = await fetch('/api/theme/color');
        const data = await res.json();
        if (data.status === 'success' && data.data) {
            const color = data.data;
            document.documentElement.style.setProperty('--primary-color', color);
            
            // Helper to convert hex to rgba
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const rgbaPrimary = hexToRgba(color, 0.1);
            const rgbaPrimaryStrong = hexToRgba(color, 0.2);
            
            // Convert hex to rgb for Tailwind variables
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const rgb = `${r}, ${g}, ${b}`;

            // Inject dynamic styles
            let styleTag = document.getElementById('dynamic-theme-style');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'dynamic-theme-style';
                document.head.appendChild(styleTag);
            }
            
            document.documentElement.style.setProperty('--primary-color', color);
            document.documentElement.style.setProperty('--primary-rgb', rgb);
            
            styleTag.innerHTML = `
                :root {
                    --primary-color: ${color};
                    --primary-rgb: ${rgb};
                    --primary-hover: ${hexToRgba(color, 0.8)};
                    --sidebar-bg: ${color};
                }
                
                /* Tailwind Overrides */
                .bg-slate-900 { background-color: ${color} !important; }
                .text-slate-900 { color: ${color} !important; }
                .border-t-slate-900 { border-top-color: ${color} !important; }
                .bg-indigo-600 { background-color: ${color} !important; }
                .text-indigo-600 { color: ${color} !important; }
                .hover\\:bg-slate-800:hover { background-color: ${color} !important; filter: brightness(0.9); }
                .shadow-slate-200 { --tw-shadow-color: ${rgbaPrimaryStrong} !important; }
                .border-slate-900 { border-color: ${color} !important; }
                
                /* Bootstrap & Custom Overrides */
                .bg-primary { background-color: ${color} !important; }
                .bg-dark { background-color: ${color} !important; }
                .btn-primary { 
                    background-color: ${color} !important; 
                    border-color: ${color} !important; 
                }
                .btn-primary:hover {
                    background-color: ${color} !important;
                    filter: brightness(0.9);
                }
                .text-primary { color: ${color} !important; }
                .border-primary { border-color: ${color} !important; }
                .bg-primary-subtle { background-color: ${rgbaPrimary} !important; }
                
                /* Sidebar */
                .sidebar { background: ${color} !important; }
                .nav-link.active { 
                    background: rgba(255,255,255,0.1) !important; 
                    border-left: 4px solid white !important;
                }
                
                /* Login Card */
                .login-card hr { border-color: ${color} !important; opacity: 0.5; }
                .hover-primary:hover { color: ${color} !important; }
            `;

            // Update color picker value if it exists
            const picker = document.getElementById('themeColorPicker');
            if (picker) {
                picker.value = color;
            }
        }
    } catch (err) {
        console.error('Failed to apply theme:', err);
    }
}

// Handle color picker changes
document.addEventListener('input', async (e) => {
    if (e.target.id === 'themeColorPicker') {
        const color = e.target.value;
        updateThemeLocally(color);
    }
});

function updateThemeLocally(color) {
    // Live update (local only)
    const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    const rgbaPrimary = hexToRgba(color, 0.1);
    const rgbaPrimaryStrong = hexToRgba(color, 0.2);
    
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const rgb = `${r}, ${g}, ${b}`;

    let styleTag = document.getElementById('dynamic-theme-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-theme-style';
        document.head.appendChild(styleTag);
    }
    
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--primary-rgb', rgb);
    
    styleTag.innerHTML = `
        :root {
            --primary-color: ${color};
            --primary-rgb: ${rgb};
            --primary-hover: ${hexToRgba(color, 0.8)};
            --sidebar-bg: ${color};
        }
        .bg-slate-900 { background-color: ${color} !important; }
        .text-slate-900 { color: ${color} !important; }
        .border-t-slate-900 { border-top-color: ${color} !important; }
        .bg-indigo-600 { background-color: ${color} !important; }
        .text-indigo-600 { color: ${color} !important; }
        .hover\\:bg-slate-800:hover { background-color: ${color} !important; filter: brightness(0.9); }
        .shadow-slate-200 { --tw-shadow-color: ${rgbaPrimaryStrong} !important; }
        .border-slate-900 { border-color: ${color} !important; }
        .bg-primary { background-color: ${color} !important; }
        .bg-dark { background-color: ${color} !important; }
        .btn-primary { background-color: ${color} !important; border-color: ${color} !important; }
        .btn-primary:hover { background-color: ${color} !important; filter: brightness(0.9); }
        .text-primary { color: ${color} !important; }
        .border-primary { border-color: ${color} !important; }
        .bg-primary-subtle { background-color: ${rgbaPrimary} !important; }
        .sidebar { background: ${color} !important; }
        .nav-link.active { background: rgba(255,255,255,0.1) !important; border-left: 4px solid white !important; }
        .login-card hr { border-color: ${color} !important; opacity: 0.5; }
        .hover-primary:hover { color: ${color} !important; }
    `;
}

// Dark Mode Toggle
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    const icon = document.getElementById('darkModeIcon');
    if (!icon) return;
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('bi-moon-stars');
        icon.classList.add('bi-sun');
    } else {
        icon.classList.remove('bi-sun');
        icon.classList.add('bi-moon-stars');
    }
}

function initDarkMode() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    updateDarkModeIcon();
}

// Save color when picker is closed (change event)
document.addEventListener('change', async (e) => {
    if (e.target.id === 'themeColorPicker') {
        const color = e.target.value;
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') {
            try {
                const res = await fetch('/api/admin/update-theme', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ color })
                });
                console.log('Theme color saved to server');
            } catch (err) {
                console.error('Failed to save theme color:', err);
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initDarkMode();
});
window.applyTheme = applyTheme;
window.toggleDarkMode = toggleDarkMode;
