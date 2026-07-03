from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import cv2
import numpy as np
import pickle
import os
import csv
from pathlib import Path
from attendance import mark_attendance

from auth import authenticate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = r"C:\Users\palya\Desktop\attendance_tracker\Attendance_tracker\backend\face_database.pkl"

if os.path.exists(DB_PATH):
    with open(DB_PATH, "rb") as f:
        face_db = pickle.load(f)
else:
    face_db = {}

class ImagePayload(BaseModel):
    image: str

def decode_image(base64_img: str):
    img_bytes = base64.b64decode(base64_img.split(",")[1])
    img_np = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(img_np, cv2.IMREAD_COLOR)

@app.post("/authenticate")
def authenticate_user(payload: ImagePayload):
    if not os.path.exists(DB_PATH):
        return {"status": "fail", "message": "No registered users"}

    # 🔥 Always reload DB
    with open(DB_PATH, "rb") as f:
        face_db = pickle.load(f)

    print("DB users at auth:", face_db.keys())

    frame = decode_image(payload.image)
    user_id, dist = authenticate(frame, face_db)
    print("AUTH RESULT:", user_id, dist)

    if user_id is None:
        return {
            "status": "fail",
            "message": "Face not recognized"
        }
    
    # ✅ Mark attendance
    status, file_path = mark_attendance(
        user_id=user_id,
        name=face_db[user_id]["name"]
    )
    
    return {
        "status": "success",
        "user": face_db[user_id]["name"],
        "attendance": status,
        "file": file_path,
        "distance": float(dist)
    }

ATTENDANCE_DIR = Path(r"C:\Users\palya\Desktop\attendance_tracker\Attendance_tracker\backend\attendance")

@app.get("/admin/attendance")
def get_attendance_data():
    attendance = {}
    if not ATTENDANCE_DIR.exists():
        return {"attendance": {}}

    for month_folder in sorted(ATTENDANCE_DIR.iterdir()):
        if not month_folder.is_dir():
            continue
        for csv_file in sorted(month_folder.glob("*.csv")):
            date_str = csv_file.stem
            records = []
            with open(csv_file, newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append({
                        "employee_id": row.get("employee_id", ""),
                        "name": row.get("name", ""),
                        "punch_in": row.get("punch_in", ""),
                        "punch_out": row.get("punch_out", ""),
                    })
            attendance[date_str] = {
                "month": month_folder.name,
                "records": records,
            }

    return {"attendance": attendance}

@app.get("/admin/summary")
def get_summary():
    summary = {}
    if not ATTENDANCE_DIR.exists():
        return {"summary": {}}

    for month_folder in ATTENDANCE_DIR.iterdir():
        if not month_folder.is_dir():
            continue
        for csv_file in month_folder.glob("*.csv"):
            date_str = csv_file.stem
            total = 0
            punched_out = 0
            still_in = 0
            with open(csv_file, newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    total += 1
                    if row.get("punch_out", "").strip():
                        punched_out += 1
                    else:
                        still_in += 1
            summary[date_str] = {
                "total": total,
                "punched_out": punched_out,
                "still_in": still_in,
            }

    return {"summary": summary}
