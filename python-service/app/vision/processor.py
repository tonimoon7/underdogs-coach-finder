import cv2
import mediapipe as mp
import numpy as np
import math

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

def get_face_landmarks(image):
    """
    Detects face and returns the bounding box and landmarks (eyes, nose, etc.)
    """
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb_image)
    
    if not results.detections:
        return None
        
    # Assume the most prominent face is the main coach profile
    detection = results.detections[0]
    bboxC = detection.location_data.relative_bounding_box
    
    ih, iw, _ = image.shape
    bbox = {
        'xmin': int(bboxC.xmin * iw),
        'ymin': int(bboxC.ymin * ih),
        'width': int(bboxC.width * iw),
        'height': int(bboxC.height * ih)
    }
    
    landmarks = {}
    for i, keypoint in enumerate(detection.location_data.relative_keypoints):
        # MediaPipe BlazeFace Keypoints: 0=Right Eye, 1=Left Eye, 2=Nose Tip, 3=Mouth Center, 4=Right Ear, 5=Left Ear
        # Note: Right/Left from the user's perspective
        landmarks[i] = (int(keypoint.x * iw), int(keypoint.y * ih))
        
    return bbox, landmarks

def correct_rotation(image, landmarks):
    """
    Corrects the tilt of the head based on the eye alignment.
    landmarks[0] is right eye, landmarks[1] is left eye (from image perspective)
    """
    if 0 not in landmarks or 1 not in landmarks:
        return image
        
    right_eye = landmarks[0]
    left_eye = landmarks[1]
    
    # Calculate angle using arctan2
    dY = right_eye[1] - left_eye[1]
    dX = right_eye[0] - left_eye[0]
    angle = np.degrees(np.arctan2(dY, dX)) - 180
    
    # Correct angle if it's upside down or weirdly detected
    if angle < -90:
        angle += 180
        
    # Rotate the image
    center = (image.shape[1] // 2, image.shape[0] // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (image.shape[1], image.shape[0]), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return rotated

def smart_crop(image, bbox, target_ratio=(3, 4), face_coverage=0.5):
    """
    Crops the image so that the face takes up `face_coverage` proportion of the height.
    """
    ih, iw, _ = image.shape
    face_height = bbox['height']
    center_y = bbox['ymin'] + face_height // 2
    center_x = bbox['xmin'] + bbox['width'] // 2
    
    # Desired total height
    target_height = int(face_height / face_coverage)
    target_width = int(target_height * (target_ratio[0] / target_ratio[1]))
    
    # Calculate crop boundaries
    y1 = max(0, center_y - int(target_height * 0.4)) # Leave more space on top
    y2 = min(ih, y1 + target_height)
    
    x1 = max(0, center_x - target_width // 2)
    x2 = min(iw, x1 + target_width)
    
    cropped = image[y1:y2, x1:x2]
    # Resize to standard size (e.g., 600x800)
    final_image = cv2.resize(cropped, (600, 800))
    return final_image

def process_coach_image(image_path, output_path):
    """
    Full pipeline: Read -> Detect -> Rotate -> Crop -> Grayscale -> Save
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not read image {image_path}")
        
    data = get_face_landmarks(image)
    if not data:
        # Fallback if no face detected: just resize and grayscale
        resized = cv2.resize(image, (600, 800))
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        cv2.imwrite(output_path, gray)
        return False
        
    bbox, landmarks = data
    rotated = correct_rotation(image, landmarks)
    
    # After rotation, we should ideally re-detect face, but we'll approximate with old bbox center
    # For robustness, let's re-detect
    data_rotated = get_face_landmarks(rotated)
    if data_rotated:
        bbox, _ = data_rotated
        
    cropped = smart_crop(rotated, bbox)
    
    # Apply grayscale
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    
    # Optional: Histogram Equalization to normalize contrast
    equ = cv2.equalizeHist(gray)
    
    cv2.imwrite(output_path, equ)
    return True
