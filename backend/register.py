import cv2
import pickle
import numpy as np
import os
from face_modal import get_embedding

DB_FILE = os.path.join(os.path.dirname(__file__), "face_database.pkl")

def register_user(user_id, name):
    cap = cv2.VideoCapture(0)
    embeddings = []

    print("Look at the camera. Capturing 5 samples...")

    while len(embeddings) < 5:
        ret, frame = cap.read()
        if not ret:
            continue

        emb = get_embedding(frame)

        if emb is not None:
            embeddings.append(emb)
            print(f"Captured {len(embeddings)}/5")

        cv2.imshow("Register Face", frame)
        cv2.waitKey(500)

    cap.release()
    cv2.destroyAllWindows()

    avg_embedding = np.mean(embeddings, axis=0)

    if os.path.exists(DB_FILE):
        with open(DB_FILE, "rb") as f:
            db = pickle.load(f)
    else:
        db = {}

    db[user_id] = {
        "name": name,
        "embedding": avg_embedding
    }

    with open(DB_FILE, "wb") as f:
        pickle.dump(db, f)

    print("✅ Registration complete")

if __name__ == "__main__":
    uid = input("Enter User ID: ")
    name = input("Enter Name: ")
    register_user(uid, name)
