<div align="center">
  <img src="./frontend/public/logo.png" alt="NovaTix Logo" width="120" />
  
  # NovaTix — Next-Gen Ticketing Platform

  **A modern, high-performance event booking platform featuring interactive seat mapping, real-time availability locks, and premium glassmorphism design.**

  [![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![MySQL](https://img.shields.io/badge/MySQL-8.x-blue?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
  [![Redis](https://img.shields.io/badge/Redis-Cache-red?style=for-the-badge&logo=redis)](https://redis.io/)
  
  [Explore Live App](#) · [Report Bug](#) · [Request Feature](#)
</div>

---

## 🌟 Overview

NovaTix is a full-stack, enterprise-grade ticketing platform designed to handle high-concurrency event bookings. We combined a beautiful, responsive frontend with a robust backend architecture to ensure zero double-bookings during peak ticket sales.

### ✨ Key Features

#### 🎭 For Attendees
- **Interactive Seat Selection**: Visually pick your exact seats from a dynamic venue map.
- **Real-Time Booking Locks**: Seats are temporarily held in Redis the moment you click them, preventing anyone else from taking your tickets while you check out.
- **Automated Reminders**: Receive customized email notifications 24 hours and 1 hour before your event starts.
- **Premium User Experience**: Lightning-fast navigation with smooth animations and a modern dark-mode aesthetic.

#### 🛡️ For Organizers (Under the Hood)
- **High Concurrency Handling**: Built to survive "Taylor Swift" level traffic spikes using Redis distributed locking.
- **Automated Cron Jobs**: Scheduled background tasks automatically manage event statuses and dispatch reminder emails.
- **Secure Transactions**: ACID-compliant PostgreSQL/MySQL transactions guarantee data integrity during final checkout.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Vanilla CSS with custom Glassmorphism UI & CSS Variables
- **Icons**: Lucide React
- **Animations**: Canvas Confetti

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (Aiven Cloud)
- **Caching & Locking**: Redis (Upstash)
- **Authentication**: JWT (JSON Web Tokens) & bcrypt
- **Email Service**: Nodemailer

---

## 🚀 Getting Started

To run this project locally, follow these steps:

### Prerequisites
- Node.js (v18+)
- MySQL
- Redis (Local or Cloud instance)

### 1. Clone the Repository
```bash
git clone https://github.com/Soham-0207/novatix-booking.git
cd novatix-booking
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
DATABASE_URL=mysql://user:pass@host:port/db
REDIS_URL=rediss://default:pass@host:port
JWT_SECRET=your_super_secret_key
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```
Start the frontend development server:
```bash
npm run dev
```

---

## 📸 Platform Sneak Peek


| Discover Events | Interactive Seat Map |
| :---: | :---: |
| <img src="./frontend/public/home-screenshot.png" alt="Discover Events" width="400"/> | <img src="./frontend/public/seatmap-screenshot.png" alt="Live Seat Selection" width="400"/> |

---

<div align="center">
  <b>Designed and Developed by Soham</b><br>
  <i>Powering Next-Generation Event Experiences</i>
</div>
