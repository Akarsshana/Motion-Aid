import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function App() {
  const [frame, setFrame] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.emit("start_video"); // Start video stream when component mounts

    socket.on("video_feed", (data) => {
      setFrame("data:image/jpeg;base64," + data); // Update image frame
    });

    return () => socket.disconnect(); // Cleanup on unmount
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Hand Tracking Webcam</h1>
      {frame ? (
        <img src={frame} alt="Webcam Stream" style={{ width: "640px", height: "480px" }} />
      ) : (
        <p>Waiting for video...</p>
      )}
    </div>
  );
}

export default App;
