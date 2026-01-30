import pickle
import os

DB_PATH = r"C:\Users\palya\Desktop\attendance_tracker\face_database.pkl"

if not os.path.exists(DB_PATH):
    print("❌ face_database.pkl does NOT exist")
    exit()

with open(DB_PATH, "rb") as f:
    db = pickle.load(f)

print("✅ DB loaded successfully")
print("Registered users:", db.keys())
