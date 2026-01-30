import numpy as np
from face_modal import get_embedding

def authenticate(frame, face_db, threshold=1.1):
    emb = get_embedding(frame)

    if emb is None:
        return None, None

    best_user = None
    min_dist = float("inf")

    for user_id, data in face_db.items():
        dist = np.linalg.norm(emb - data["embedding"])
        if dist < min_dist:
            min_dist = dist
            best_user = user_id

    print(f"🔍 Best match distance: {min_dist:.3f}")

    if min_dist < threshold:
        return best_user, min_dist

    return None, min_dist
