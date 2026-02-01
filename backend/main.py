from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import cv2
import numpy as np
import pickle
import os
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
