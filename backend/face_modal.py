import insightface
import numpy as np

model = insightface.app.FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)
model.prepare(ctx_id=0)

def l2_normalize(x):
    return x / np.linalg.norm(x)

def get_embedding(bgr_frame: np.ndarray):
    faces = model.get(bgr_frame)

    if len(faces) == 0:
        print("❌ No face detected")
        return None

    best_face = max(faces, key=lambda f: f.det_score)
    print(f"👤 Faces detected: {len(faces)} | Best det_score: {best_face.det_score:.2f}")

    if best_face.det_score < 0.45:
        print("❌ Face confidence too low")
        return None

    emb = best_face.embedding
    emb = l2_normalize(emb)   # 🔥 THIS IS THE FIX

    return emb
