import cv2
import mediapipe as mp
import numpy as np
import base64
from flask_socketio import SocketIO
from flask import Flask

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands

cap = cv2.VideoCapture(0)
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

hand_state_prev = "Unknown"
open_close_count = 0

def classify_hand_state(landmarks):
    global hand_state_prev, open_close_count

    finger_tips = [8, 12, 16, 20]
    curled_fingers = sum(1 for tip in finger_tips if landmarks.landmark[tip].y > landmarks.landmark[tip - 2].y)

    if curled_fingers == 0:
        current_state = "Fully Open"
    elif curled_fingers == 4:
        current_state = "Fully Closed"
    else:
        current_state = "Half Closed"

    if hand_state_prev == "Fully Closed" and current_state == "Fully Open":
        open_close_count += 1

    hand_state_prev = current_state
    return current_state

@socketio.on("start_video")
def start_video():
    global open_close_count

    while True:
        success, image = cap.read()
        if not success:
            continue

        image = cv2.flip(image, 1)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        hand_state = "Unknown"

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                hand_state = classify_hand_state(hand_landmarks)
                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        cv2.putText(image, f"Hand: {hand_state}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        cv2.putText(image, f"Open-Close Count: {open_close_count}", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

        _, buffer = cv2.imencode(".jpg", image)
        frame_data = base64.b64encode(buffer).decode("utf-8")

        socketio.emit("video_feed", {"frame": frame_data, "count": open_close_count})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
