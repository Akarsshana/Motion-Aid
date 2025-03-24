import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [videoFrame, setVideoFrame] = useState(null);
  const [openCloseCount, setOpenCloseCount] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30-sec rest timer
  const [resting, setResting] = useState(false); // Check if resting period is active

  useEffect(() => {
    socket.on("video_feed", (data) => {
      if (!sessionCompleted) {
        setVideoFrame(`data:image/jpeg;base64,${data.frame}`);
        setOpenCloseCount(data.count);
      }
    });

    return () => {
      socket.off("video_feed");
    };
  }, [sessionCompleted]);

  useEffect(() => {
    if (openCloseCount >= 15) {
      setSessionCompleted(true);
      setStreaming(false);
      setResting(true); // Start the resting period
    }
  }, [openCloseCount]);

  useEffect(() => {
    let timer;
    if (resting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResting(false); // End resting period
      setCountdown(30); // Reset countdown for next session
    }
    return () => clearInterval(timer);
  }, [resting, countdown]);

  const startVideoFeed = () => {
    setOpenCloseCount(0);
    setSessionCompleted(false);
    setResting(false);
    setCountdown(30);
    socket.emit("start_video");
    setStreaming(true);
  };

  const progress = (openCloseCount / 15) * 100;

  return (
    <div style={{ textAlign: "center", padding: "400px", color: "white", background: "#222", height: "100vh" }}>
      {/* Show Start Button only if not streaming & not resting */}
      {!streaming && !resting && (
        <button 
          onClick={startVideoFeed} 
          style={{ 
            padding: "15px 30px", 
            fontSize: "18px", 
            cursor: "pointer", 
            background: "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "5px" 
          }}
        >
          Start Video
        </button>
      )}

      {/* Resting Period UI */}
      {resting && (
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#FFA500", marginTop: "20px" }}>
          🏖️ Take Rest: {countdown} sec 🏖️
          <div style={{ marginTop: "10px" }}>
            <button 
              onClick={() => setCountdown((prev) => (prev > 5 ? prev - 5 : prev))} 
              style={{ margin: "5px", padding: "10px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "5px" }}>
              ⏪ -5 sec
            </button>
            <button 
              onClick={() => setCountdown((prev) => prev + 5)} 
              style={{ margin: "5px", padding: "10px", background: "#4da6ff", color: "white", border: "none", borderRadius: "5px" }}>
              ⏩ +5 sec
            </button>
          </div>
        </div>
      )}

      {/* Streaming UI */}
      {streaming && (
        <>
          {/* Progress Bar */}
          <div style={{ width: "50%", background: "#555", height: "20px", borderRadius: "10px", margin: "20px auto" }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                background: "#28a745", 
                height: "100%", 
                borderRadius: "10px", 
                transition: "width 0.3s" 
              }} 
            />
          </div>

          {/* Hand Movement Count */}
          <p style={{ fontSize: "18px", marginTop: "10px" }}>Hand Movements: {openCloseCount} / 15</p>

          {/* Video Frame (Top-Right Corner) */}
          {videoFrame && (
            <img 
              src={videoFrame} 
              alt="Hand Tracking" 
              style={{
                width: "420px",
                height: "340px",
                border: "3px solid white",
                borderRadius: "10px",
                position: "absolute",
                top: "20px",
                right: "20px",
              }} 
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
