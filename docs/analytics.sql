
1Doctor-wise OPD load monthly; top 5 busiest per branch.


WITH doctor_monthly_load AS (
    SELECT
        b.branch_name,
        d.doctor_name,
        DATE_TRUNC('month', v.visit_datetime) AS month,
        COUNT(v.visit_id) AS visit_count,
        ROW_NUMBER() OVER (
            PARTITION BY b.branch_id, DATE_TRUNC('month', v.visit_datetime)
            ORDER BY COUNT(v.visit_id) DESC
        ) AS rn
    FROM opd_visits v
    JOIN doctors d ON d.doctor_id = v.doctor_id
    JOIN branches b ON b.branch_id = v.branch_id
    WHERE v.deleted_at IS NULL
      AND v.visit_status <> 'Cancelled'
    GROUP BY b.branch_id, b.branch_name, d.doctor_name, month
)
SELECT
    branch_name,
    doctor_name,
    TO_CHAR(month, 'YYYY-MM') AS month,
    visit_count
FROM doctor_monthly_load
WHERE rn <= 5
ORDER BY branch_name, month, visit_count DESC;

Explanation

Aggregates monthly visits per doctor

Uses ROW_NUMBER() to rank doctors within each branch & month

Filters top 5 busiest doctors

Efficient and scalable (single aggregation pass)

2. New vs follow-up ratio per branch per month.
SELECT
    b.branch_name,
    TO_CHAR(DATE_TRUNC('month', v.visit_datetime), 'YYYY-MM') AS month,
    SUM(CASE WHEN v.consultation_type = 'New' THEN 1 ELSE 0 END) AS new_visits,
    SUM(CASE WHEN v.consultation_type = 'Follow-up' THEN 1 ELSE 0 END) AS followup_visits
FROM opd_visits v
JOIN branches b ON b.branch_id = v.branch_id
WHERE v.deleted_at IS NULL
  AND v.visit_status <> 'Cancelled'
GROUP BY b.branch_name, month
ORDER BY month, b.branch_name;

Explanation

Uses conditional aggregation (CASE WHEN)

Produces monthly counts of New vs Follow-up

Ideal for trend analysis and retention metrics


3. Top 3 Diagnoses per Specialization
WITH diagnosis_rank AS (
    SELECT
        d.specialization,
        dg.diagnosis_name,
        COUNT(*) AS diagnosis_count,
        ROW_NUMBER() OVER (
            PARTITION BY d.specialization
            ORDER BY COUNT(*) DESC
        ) AS rn
    FROM opd_diagnoses dg
    JOIN opd_visits v ON v.visit_id = dg.visit_id
    JOIN doctors d ON d.doctor_id = v.doctor_id
    WHERE dg.deleted_at IS NULL
    GROUP BY d.specialization, dg.diagnosis_name
)
SELECT
    specialization,
    diagnosis_name,
    diagnosis_count
FROM diagnosis_rank
WHERE rn <= 3
ORDER BY specialization, diagnosis_count DESC;

Explanation

Groups diagnoses by doctor specialization

Window function ranks diagnoses per specialization

Returns Top 3 most common diagnoses

4. Most Prescribed Medicines (with Patient Count)

SELECT
    p.medicine_name,
    COUNT(DISTINCT v.patient_id) AS patient_count,
    COUNT(*) AS total_prescriptions
FROM opd_prescriptions p
JOIN opd_visits v ON v.visit_id = p.visit_id
WHERE p.deleted_at IS NULL
GROUP BY p.medicine_name
ORDER BY patient_count DESC;

Explanation

Counts unique patients per medicine

Also provides total prescription volume

Useful for pharmacy & inventory planning

5️. Monthly revenue per branch (gross & net).

SELECT
    b.branch_name,
    TO_CHAR(DATE_TRUNC('month', bl.created_at), 'YYYY-MM') AS month,

    SUM(bl.consultation_fee + bl.additional_charges) AS gross_revenue,

    SUM(
        CASE
            WHEN bl.payment_status = 'Paid'
            THEN bl.paid_amount
            ELSE 0
        END
    ) AS net_revenue
FROM opd_billings bl
JOIN opd_visits v ON v.visit_id = bl.visit_id
JOIN branches b ON b.branch_id = v.branch_id
WHERE bl.deleted_at IS NULL
  AND v.deleted_at IS NULL
  AND v.visit_status <> 'Cancelled'
GROUP BY b.branch_name, month
ORDER BY month, b.branch_name;

Explanation

Gross = consultation + additional charges

Net = actual paid amount

Clean financial reporting per branch

6. Average Ticket Size by Payment Mode

SELECT
    payment_mode,
    AVG(paid_amount) AS avg_ticket_size,
    SUM(paid_amount) AS total_collection
FROM opd_billings
WHERE deleted_at IS NULL
  AND payment_status = 'Paid'
GROUP BY payment_mode
ORDER BY avg_ticket_size DESC;

Explanation

Calculates average bill value per payment type

Helps understand payment behavior & monetization

7.Doctor performance: visits, revenue, avg fee.
 SELECT
    d.doctor_name,
    COUNT(v.visit_id) AS total_visits,
    SUM(bl.paid_amount) AS total_revenue,
    AVG(bl.paid_amount) AS avg_fee
FROM doctors d
JOIN opd_visits v ON v.doctor_id = d.doctor_id
JOIN opd_billings bl ON bl.visit_id = v.visit_id
WHERE bl.deleted_at IS NULL
  AND bl.payment_status = 'Paid'
GROUP BY d.doctor_name
ORDER BY total_revenue DESC;

Explanation

Measures doctor productivity & earnings

Useful for incentives, appraisal & ROI analysis

8.Peak hour analysis per branch.
SELECT
    b.branch_name,
    EXTRACT(HOUR FROM v.visit_datetime) AS hour,
    COUNT(*) AS visit_count
FROM opd_visits v
JOIN branches b ON b.branch_id = v.branch_id
WHERE v.deleted_at IS NULL
  AND v.visit_status <> 'Cancelled'
GROUP BY b.branch_name, hour
ORDER BY b.branch_name, hour;

Explanation

Identifies patient rush hours

Helps optimize staffing & appointment slots