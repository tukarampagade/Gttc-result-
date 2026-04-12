# Student Result Management System - GTTC

A professional student result management system with an admin panel for managing students, results, and analytics.

## Features
- **Student Portal:** Professional result display with percentage, status, and rank.
- **Admin Panel:** Manage students, add/update results, view analytics, and audit logs.
- **PDF Processing:** (Optional) Upload result PDFs to extract data.
- **Security:** JWT-based authentication for students and admins.

## Folder Structure
- `backend/`: Express server, controllers, services, and database logic.
- `frontend/`: Static HTML, CSS, and JS files for the user interface.

## Deployment Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Local Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (create a `.env` file):
   ```env
   JWT_SECRET=your_secret_key_here
   PORT=3000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Production Deployment
To deploy this application to a production server (e.g., VPS, Heroku, AWS):

#### Option A: VPS (DigitalOcean, AWS EC2, etc.)
1. **Transfer Files:** Upload the project files to your server.
2. **Install Node.js:** Ensure Node.js is installed on the server.
3. **Install PM2:** Use PM2 to keep the server running in the background.
   ```bash
   npm install -y pm2 -g
   ```
4. **Start Application:**
   ```bash
   pm2 start backend/server.ts --interpreter tsx --name gttc-results
   ```
5. **Reverse Proxy:** Set up Nginx as a reverse proxy to point your domain to `http://localhost:3000`.

#### Option B: Platform as a Service (Heroku, Render)
1. **Procfile:** Create a `Procfile` if needed (Heroku).
   ```
   web: npm start
   ```
2. **Environment Variables:** Set `JWT_SECRET` in the platform's dashboard.
3. **Deploy:** Push your code to the platform's Git repository.

## Admin Credentials
- **Email:** `tukarampagade781@gmail.com`
- **Password:** `************`
- 
- ## USED IN AI
- **CLAUED AI**
- **GEMINI.GOOGLE AI**
- **DEEP SEEK**

## Created By
Tukaram Pagade
