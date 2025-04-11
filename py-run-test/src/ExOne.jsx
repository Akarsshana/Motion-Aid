import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client"; // Import socket.io for real-time communication
import soundOn from "./assets/sound-on.png";
import soundOff from "./assets/sound-off.png";
import musicon from "./assets/music-on.png";
import musicoff from "./assets/music-off.png";

const socket = io("http://localhost:5000"); // Connect to your Flask server

function ExOne() {
  const [videoFrame, setVideoFrame] = useState(null);
  const [rotationCount, setRotationCount] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [resting, setResting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // For environment sound toggle
  const [isPlayingMusic, setIsPlayingMusic] = useState(false); // For background music

  const navigate = useNavigate();

  const audio = new Audio("/sounds/environment.mp3"); // Environment sound
  const BGmusic = new Audio("/sounds/background-music.mp3"); // Background music
  BGmusic.loop = true;

  useEffect(() => {
    socket.emit("start_rotation"); // Tell the server to start processing rotation when component mounts

    socket.on("rotation_feed", (data) => {
      if (!sessionCompleted && !paused) {
        setVideoFrame(`data:image/jpeg;base64,${data.image}`);
        setRotationCount(data.count);
      }
    });

    return () => {
      socket.off("rotation_feed");
    };
  }, [sessionCompleted, paused]);

  // Countdown logic
  useEffect(() => {
    let timer;
    if (streaming && !paused && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setResting(true);
      setStreaming(false);
      setSessionCompleted(true);
      setTimeout(() => {
        setResting(false);
        setCountdown(30); // Reset countdown for next session
      }, 10000); // 10 sec rest
    }
    return () => clearTimeout(timer);
  }, [streaming, paused, countdown]);

  // Audio toggle functions
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
    setIsPlayingMusic(!isPlayingMusic);
  };

  return (
    <div className="App">
      <h1>Wrist Rotation Counter</h1>

      <div>
        {videoFrame ? (
          <img
            src={videoFrame}
            alt="Video Feed"
            style={{ width: "640px", height: "480px", borderRadius: "10px" }}
          />
        ) : (
          <p>Waiting for camera...</p>
        )}
      </div>

      <h2>Rotations: {rotationCount}</h2>

      <div style={{ marginTop: "20px" }}>
        {resting ? (
          <h2>Resting... Next session starts soon!</h2>
        ) : sessionCompleted ? (
          <button onClick={() => {
            setSessionCompleted(false);
            setCountdown(30);
            setStreaming(true);
          }}>
            Start Next Session
          </button>
        ) : streaming ? (
          <button onClick={() => setPaused(!paused)}>
            {paused ? "Resume" : "Pause"}
          </button>
        ) : (
          <button onClick={() => setStreaming(true)}>Start Counting</button>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <img
          src={isPlaying ? soundOn : soundOff}
          alt="Toggle Environment Sound"
          style={{ width: "50px", marginRight: "20px", cursor: "pointer" }}
          onClick={toggleSound}
        />
        <img
          src={isPlayingMusic ? musicon : musicoff}
          alt="Toggle Background Music"
          style={{ width: "50px", cursor: "pointer" }}
          onClick={toggleMusic}
        />
      </div>
    </div>
  );
}

export default ExOne;
