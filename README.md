<p align="center">
  <img src="assets/logo.svg" alt="Face Authentication Attendance System" width="420"/>
</p>

<h2 align="center">Face Authentication Attendance System</h2>

<p align="center">
A local, AI-powered attendance system using face authentication with automatic punch-in and punch-out.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-InsightFace-green"/>
  <img src="https://img.shields.io/badge/Backend-FastAPI-blue"/>
  <img src="https://img.shields.io/badge/Frontend-React-61dafb"/>
  <img src="https://img.shields.io/badge/Mode-Local%20Demo-success"/>
</p>

---

## 📌 Overview

This project implements a **face authentication–based attendance system** designed for local use and demonstrations.  
It allows users to **register their face**, authenticate in real time using a webcam, and automatically mark **punch-in and punch-out** attendance.

The system is built with a **FastAPI backend**, a **React frontend**, and a **pretrained ArcFace model (InsightFace)** for robust face recognition.

---

## ✨ Key Features

- Real-time face registration using webcam
- Face authentication with pretrained **ArcFace embeddings**
- Automatic punch-in / punch-out logic
- One attendance entry per employee per day
- Attendance stored as structured CSV files
- Month-wise and day-wise attendance folders
- Works locally (no cloud, no deployment required)
- Stable on Windows (no dlib dependency)

---

## 🧠 Face Recognition Approach

- Uses **InsightFace (ArcFace)** pretrained model
- Extracts **512-dimensional face embeddings**
- Embeddings are **L2-normalized** for reliable comparison
- Face matching done using **Euclidean distance**
- Threshold-based verification for recognition

This approach ensures consistent performance while keeping the system lightweight and easy to run locally.

---

## 🛡️ Spoof Prevention (Basic Attempt)

The system includes **basic liveness heuristics**, suitable for an intern-level project:

- Only one face allowed per frame
- Detection confidence threshold enforced
- Rejects low-quality or blurry detections
- Uses live webcam input (no image uploads)

> Note: Advanced spoof prevention (blink detection, depth sensing) is intentionally out of scope.

---

## ⏱️ Attendance Logic

Each employee can have **only one attendance record per day**.

| Authentication Attempt | Action Taken |
|------------------------|--------------|
| First successful scan  | Punch-In     |
| Second successful scan | Punch-Out    |
| Further scans          | Ignored      |

---

## 📁 Attendance Storage Format

### Folder Structure
backend/attendance/
└── September_2026/
└── 2026-09-21.csv

perl
Copy code

### CSV Format
```csv
employee_id,name,punch_in,punch_out
yashikapal,Yashika Pal,09:42:11,17:31:02
Each CSV file represents one day

Each employee appears only once per day

🏗️ Project Structure
Attendance_tracker/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── register.py          # Face registration
│   ├── auth.py              # Authentication logic
│   ├── face_model.py        # InsightFace integration
│   ├── attendance.py        # CSV attendance handling
│   ├── face_database.pkl    # Stored face embeddings
│   └── attendance/
│       └── Month_Year/
│           └── YYYY-MM-DD.csv
│
└── frontend/
    ├── src/
    ├── package.json
    └── ...
▶️ How to Run the Project (Local)

1️⃣ Create & Activate Environment
conda create -n wave-motion python=3.10
conda activate wave-motion

2️⃣ Install Dependencies
pip install fastapi uvicorn opencv-python numpy insightface onnxruntime pydantic

3️⃣ Register a User
cd backend
python register.py
Follow the instructions and look at the camera.

4️⃣ Start Backend
uvicorn main:app --reload
Backend runs at:
http://127.0.0.1:8000

5️⃣ Start Frontend
cd frontend
npm install
npm run dev
```
📊 Accuracy Expectations
High accuracy for registered users

Performance depends on:
Lighting conditions
Camera quality
Face visibility
Thresholds tuned for local demo usage

⚠️ Known Limitations
No advanced liveness detection
Single-face scenarios only
CSV-based storage (not database-backed)
No user roles or authentication layers

🚀 Future Improvements
Advanced spoof detection (blink / depth)
Database-backed attendance
Admin dashboard & analytics
CSV export & reporting
Cloud deployment
Multi-user & multi-camera support

👤 Author
Yashika Pal
AI / ML Intern Candidate

This project demonstrates practical skills in:
Applied machine learning
Pretrained model integration
Backend system design
Real-world debugging and trade-offs







