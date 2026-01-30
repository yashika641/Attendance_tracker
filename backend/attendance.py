import csv
import os
from datetime import datetime

BASE_DIR = os.path.join(os.path.dirname(__file__), "attendance")


def mark_attendance(user_id: str, name: str):
    now = datetime.now()

    month_folder = now.strftime("%B_%Y")
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    month_path = os.path.join(BASE_DIR, month_folder)
    os.makedirs(month_path, exist_ok=True)

    csv_path = os.path.join(month_path, f"{date_str}.csv")

    rows = []

    if os.path.exists(csv_path):
        with open(csv_path, "r", newline="") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

    user_row = None
    for row in rows:
        if row["employee_id"] == user_id:
            user_row = row
            break

    if user_row is None:
        # ➕ First entry → Punch In
        rows.append({
            "employee_id": user_id,
            "name": name,
            "punch_in": time_str,
            "punch_out": ""
        })
        status = "punch_in"

    elif user_row["punch_out"] == "":
        # ➕ Second entry → Punch Out
        user_row["punch_out"] = time_str
        status = "punch_out"

    else:
        # ❌ Already completed attendance
        status = "already_marked"

    with open(csv_path, "w", newline="") as f:
        fieldnames = ["employee_id", "name", "punch_in", "punch_out"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return status, csv_path
