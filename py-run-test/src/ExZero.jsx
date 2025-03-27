import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"; // React hooks for managing state and side effects
import io from "socket.io-client"; // Import socket.io for real-time communication
import soundOn from "./assets/sound-on.png";
import soundOff from "./assets/sound-off.png";
import musicon from "./assets/music-on.png";
import musicoff from "./assets/music-off.png";

const socket = io("http://localhost:5000");

function App() {
  const [videoFrame, setVideoFrame] = useState(null);
  const [openCloseCount, setOpenCloseCount] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [resting, setResting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // For sound toggle
  const [isPlayingMusic, setisPlayingMusic] = useState(false);

  const navigate = useNavigate(); // Initialize navigate function

  const audio = new Audio("/sounds/environment.mp3"); // Replace with your actual sound file
  const BGmusic = new Audio("/sounds/background-music.mp3");
  BGmusic.loop = true;

  useEffect(() => {
    socket.on("video_feed", (data) => {
      if (!sessionCompleted && !paused) {
        setVideoFrame(`data:image/jpeg;base64,${data.frame}`);
        setOpenCloseCount(data.count);
      }
    });

    return () => {
      socket.off("video_feed");
    };
  }, [sessionCompleted, paused]);

  useEffect(() => {
    if (openCloseCount >= 15) {
      setSessionCompleted(true);
      setStreaming(false);
      setResting(true);
    }
  }, [openCloseCount]);

  useEffect(() => {
    let timer;
    if (resting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResting(false);
      setCountdown(30);
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
    setPaused(false);
  };

  const togglePausePlay = () => {
    setPaused((prev) => !prev);
  };

  const toggleSound = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMusic = () => {
    if (isPlayingMusic) {
      BGmusic.pause();
    } else {
      BGmusic.play();
    }
    setisPlayingMusic(!isPlayingMusic);
  };

  const progress = (openCloseCount / 15) * 100;

  return (
    <div style={{ 
      textAlign: "center", 
      padding: "460px", 
      color: "white", 
      background: "linear-gradient(to top, #3D0075,#000000)", 
      height: "0vh" 
    }}>
    
      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#F4C2C2", marginTop: "-400px" }}>
        Hand Exercise - Open & Close
      </h1>

      <p style={{ fontSize: "18px", color: "#ddd", marginBottom: "20px", maxWidth: "600px", margin: "auto" }}>
        This exercise helps in improving hand mobility. Open and close your hand 
        15 times to complete the session. Track your progress in real-time below.
      </p>

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
            borderRadius: "5px",
            marginTop: "300px"
          }}
        >
          Start exercise
        </button>
      )}

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

      {streaming && (
        <>
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

          <p style={{ fontSize: "18px", marginTop: "10px" }}>Hand Movements: {openCloseCount} / 15</p>

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

          {/* ⏩ Back Button */}
          <button 
            onClick={() => navigate("/exone")} 
            style={{ 
              marginRight: "100px", 
              padding: "10px", 
              background: "#F4C2C2", 
              color: "white", 
              border: "none", 
              borderRadius: "5px" 
            }}
          >
            ⏩
          </button>

          <button 
            onClick={togglePausePlay} 
            style={{ marginLeft: "-200px", padding: "10px", background: "#F4C2C2", color: "black", border: "none", borderRadius: "10px" }}>
            {paused ? "▶️ " : "⏸️"}
          </button>

          <button 
            style={{ marginLeft: "-100px", padding: "10px", background: "#F4C2C2", color: "white", border: "none", borderRadius: "5px" }}>
            ⏪
          </button>
          
        </>
      )}
      {/* 🔊 Sound Toggle Button (Bottom-Left) */}
      <button 
        onClick={toggleSound} 
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          fontSize: "20px",
          background: isPlaying ? "#F4C2C2" : "#F4C2C2",
          color: "white",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "650px"
        }}
      >
        <img src={isPlaying ? soundOn : soundOff} alt="Sound Icon" width="24" height="24" />
      </button>

       {/* 🔊 Music Toggle Button (Bottom-Left) */}
       <button 
        onClick={toggleMusic} 
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          fontSize: "20px",
          background: isPlayingMusic ? "#F4C2C2" : "#F4C2C2",
          color: "white",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "580px"
        }}
      >
        <img src={isPlayingMusic ? musicon : musicoff} alt="Sound Icon" width="24" height="24" />
      </button>

    </div>

    
  );
  
}

export default App;
