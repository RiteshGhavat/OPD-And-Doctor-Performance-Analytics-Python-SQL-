Below is a complete, clean README.md you can directly copy into your GitHub repository.
It covers setup, database, roles (Admin/User), flag-based access, SQL tasks, and execution steps, exactly as your assignment requires.

OPD & Doctor Performance Analytics – Python / SQL Challenge
📌 Assignment 2

OPD & Doctor Performance Analytics using Python, SQL, FastAPI & React

This project analyzes OPD visits and doctor performance across multiple hospital branches using PostgreSQL, optimized SQL queries, and a role-based analytics dashboard.

🚀 Tech Stack
Backend

Python

FastAPI

PostgreSQL

SQLAlchemy

Uvicorn

Frontend

React.js

Axios

npm

Database

PostgreSQL

📂 Project Features

Role-based login (Admin / User)

Flag-based access control (Admin-only analytics)

OPD visit analytics (80,000+ records)

Doctor performance metrics

Revenue and billing analysis

Peak hour & workload insights

Optimized SQL queries with joins

REST APIs using FastAPI

🏥 Dataset Overview

The dataset simulates 80,000 OPD visits across 4 hospital branches.

📊 Database Tables
Branch(
  branch_id,
  branch_name,
  city
)

Doctor(
  doctor_id,
  branch_id,
  doctor_name,
  specialization,
  joining_date
)

Patient(
  patient_id,
  patient_name,
  age,
  gender,
  contact_number
)

OPD_Visit(
  visit_id,
  patient_id,
  doctor_id,
  branch_id,
  visit_datetime,
  consultation_type
)

OPD_Diagnosis(
  diagnosis_id,
  visit_id,
  diagnosis_name
)

OPD_Prescription(
  prescription_id,
  visit_id,
  medicine_name,
  dose,
  duration_days
)

OPD_Billing(
  bill_id,
  visit_id,
  consultation_fee,
  additional_charges,
  discount_amount,
  payment_mode
)
🔐 Authentication & Roles
👑 Admin Role

Full access to analytics

Doctor performance reports

Revenue dashboards

SQL analytics endpoints

👤 User Role

View own OPD visits

Limited dashboard access

No admin analytics visibility

🏳️ Flag-Based Access

Backend flags control feature visibility

Admin-only flags hide sensitive reports from users

🔑 Login Credentials
Admin Login
Email: admin@gmail.com
Password: admin@1234
User Login
Email: karan5000@gmail.com
Password: karan@1234
⚙️ Database Configuration

Update your PostgreSQL credentials in .env or config file:

SERVERNAME = localhost
USERNAME   = postgres
PASSWORD   = 1234
PORT       = 5432
DATABASE   = hospital_analytics
▶️ Running the Project
Backend (FastAPI)
uvicorn app:app --reload

API will be available at:

http://127.0.0.1:8000

Swagger Docs:

http://127.0.0.1:8000/docs
Frontend (React)
npm install
npm start

Frontend runs at:

http://localhost:3000
📈 SQL Analytics Tasks
1️⃣ Doctor-wise OPD Load (Monthly)

Top 5 busiest doctors per branch

Based on visit count

2️⃣ New vs Follow-up Ratio

Monthly breakdown per branch

Consultation type comparison

3️⃣ Top Diagnoses

Top 3 diagnoses per doctor specialization

4️⃣ Most Prescribed Medicines

Medicine-wise patient count

5️⃣ Monthly Revenue Analysis

Gross revenue

Net revenue (after discounts)

Per branch

6️⃣ Average Ticket Size

Grouped by payment mode (Cash, Card, UPI, Insurance)

7️⃣ Doctor Performance Metrics

Total visits

Total revenue generated

Average consultation fee

8️⃣ Peak Hour Analysis

Hourly OPD load

Branch-wise peak visiting hours

🧠 SQL Optimization Guidelines

Proper indexing on:

visit_datetime

doctor_id

branch_id

Use JOINs instead of subqueries

Grouping with aggregation

Window functions where required

📄 Submission Contents

✅ SQL file with all queries

✅ Query explanation comments

✅ Backend API implementation

✅ Frontend dashboard

✅ Role-based access control

✅ Flag-based feature visibility

📌 Folder Structure (Suggested)
├── backend
│   ├── app.py
│   ├── models
│   ├── routes
│   ├── services
│   └── sql_queries
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── services
│
├── database
│   ├── schema.sql
│   ├── seed.sql
│   └── analytics_queries.sql
│
└── README.md
✅ Conclusion

This project demonstrates:

Advanced SQL analytics

Healthcare data modeling

Backend + Frontend integration

Secure role-based systems

Performance-driven query design

If you want, I can also:

Write all SQL queries

Create ER Diagram

Add Swagger API documentation

Improve Admin dashboard UI

Generate dummy data scripts (80k visits)

Just tell me 👍
