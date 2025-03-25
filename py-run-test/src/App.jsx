import { useState, useEffect } from "react"; // React hooks for managing state and side effects
import io from "socket.io-client"; // Import socket.io for real-time communication

// Initialize socket connection to backend
const socket = io("http://localhost:5000");

function App() {
  // State variables
  const [videoFrame, setVideoFrame] = useState(null); // Stores the video frame data
  const [openCloseCount, setOpenCloseCount] = useState(0); // Tracks the number of hand movements
  const [streaming, setStreaming] = useState(false); // Indicates whether video streaming is active
  const [paused, setPaused] = useState(false); // Indicates if video stream is paused
  const [sessionCompleted, setSessionCompleted] = useState(false); // Tracks if session is completed
  const [countdown, setCountdown] = useState(30); // Timer for rest period (30 seconds)
  const [resting, setResting] = useState(false); // Indicates whether the user is in the resting period

  useEffect(() => {
    // Listen for incoming video frames from the backend
    socket.on("video_feed", (data) => {
      if (!sessionCompleted && !paused) {
        setVideoFrame(`data:image/jpeg;base64,${data.frame}`); // Update video frame
        setOpenCloseCount(data.count); // Update hand movement count
      }
    });

    // Cleanup function to remove event listener
    return () => {
      socket.off("video_feed");
    };
  }, [sessionCompleted, paused]); // Re-run effect when sessionCompleted or paused changes

  useEffect(() => {
    // If hand movement count reaches 15, complete the session and start rest period
    if (openCloseCount >= 15) {
      setSessionCompleted(true);
      setStreaming(false);
      setResting(true); // Enable resting mode
    }
  }, [openCloseCount]); // Re-run effect when openCloseCount changes

  useEffect(() => {
    let timer;
    if (resting && countdown > 0) {
      // Start countdown timer when resting period is active
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1); // Decrease countdown every second
      }, 1000);
    } else if (countdown === 0) {
      // End resting period when countdown reaches 0
      setResting(false);
      setCountdown(30); // Reset countdown for next session
    }
    return () => clearInterval(timer); // Cleanup interval on unmount or countdown change
  }, [resting, countdown]); // Re-run effect when resting or countdown changes

  // Function to start video feed
  const startVideoFeed = () => {
    setOpenCloseCount(0); // Reset hand movement count
    setSessionCompleted(false); // Reset session status
    setResting(false); // Ensure resting is disabled
    setCountdown(30); // Reset countdown timer
    socket.emit("start_video"); // Send event to backend to start video processing
    setStreaming(true); // Enable streaming mode
    setPaused(false); // Ensure video is not paused
  };

  // Toggle Pause & Play for the video stream
  const togglePausePlay = () => {
    setPaused((prev) => !prev);
  };

  // Calculate progress percentage for progress bar
  const progress = (openCloseCount / 15) * 100;

  return (
    <div style={{ 
      textAlign: "center", 
      padding: "460px", 
      color: "white", 
      background: "linear-gradient(to top, #3D0075,#000000)", 
      height: "0vh" 
    }}>
    
      {/* Heading */}
      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#F4C2C2", marginBottom: "10px" }}>
        Hand Exercise - Open & Close
      </h1>

      {/* Description */}
      <p style={{ fontSize: "18px", color: "#ddd", marginBottom: "20px", maxWidth: "600px", margin: "auto", marginBottom: "10px" }}>
        This exercise helps in improving hand mobility. Open and close your hand 
        15 times to complete the session. Track your progress in real-time below.
      </p>

      {/* Show Start Button only if not streaming & not resting */}
      {!streaming && !resting && (
        <button 
          onClick={startVideoFeed} 
          style={{ 
            padding: "20px 10px", 
            fontSize: "18px", 
            cursor: "pointer", 
            background: "#F4C2C2", 
            color: "white", 
            border: "none", 
            borderRadius: "5px" 
          }}
        >
          Start exercise
        </button>
      )}

      {/* Resting Period UI */}
      {resting && (
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#FFA500", marginTop: "20px" }}>
          🏖️ Take Rest: {countdown} sec 🏖️
          <div style={{ marginTop: "10px" }}>
            {/* Button to reduce countdown by 5 seconds */}
            <button 
              onClick={() => setCountdown((prev) => (prev > 5 ? prev - 5 : prev))} 
              style={{ margin: "5px", padding: "10px", background: "#ff4d4d", color: "white", border: "none", borderRadius: "5px" }}>
              ⏪ -5 sec
            </button>
            {/* Button to increase countdown by 5 seconds */}
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
                background: "#D4AF37", 
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

          {/* Pause & Play Button */}
          <button 
            onClick={togglePausePlay} 
            style={{ margin: "10px", padding: "10px", background: "#FFD700", color: "black", border: "none", borderRadius: "5px" }}>
            {paused ? "▶️ Play" : "⏸️ Pause"}
          </button>

          {/* Forward & Backward Buttons (For Next Exercise) */}
          <button 
            style={{ margin: "10px", padding: "10px", background: "#32CD32", color: "white", border: "none", borderRadius: "5px" }}>
            ⏩ Forward (+1)
          </button>
          <button 
            style={{ margin: "10px", padding: "10px", background: "#FF4500", color: "white", border: "none", borderRadius: "5px" }}>
            ⏪ Backward (-1)
          </button>
        </>
      )}
    </div>
  );
}

export default App;
