import sqlite3
import os
import pandas as pd
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "platelet_iq.db")
DATA_CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "research_pipeline_data.csv")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Banks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS banks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        shelf_life_days INTEGER DEFAULT 5,
        lead_time_days INTEGER DEFAULT 1,
        alpha_safety_stock REAL DEFAULT 13.0,
        bridge_f REAL DEFAULT 0.15
    )
    """)

    # 2. Units
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        bank_id TEXT NOT NULL,
        bag_number TEXT NOT NULL,
        component TEXT DEFAULT 'SDP',
        blood_group TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        days_remaining INTEGER NOT NULL,
        status TEXT DEFAULT 'available',
        discard_reason TEXT
    )
    """)

    # 3. Daily Demand (RWTH Aachen Real Dataset)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_demand (
        date TEXT PRIMARY KEY,
        actual REAL NOT NULL,
        y REAL NOT NULL,
        pred REAL NOT NULL,
        q67_raw REAL NOT NULL,
        q67_conformal REAL NOT NULL
    )
    """)

    # 4. Requisitions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS requisitions (
        id TEXT PRIMARY KEY,
        bank_id TEXT NOT NULL,
        ward TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        units_requested INTEGER NOT NULL,
        platelet_count INTEGER NOT NULL,
        active_bleeding INTEGER NOT NULL,
        status TEXT DEFAULT 'review',
        note TEXT,
        guideline TEXT,
        source TEXT,
        issued_by TEXT,
        issued_at TEXT
    )
    """)

    # 5. Recommendations Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_id TEXT NOT NULL,
        date TEXT NOT NULL,
        verb TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        basis TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        confirmed_by TEXT,
        confirmed_at TEXT,
        adjust_reason TEXT
    )
    """)

    # 6. Audit Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at TEXT NOT NULL
    )
    """)

    conn.commit()

    # Seed Bank Profile if empty
    cursor.execute("SELECT COUNT(*) FROM banks")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO banks (id, name, code, shelf_life_days, lead_time_days, alpha_safety_stock, bridge_f)
        VALUES ('ggh-chennai', 'Govt. General Hospital, Chennai', 'GGH-CHE', 5, 1, 13.0, 0.15)
        """)

    # Seed Units if empty
    cursor.execute("SELECT COUNT(*) FROM units")
    if cursor.fetchone()[0] == 0:
        today_dt = datetime.now()
        units_data = [
            # Expiring Today (9 units)
            ("P-4401", "O+", 0, "22:14"), ("P-4408", "A+", 0, "18:30"), ("P-4415", "B+", 0, "07:50"),
            ("P-4422", "AB+", 0, "14:20"), ("P-4429", "O-", 0, "11:00"), ("P-4436", "A-", 0, "21:45"),
            ("P-4443", "B+", 0, "19:10"), ("P-4450", "O+", 0, "16:05"), ("P-4457", "A+", 0, "23:59"),
            # 1 day left (14 units)
            *[(f"P-446{i}", ["O+", "A+", "B+", "AB+"][i % 4], 1, "18:00") for i in range(14)],
            # 2 days left (13 units)
            *[(f"P-448{i}", ["O+", "A+", "B+", "O-"][i % 4], 2, "14:30") for i in range(13)],
            # 3 days left (12 units)
            *[(f"P-450{i}", ["O+", "A+", "B+", "AB+"][i % 4], 3, "11:15") for i in range(12)],
        ]
        for uid, grp, d_rem, time_str in units_data:
            coll = (today_dt - timedelta(days=5 - d_rem)).strftime("%Y-%m-%d %H:%M")
            exp = (today_dt + timedelta(days=d_rem)).strftime(f"%Y-%m-%d {time_str}")
            cursor.execute("""
            INSERT INTO units (id, bank_id, bag_number, component, blood_group, collected_at, expires_at, days_remaining, status)
            VALUES (?, 'ggh-chennai', ?, 'SDP', ?, ?, ?, ?, 'available')
            """, (uid, uid, grp, coll, exp, d_rem))

    # Seed Daily Demand from research CSV if empty
    cursor.execute("SELECT COUNT(*) FROM daily_demand")
    if cursor.fetchone()[0] == 0 and os.path.exists(DATA_CSV_PATH):
        df = pd.read_csv(DATA_CSV_PATH)
        for _, row in df.iterrows():
            cursor.execute("""
            INSERT OR REPLACE INTO daily_demand (date, actual, y, pred, q67_raw, q67_conformal)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (str(row['date']), float(row['actual']), float(row['y']), float(row['pred']), float(row['q67_raw']), float(row['q67_conformal'])))

    # Seed Requisitions if empty
    cursor.execute("SELECT COUNT(*) FROM requisitions")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO requisitions (id, bank_id, ward, requested_at, units_requested, platelet_count, active_bleeding, status, note, guideline, source)
        VALUES 
        ('4471', 'ggh-chennai', 'Ward 4B', '09:12', 4, 45, 0, 'review', 'No active bleeding documented',
         'WHO threshold for prophylactic transfusion is <20 ×10⁹/L. Therapeutic transfusion applies at <50 ×10⁹/L with significant active bleeding, or proven DIC.',
         'WHO Dengue Guidelines 2009 §3.4'),
        ('4472', 'ggh-chennai', 'ICU', '09:20', 6, 12, 1, 'concordant', 'Prophylactic · meets threshold', NULL, NULL)
        """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
