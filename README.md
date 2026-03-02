
# 🏥 OPD & Doctor Performance Analytics System

A full-stack healthcare analytics platform designed to analyze **OPD load, doctor performance, diagnoses trends, medicine usage, and revenue insights** across hospital branches.

---

## 🚀 Features

- Doctor-wise OPD load (monthly & branch-wise)
- Top 5 busiest doctors per branch
- New vs Follow-up patient ratio
- Top diagnoses by specialization
- Most prescribed medicines with patient count
- Monthly revenue (gross & net) per branch
- Average ticket size by payment mode
- Doctor performance analytics (visits, revenue, avg fee)
- Peak hour OPD analysis

---

## 🔄 CRUD Functionality (Master Data Management)

### 👤 Users
- Create users (Admin / Users(patient))
- List users with role & status
- Update user details and reset password
- Delete / deactivate users

### 🧑‍⚕️ Doctors
- Add doctors with specialization, fee, and branch
- View doctors with OPD & revenue stats
- Update doctor profile and availability
- Delete / deactivate doctors

### 🏥 Branches
- Create hospital branches
- View branch-wise OPD and revenue
- Update branch information
- Delete / deactivate branches

---

## 📊 Sample Data Flow (How Data Is Used)

1. **Branches** are created first (e.g., Mumbai, Pune)
2. **Doctors** are assigned to branches and specializations
3. **Users** (admin/staff) manage OPD entries
4. OPD visits generate:
   - Patient count
   - Revenue
   - Doctor performance metrics
5. Analytics dashboards query aggregated SQL data

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

## ⚙️ Database Configuration

```
servername: localhost
username: postgres
password: 1234
port: 5432
database: hospital_analytics
```

---

## ▶️ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

---

## ▶️ Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Admin Login

```
Email: admin@gmail.com
Password: admin@123
```

---

## 🛠️ API Docs

```
http://127.0.0.1:8000/docs
```

---

## 📌 Future Enhancements

- Charts & dashboards
- Export to PDF / Excel
- Appointment scheduling
- Predictive analytics

---

## 👨‍💻 Author

**Ritesh Ghavat**  
Healthcare Analytics Project

---

⭐ Star the repository if you find it useful!
