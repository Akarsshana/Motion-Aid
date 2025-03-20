import cv2
import mediapipe as mp
import numpy as np

mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands

cap = cv2.VideoCapture(0)
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# Counter Variables
hand_state_prev = "Unknown"
open_close_count = 0

def classify_hand_state(landmarks):
    """
    Classifies hand state based on finger curl.
    Returns "Fully Open", "Half Closed", or "Fully Closed".
    """
    global hand_state_prev, open_close_count
    
    # Tip landmarks for each finger (Index, Middle, Ring, Pinky)
    finger_tips = [8, 12, 16, 20]  # Index, Middle, Ring, Pinky tips
    palm_base = landmarks.landmark[0]  # Palm base

    curled_fingers = 0

    for tip in finger_tips:
        fingertip = landmarks.landmark[tip]
        finger_base = landmarks.landmark[tip - 2]  # Compare with DIP joint

        if fingertip.y > finger_base.y:  # If tip is below base, finger is curled
            curled_fingers += 1

    if curled_fingers == 0:
        current_state = "Fully Open"
    elif curled_fingers == 4:
        current_state = "Fully Closed"
    else:
        current_state = "Half Closed"

    # Count open-close cycles
    if hand_state_prev == "Fully Closed" and current_state == "Fully Open":
        open_close_count += 1
    hand_state_prev = current_state

    return current_state

def draw_progress_bar(image, value):
    """
    Draws a progress bar on the screen.
    'value' should be between 0 (fully closed) and 100 (fully open).
    """
    bar_x, bar_y = 50, 400
    bar_width, bar_height = 300, 20
    filled_width = int((value / 100) * bar_width)

    # Bar background
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + bar_width, bar_y + bar_height), (50, 50, 50), -1)
    # Filled portion
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + filled_width, bar_y + bar_height), (0, 255, 0), -1)

while cap.isOpened():
    success, image = cap.read()
    if not success:
        print("Ignoring empty camera frame.")
        continue

    image = cv2.flip(image, 1)  # Flip horizontally
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)  # Convert to RGB
    results = hands.process(image_rgb)

    hand_state = "Unknown"
    progress_value = 0
    hand_color = (255, 255, 255)  # Default white

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            hand_state = classify_hand_state(hand_landmarks)

            # Set hand color and progress bar value
            if hand_state == "Fully Open":
                hand_color = (0, 255, 0)  # Green
                progress_value = 100
            elif hand_state == "Half Closed":
                hand_color = (0, 255, 255)  # Yellow
                progress_value = 50
            elif hand_state == "Fully Closed":
                hand_color = (0, 0, 255)  # Red
                progress_value = 0

            # Draw landmarks with selected color
            mp_drawing.draw_landmarks(
                image, hand_landmarks, mp_hands.HAND_CONNECTIONS,
                mp_drawing.DrawingSpec(color=hand_color, thickness=2, circle_radius=4),
                mp_drawing.DrawingSpec(color=hand_color, thickness=2, circle_radius=2)
            )

    # Draw the progress bar
    draw_progress_bar(image, progress_value)

    # Display hand state and open-close count
    cv2.putText(image, f"Hand: {hand_state}", (50, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, hand_color, 2)
    cv2.putText(image, f"Open-Close Count: {open_close_count}", (50, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    cv2.imshow("Hand Tracker", image)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

