from flask import Flask, request, jsonify
import cv2
import numpy as np
from test import islive


app = Flask(__name__)


@app.route("/detect_liveness", methods=["POST"])
def detect_liveness():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"})
    print("hi")
    # Read the encoded image directly as binary data
    file = request.files["image"]
    encoded_image = file.read()

    # Convert the binary data back to NumPy array
    nparr = np.frombuffer(encoded_image, np.uint8)
    image_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    label, value = islive(image_np)
    # result = result.tolist()
    return str(label) + " " + str(value)


if __name__ == "__main__":
    app.run(debug=True)
