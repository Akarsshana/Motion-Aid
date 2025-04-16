import cv2
import mediapipe as mp
import numpy as np
import base64
from flask import Flask
from flask_socketio import SocketIO
import threading

# Flask + WebSocket setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# MediaPipe setup
mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Webcam
cap = cv2.VideoCapture(0)

# Shared state for both features
open_close_count = 0
hand_state_prev = "Unknown"
rotation_count = 0
previous_angle = None
rotated_once = False

# Lock for thread-safe shared access
lock = threading.Lock()

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

def calculate_wrist_angle(landmarks):
    wrist = landmarks.landmark[0]
    middle_mcp = landmarks.landmark[9]
    dx = middle_mcp.x - wrist.x
    dy = middle_mcp.y - wrist.y
    angle = np.arctan2(dy, dx) * 180 / np.pi
    return angle

# Thread 1: Hand open-close tracker
@socketio.on("start_video")
def start_video():
    global open_close_count
    while True:
        with lock:
            success, image = cap.read()
        if not success:
            continue

        image = cv2.flip(image, 1)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        hand_state = "Unknown"
        node_color = (0, 255, 0)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                hand_state = classify_hand_state(hand_landmarks)
                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                                          mp_drawing.DrawingSpec(color=node_color, thickness=2, circle_radius=4),
                                          mp_drawing.DrawingSpec(color=node_color, thickness=2, circle_radius=2))

        cv2.putText(image, f"Hand: {hand_state}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, node_color, 2)
        cv2.putText(image, f"Open-Close Count: {open_close_count}", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

        _, buffer = cv2.imencode(".jpg", image)
        frame_data = base64.b64encode(buffer).decode("utf-8")
        socketio.emit("video_feed", {"frame": frame_data, "count": open_close_count})

# Thread 2: Wrist rotation tracker
@socketio.on("start_rotation")
def start_rotation():
    global previous_angle, rotation_count, rotated_once
    while True:
        with lock:
            success, image = cap.read()
        if not success:
            continue

        image = cv2.flip(image, 1)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        wrist_rotation_status = "No Hand Detected"
        node_color = (255, 0, 255)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                current_angle = calculate_wrist_angle(hand_landmarks)

                if previous_angle is not None:
                    diff = current_angle - previous_angle
                    if diff > 180:
                        diff -= 360
                    elif diff < -180:
                        diff += 360

                    if abs(diff) > 30:
                        if not rotated_once:
                            rotation_count += 1
                            rotated_once = True
                else:
                    rotated_once = False

                previous_angle = current_angle
                wrist_rotation_status = f"Rotations: {rotation_count}"

                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                                          mp_drawing.DrawingSpec(color=node_color, thickness=2, circle_radius=4),
                                          mp_drawing.DrawingSpec(color=node_color, thickness=2, circle_radius=2))

        else:
            rotated_once = False
            previous_angle = None

        cv2.putText(image, wrist_rotation_status, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, node_color, 2)

        _, buffer = cv2.imencode(".jpg", image)
        frame_data = base64.b64encode(buffer).decode("utf-8")
        socketio.emit("rotation_feed", {"image": frame_data, "count": rotation_count})

# Run the Flask app
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
