import { useEffect, useRef, useState } from "react";

function App() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Idle");
  const [loading, setLoading] = useState(false);

  // Start webcam
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setStatus("Camera access denied");
      });
  }, []);

  const captureAndAuthenticate = async () => {
    setLoading(true);
    setStatus("Processing...");

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("http://127.0.0.1:8000/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: imageBase64 })
      });

      const data = await res.json();

      if (data.status === "success") {
        setStatus(`✅ ${data.user} attendance marked`);
      } else {
        setStatus(`❌ ${data.message}`);
      }
    } catch (err) {
      setStatus("❌ Backend not reachable");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: "360px"
        }}
      >
        <h2>Face Attendance System</h2>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="320"
          height="240"
          style={{ border: "2px solid black" }}
        />

        <br /><br />

        <button
          onClick={captureAndAuthenticate}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px"
          }}
        >
          {loading ? "Processing..." : "Punch In / Out"}
        </button>

        <p style={{ marginTop: "15px" }}>{status}</p>

        <p style={{ fontSize: "12px", color: "#666" }}>
          Blink once before clicking
        </p>
      </div>
    </div>
  );
}

export default App;
