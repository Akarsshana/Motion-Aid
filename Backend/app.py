from flask import Flask, render_template
from flask_socketio import SocketIO
import cv2
import mediapipe as mp
import numpy as np
import base64

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def generate_frames():
    cap = cv2.VideoCapture(0)  # Open webcam
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)  # Flip horizontally
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        _, buffer = cv2.imencode(".jpg", frame)
        base64_frame = base64.b64encode(buffer).decode("utf-8")  # Convert to base64

        socketio.emit("video_feed", base64_frame)  # Send frame to frontend

    cap.release()

@socketio.on("start_video")
def start_video():
    generate_frames()

@app.route("/")
def index():
    return "Flask WebSocket Server is Running"

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
