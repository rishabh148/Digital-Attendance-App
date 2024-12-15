import face_recognition
import cv2
import os
import numpy as np
import json


class SimpleFacerec:
    def __init__(self):
        self.frame_resizing = 0.25
        self.trained_model_path = "./trained_model.json"

    def load_encoding_image(self, image_path):
        print("Loading encoding image: ", image_path)
        img = cv2.imread(image_path)

        if img is None:
            print("Error: Unable to read the image at ", image_path)
            return

        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_encodings = face_recognition.face_encodings(rgb_img)

        if len(face_encodings) == 0:
            print("Error: No face found in the image ", image_path)
            return

        img_encoding = face_encodings[0]

        print("Encoding image loaded")
        return img_encoding

    # Other methods remain unchanged

    def detect_known_face(self, frame):
        small_frame = cv2.resize(
            frame, (0, 0), fx=self.frame_resizing, fy=self.frame_resizing
        )

        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(
            rgb_small_frame, face_locations
        )

        if not face_encodings:
            return "Unknown"

        with open(self.trained_model_path, "r") as f:
            data = json.load(f)
        known_face_encodings = data["known_face_encodings"]
        known_face_names = data["known_face_names"]

        face_distances = face_recognition.face_distance(
            known_face_encodings, face_encodings[0]
        )

        best_match_index = np.argmin(face_distances)
        if face_distances[best_match_index] < 0.6:
            return known_face_names[best_match_index]

        return "Unknown"

    def save_encoding(self, photo_path):
        basename = os.path.basename(photo_path)
        (name, ext) = os.path.splitext(basename)

        enc = self.load_encoding_image(photo_path)

        encodings = enc.tolist()
        names = str(name)

        with open(self.trained_model_path, "r") as f:
            data = json.load(f)

        known_face_encodings = data["known_face_encodings"]
        known_face_names = data["known_face_names"]

        if names in known_face_names:
            index = known_face_names.index(names)
            del known_face_encodings[index]
            del known_face_names[index]

        known_face_encodings.append(encodings)
        known_face_names.append(names)

        with open(self.trained_model_path, "w") as f:
            json.dump(data, f)
