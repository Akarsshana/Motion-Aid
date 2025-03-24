import cv2  # OpenCV for video processing
import mediapipe as mp  # MediaPipe for hand tracking
import numpy as np  # NumPy for numerical operations
import base64  # Base64 encoding for sending images as text data
from flask_socketio import SocketIO  # WebSocket support for real-time video streaming
from flask import Flask  # Flask framework for web applications

# Initialize Flask app
app = Flask(__name__)
# Initialize SocketIO for real-time communication (WebSockets)
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow connections from any origin

# Initialize MediaPipe drawing and hand tracking modules
mp_drawing = mp.solutions.drawing_utils  # Utility to draw landmarks
mp_hands = mp.solutions.hands  # Load MediaPipe Hands model

# Open webcam for capturing video
cap = cv2.VideoCapture(0)
# Initialize MediaPipe Hands with detection and tracking confidence thresholds
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Variables for tracking hand states
hand_state_prev = "Unknown"  # Store the previous state of the hand
open_close_count = 0  # Counter to track the number of times hand fully opens after being closed

def classify_hand_state(landmarks):
    """
    Function to determine the hand state (Fully Open, Half Closed, Fully Closed) based on finger positions.
    Also increments open-close count when transitioning from Fully Closed to Fully Open.
    """
    global hand_state_prev, open_close_count  # Use global variables

    # Landmark indices for fingertips (excluding thumb)
    finger_tips = [8, 12, 16, 20]

    # Count how many fingers are curled (finger tip is lower than its base)
    curled_fingers = sum(1 for tip in finger_tips if landmarks.landmark[tip].y > landmarks.landmark[tip - 2].y)

    # Determine hand state based on curled fingers count
    if curled_fingers == 0:
        current_state = "Fully Open"
    elif curled_fingers == 4:
        current_state = "Fully Closed"
    else:
        current_state = "Half Closed"

    # Increment count when hand transitions from Fully Closed to Fully Open
    if hand_state_prev == "Fully Closed" and current_state == "Fully Open":
        open_close_count += 1

    hand_state_prev = current_state  # Update previous state
    return current_state  # Return the detected hand state

@socketio.on("start_video")
def start_video():
    """
    WebSocket event handler to start video streaming when 'start_video' event is received.
    Processes frames, detects hand state, and sends them to the frontend.
    """
    global open_close_count  # Use the global counter variable

    while True:
        success, image = cap.read()  # Capture frame from webcam
        if not success:
            continue  # Skip frame if capture fails

        image = cv2.flip(image, 1)  # Flip the image horizontally for a mirror effect
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)  # Convert frame to RGB format
        results = hands.process(image_rgb)  # Process frame for hand detection

        hand_state = "Unknown"  # Default hand state

        if results.multi_hand_landmarks:  # If a hand is detected
            for hand_landmarks in results.multi_hand_landmarks:
                hand_state = classify_hand_state(hand_landmarks)  # Classify the hand state
                # Draw hand landmarks on the image
                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        # Display hand state and open-close count on the video feed
        cv2.putText(image, f"Hand: {hand_state}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        cv2.putText(image, f"Open-Close Count: {open_close_count}", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

        # Encode the frame as JPEG and convert to base64 string for transmission
        _, buffer = cv2.imencode(".jpg", image)
        frame_data = base64.b64encode(buffer).decode("utf-8")

        # Send frame and count data to the frontend via WebSocket
        socketio.emit("video_feed", {"frame": frame_data, "count": open_close_count})

if __name__ == "__main__":
    # Start Flask-SocketIO server, accessible over the local network
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)
