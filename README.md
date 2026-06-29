# Driver Daily Check-in & Trip Log System

A premium Transport Management SaaS Dashboard built for **Manivtha Tours & Travels**.

This web application digitizes daily driver check-ins, vehicle checklists, odometer checks, and trip tracking logs, featuring separate portals for **Administrators** and **Drivers**.

---

## 🚀 Quick Start Instructions

Both the frontend client and backend server are completely self-contained. The system features a **Dual-Database Layer** that works out of the box using a local JSON file database backup, requiring zero configurations or SQL setups to test!

### 1. Run the Backend API Server
1. Open a terminal in the `/server` folder.
2. Run npm install:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *The server will start on [http://localhost:5000](http://localhost:5000) and automatically seed initial drivers, vehicles, check-ins, and completed trips into `/server/database/local_db.json`.*

### 2. Run the React Frontend Client
1. Open a separate terminal in the `/client` folder.
2. Run npm install:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
   *Usually starts on [http://localhost:5173](http://localhost:5173).*

---

## 🔑 Role-Based Demo Credentials

Sign in with the following seeded accounts to experience the split portals:

### 1. Admin Portal
- **Email**: `admin@manivtha.com`
- **Password**: `admin123`
- **Purpose**: Full control over fleet settings. View general dashboard KPIs, track daily checklists, CRUD drivers, CRUD vehicles, run reports, export CSV sheets, and inspect interactive analytics graphs.

### 2. Driver Portal
- **Email**: `rajesh@manivtha.com` (or `sunil@manivtha.com`, `ramesh@manivtha.com`)
- **Password**: `driver123`
- **Purpose**: Log daily check-ins (checks odometer, tyres, battery condition and uploads a photo). Accesses "My Trips" containing only trip logs assigned to this driver. Drivers can trigger "Start Trip" or "Complete Trip" and log ending odometer distances. All admin links are blocked.

---

## 🛠️ Switching to MySQL Database (Production Setup)

The application follows a clean MVC architecture with a database adapter. When you are ready to switch from local files to a live MySQL server, follow these steps:

1. Open a MySQL terminal or manager and create a database:
   ```sql
   CREATE DATABASE manivtha_transport;
   ```
2. Open `/server/.env` and update the environment variables:
   ```env
   PORT=5000
   JWT_SECRET=manivtha_tours_travels_secret_jwt_key_2026
   DB_TYPE=mysql
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=manivtha_transport
   ```
3. Restart the backend server. The database initialization script (`/server/config/dbInit.js`) will detect the MySQL switch, automatically run DDL statements to create the `users`, `drivers`, `vehicles`, `checkins`, and `trips` tables, and seed the default accounts and mock logs.

---

## 📂 Project Architecture

```
/
├── README.md               # Quickstart and configurations manual
│
├── server/                 # Express Backend API (MVC)
│   ├── config/
│   │   ├── connection.js   # DB connection pooling (MySQL/JSON dual support)
│   │   └── dbInit.js       # Table schema generators & mock seeders
│   ├── controllers/        # REST Endpoint Controllers (Auth, Trips, Drivers, etc.)
│   ├── middleware/         # Security validation filters (JWT verification)
│   ├── models/             # DB schema mapping and repositories
│   ├── routes/             # REST Route mappings
│   ├── database/           # Local JSON database storage
│   ├── .env                # Server settings and DB configuration keys
│   └── server.js           # Server initializer
│
└── client/                 # React Frontend Client (Vite + React)
    ├── src/
    │   ├── components/     # UI components (Sidebar, Navbar, Skeletons, Toasts)
    │   ├── context/        # Global Providers (Auth, Theme, Toasts)
    │   ├── pages/          # Layout views (Dashboard, CheckIn, Trips, Reports)
    │   ├── index.css       # Clean Vanilla CSS styling system (Light & Dark theme)
    │   ├── App.jsx         # Dispatcher router
    │   └── main.jsx        # Tree wrapper
    └── package.json        # Frontend scripts and dependencies
```

---

## 📋 Business Rules Enforced
1. **Daily Check-in Constraint**: A driver cannot submit more than one check-in log per day.
2. **Vehicle Double-Booking Check**: A vehicle currently active on an ongoing trip (`Started`) cannot be assigned to another trip until the current trip is completed or cancelled.
3. **Odometer Reading Constraint**: Ending KM logged during trip completion must be strictly greater than the starting KM.
4. **Positive Fuel Checks**: All fuel inputs must be positive decimal readings.
5. **Mandatory Conditions**: Checking the general vehicle condition is required before locking a check-in.
6. **Automatic Distance Calculations**: The distance is calculated automatically as `Ending KM - Starting KM` on completion.
