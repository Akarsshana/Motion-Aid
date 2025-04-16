import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import soundOn from "./assets/sound-on.png";
import soundOff from "./assets/sound-off.png";
import musicon from "./assets/music-on.png";
import musicoff from "./assets/music-off.png";

const socket = io("http://localhost:5000");

function ExOne() {
  const [videoFrame, setVideoFrame] = useState(null);
  const [rotationCount, setRotationCount] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [resting, setResting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const navigate = useNavigate();

  const audio = new Audio("/sounds/environment.mp3");
  const BGmusic = new Audio("/sounds/background-music.mp3");
  BGmusic.loop = true;

  useEffect(() => {
    socket.emit("start_rotation");

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
        setCountdown(30);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [streaming, paused, countdown]);

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

  const progress = (rotationCount / 15) * 100;

  return (
    <div style={{
      textAlign: "center",
      padding: "460px",
      color: "white",
      background: "linear-gradient(to top, #3D0075,#000000)",
      height: "0vh"
    }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#F4C2C2", marginTop: "-400px" }}>
        Wrist Rotation Exercise
      </h1>

      <p style={{ fontSize: "18px", color: "#ddd", marginBottom: "20px", maxWidth: "600px", margin: "auto" }}>
        Rotate your wrist to improve mobility. Complete 15 rotations to finish the session. Your progress is tracked live.
      </p>

      {!streaming && !resting && (
        <button
          onClick={() => {
            setStreaming(true);
            setPaused(false);
            setSessionCompleted(false);
            setCountdown(30);
            setRotationCount(0);
          }}
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

          <p style={{ fontSize: "18px", marginTop: "10px" }}>Rotations: {rotationCount} / 15</p>

          {videoFrame && (
            <img
              src={videoFrame}
              alt="Wrist Tracking"
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

          <button
            onClick={() => setPaused(!paused)}
            style={{
              marginLeft: "-200px",
              padding: "10px",
              background: "#F4C2C2",
              color: "black",
              border: "none",
              borderRadius: "10px"
            }}>
            {paused ? "▶️" : "⏸️"}
          </button>

          <button
            onClick={() => navigate("/")}
            style={{
              marginLeft: "-100px",
              padding: "10px",
              background: "#F4C2C2",
              color: "white",
              border: "none",
              borderRadius: "5px"
            }}>
            ⏪
          </button>
        </>
      )}

      {/* 🔊 Sound Toggle Button */}
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

      {/* 🔊 Music Toggle Button */}
      <button
        onClick={toggleMusic}
        style={{
          position: "fixed",
          bottom: "90px",
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
          justifyContent: "center"
        }}
      >
        <img src={isPlayingMusic ? musicon : musicoff} alt="Music Icon" width="24" height="24" />
      </button>
    </div>
  );
}

export default ExOne;
