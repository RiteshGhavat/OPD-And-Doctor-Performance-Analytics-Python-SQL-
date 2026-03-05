
# 🏥 OPD & Doctor Performance Analytics System

A full-stack healthcare analytics platform designed to analyze **OPD load, doctor performance, diagnosis trends, medicine usage, and revenue insights** across multiple hospital branches.

---

## 🚀 Key Features

- Doctor-wise OPD load (monthly & branch-wise)
- Top 5 busiest doctors per branch
- New vs Follow-up patient ratio
- Top diagnoses by specialization
- Most prescribed medicines with patient count
- Monthly revenue (gross & net) per branch
- Average ticket size by payment mode
- Doctor performance analytics (visits, revenue, average fee)
- Peak hour OPD analysis

---

## 🔄 CRUD Functionality (Master Data Management)

### 👤 Users Management
- Create users (Admin / Doctor / Staff)
- View users with role and status
- Update user details and reset passwords
- Delete or deactivate users
- Role-based access control using JWT

### 🧑‍⚕️ Doctors Management
- Add doctors with specialization, consultation fee, and branch mapping
- View doctor list with OPD and revenue statistics
- Update doctor profiles and availability
- Delete or deactivate doctors

### 🏥 Branches Management
- Create and manage hospital branches
- View branch-wise OPD load and revenue
- Update branch details (name, location)
- Delete or deactivate branches

---

## 📊 Sample Data Flow (Analytics Pipeline)

1. Branches are created (e.g., Mumbai, Pune)
2. Doctors are assigned to branches and specializations
3. Users / Admin manage OPD visit entries
4. Each OPD visit generates patient count, doctor workload, and revenue
5. SQL analytics queries generate dashboards and reports

---

## 🧰 Tech Stack

### Backend
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- JWT Authentication

### Frontend
- React.js
- Material UI (MUI)
- Axios

---

## 📂 Project Structure

doctor_performance_analytics/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/
│   ├── analytics.sql
│   ├── hospital_analytics.sql
│   └── frontend images.docx
│
└── README.md

---

## ⚙️ Database Configuration

servername: localhost  
username: postgres  
password: 1234  
port: 5432  
database: hospital_analytics

---

## ▶️ Backend Setup

cd backend  
python -m venv venv  
venv\Scripts\activate  
pip install -r requirements.txt  
uvicorn app:app --reload  

Backend URL: [http://127.0.0.1:8000](https://opd-and-doctor-performance-analytics.onrender.com)

---

## ▶️ Frontend Setup

cd frontend  
npm install  
npm start  

Frontend URL: [http://localhost:3000](https://opd-analytics-frontend.onrender.com)

---

## 🔐 Admin Login

Email: admin@gmail.com  
Password: admin@123

---

---
## 🔐 User Login
Email:- karan5000@gmail.com
Password:- Karan@1234

---

## 🛠️ API Documentation

http://127.0.0.1:8000/docs

---

## 📌 Future Enhancements

- Interactive charts & dashboards
- Export reports (PDF / Excel)
- Appointment scheduling module
- Predictive OPD analytics

---

## 👨‍💻 Author

**Ritesh Ghavat**  
OPD & Doctor Performance Analytics Project

---

⭐ Star the repository if you find it useful!
