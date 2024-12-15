import io
from flask import Flask, render_template, url_for, request, session, redirect, jsonify
import cv2
import base64
import requests
import json
from flask_pymongo import PyMongo
from simple_facerec import SimpleFacerec
import bcrypt
from datetime import datetime
from flask_cors import CORS
import os

sfr = SimpleFacerec()

# Assuming your existing column headers are "Time stamp" and "Detected Names"
timestamp_column_header = "Time stamp"
column_header = "Name"

app = Flask(__name__)
CORS(app)

app.config["MONGO_DBNAME"] = "Facerecog"
app.config["MONGO_URI"] = (
    "mongodb+srv://piyushdevan:Devan2003@facerecog.wkmsdvu.mongodb.net/Facerecog"
)

photo_dir = "./photos"
model_path = "./trained_model.json"

mongo = PyMongo(app)


@app.route("/")
def index():
    if "username" in session:  # Check for user in session
        return render_template("layout.html")
    else:
        return render_template("index.html")


@app.route("/register", methods=["POST"])
def register():
    if request.method == "POST":
        # Receive data from form
        username = request.form.get("username")
        password = request.form.get("password")
        name = request.form.get("name")
        role = request.form.get("role")
        scholar_id = request.form.get("scholarId")

        # Check if username already exists
        existing_user = mongo.db.user.find_one({"username": username})
        existing_scholar_id = mongo.db.user.find_one({"scholar_id": scholar_id})
        if existing_user or existing_scholar_id:
            return (
                jsonify(
                    {
                        "message": "user already exists! Try changing username or scholar_id"
                    }
                ),
                400,
            )

        # Hash password
        hashpass = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # Save user data to MongoDB
        mongo.db.user.insert_one(
            {
                "username": username,
                "password": hashpass,
                "name": name,
                "role": role,
                "scholar_id": scholar_id,
                "enrolled_subjects": [],
            }
        )

        photo_file = request.files.get("image")
        if photo_file:
            # Save photo to server
            photo_filename = f"{scholar_id}.jpg"
            photo_path = os.path.join(photo_dir, photo_filename)
            photo_file.save(photo_path)
            sfr.save_encoding(photo_path)

        return jsonify({"message": "Registration successful"}), 200

    return "Method not allowed"


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    users = mongo.db.user
    login_user = users.find_one({"username": username})

    if (
        login_user
        and bcrypt.checkpw(password.encode("utf-8"), login_user["password"])
        and login_user["role"] == role
    ):
        return jsonify({"login": "success"})

    return jsonify({"login": "Invalid"})


@app.route("/logout", methods=["POST"])
def logout():
    session.pop("username")
    return redirect(url_for("index"))


@app.route("/add_subject", methods=["POST"])
def add_subject():
    if request.method == "POST":
        data = request.json
        subject_name = data.get("subject_name")
        username = data.get("username")
        # Check if the subject_name already exists in the subjects collection of Facerecog database
        existing_subject = mongo.db.subjects.find_one({"subject": subject_name})
        if existing_subject:
            return (
                jsonify({"message": f"The subject '{subject_name}' already exists."}),
                400,
            )

        user_collection = mongo.db.user
        user_collection.update_one(
            {"username": username},
            {"$push": {"enrolled_subjects": subject_name}},
        )

        Faculty = user_collection.find_one({"username": username})
        Faculty_name = Faculty["name"]

        # Add the subject data to the 'subjects' collection
        mongo.db.subjects.insert_one(
            {
                "subject": subject_name,
                "username": username,
                "Faculty_name": Faculty_name,
                "Faculty_status": "inactive",
                "longitude": "",
                "latitude": "",
                "attendance_periods": [],
                "student_list": {},
            }
        )
        return (
            jsonify({"message": f"Subject '{subject_name}' added successfully."}),
            200,
        )
    return "Method not allowed"


@app.route("/get_subject", methods=["GET"])
def get_subject():
    if request.method == "GET":
        subject_collection = mongo.db.subjects

        subjects_info = subject_collection.find(
            {}, {"subject": 1, "attendance_periods": 1}
        )

        subjects = []

        for doc in subjects_info:
            subject_name = doc["subject"]
            subjects.append(subject_name)

        return jsonify({"subjects": subjects}), 200


@app.route("/enroll", methods=["POST"])
def enroll_student():
    if request.method == "POST":
        data = request.json
        username = data.get("username")
        subject_name = data.get("subject")

        user_collection = mongo.db.user
        user = user_collection.find_one({"username": username})

        scholar_id = user.get("scholar_id")

        enrolled_subjects = user.get("enrolled_subjects", [])
        if subject_name not in enrolled_subjects:
            enrolled_subjects.append(subject_name)

            user_collection.update_one(
                {"username": username},
                {"$set": {"enrolled_subjects": enrolled_subjects}},
            )

        subject_collection = mongo.db.subjects
        subject = subject_collection.find_one({"subject": subject_name})

        if subject:
            # Add the scholar ID to the subject's student list
            student_list = subject.get("student_list", {})
            if scholar_id not in student_list:
                student_list[scholar_id] = [
                    0
                ]  # Initialize empty array which will store dates of attendance
                # Update the subject with the modified student list
                subject_collection.update_one(
                    {"subject": subject_name}, {"$set": {"student_list": student_list}}
                )
                return (
                    jsonify({"message": f"Enrolled in '{subject_name}' successfully."}),
                    200,
                )
            else:
                return (
                    jsonify(
                        {"message": f"Student already enrolled in '{subject_name}'."}
                    ),
                    400,
                )
        else:
            return jsonify({"message": f"Subject '{subject_name}' not found."}), 404

    return "Method not allowed", 405


@app.route("/set_status", methods=["POST"])
def set_status():
    if request.method == "POST":
        data = request.json
        subject_name = data.get("subject_name")
        status = data.get("status")
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        dateTime = data.get("dateTime")

        datetime_parts = dateTime.split(":", 2)
        dateTime = datetime_parts[0] + ":" + datetime_parts[1]

        # Update the 'Faculty_status', 'latitude', and 'longitude' fields of the subject
        mongo.db.subjects.update_one(
            {"subject": subject_name},
            {
                "$set": {
                    "Faculty_status": status,
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "$push": {"attendance_periods": dateTime} if status == "active" else {},
            },
        )

        subject_data = mongo.db.subjects.find_one({"subject": subject_name})

        if subject_data and "student_list" in subject_data:
            for student_id, attendance_list in subject_data["student_list"].items():
                if attendance_list:
                    new_attendance_list = [
                        "0" if status == "inactive" else attendance_list[0]
                    ] + attendance_list[1:]
                    mongo.db.subjects.update_one(
                        {"subject": subject_name},
                        {"$set": {f"student_list.{student_id}": new_attendance_list}},
                    )

        return (
            jsonify(
                {
                    "message": f"Attendance action for '{subject_name}' set to '{status}' successfully."
                }
            ),
            200,
        )

    return "Method not allowed"


# Fetch attendance records for a subject
@app.route("/get_attendance", methods=["GET"])
def get_attendance():
    if request.method == "GET":
        subject_name = request.args.get("subject_name")

        subject_collection = mongo.db.subjects
        subject = subject_collection.find_one({"subject": subject_name})

        if subject:
            attendance_records = subject.get("student_list", {})
            total_days = len(subject.get("attendance_periods", []))
            return jsonify({"attendance": attendance_records, "days": total_days}), 200
        else:
            return (
                jsonify(
                    {"message": f"No attendance records found for '{subject_name}'"}
                ),
                404,
            )

    return "Method not allowed", 405


# Fetch attendance records for a student in a subject
@app.route("/get_student_attendance", methods=["GET"])
def get_student_attendance():
    if request.method == "GET":
        subject_name = request.args.get("subject_name")
        scholar_id = request.args.get("scholar_id")

        subject_collection = mongo.db.subjects
        subject = subject_collection.find_one({"subject": subject_name})

        if subject:
            student_list = subject.get("student_list", {})
            attendance_records = subject.get("student_list", {})
            total_days = len(subject.get("attendance_periods", []))
            student_attendance = {
                "scholar_id": scholar_id,
                "days": student_list.get(scholar_id, []),
                "total_days": total_days,
            }

            return jsonify({"attendance": student_attendance}), 200
        else:
            return (
                jsonify(
                    {"message": f"No attendance records found for '{subject_name}'"}
                ),
                404,
            )

    return "Method not allowed", 405


@app.route("/get_enrolled_subject_data", methods=["GET"])
def get_enrolled_subject_data():
    if request.method == "GET":
        username = request.args.get("username")
        user = mongo.db.user.find_one({"username": username})

        if user:
            if user["role"] == "Student":
                enrolled_subjects = user.get("enrolled_subjects", [])
                total_classes = []
                attended_classes = []
                percentages = []

                for subject_name in enrolled_subjects:
                    subject = mongo.db.subjects.find_one({"subject": subject_name})

                    if subject:
                        total_class_count = len(subject.get("attendance_periods", []))
                        total_classes.append(total_class_count)

                        student_list = subject.get("student_list", {})
                        attended_classes_count = (
                            len(student_list.get(user["scholar_id"], [])) - 1
                        )
                        attended_classes.append(attended_classes_count)

                        percentage = (
                            (attended_classes_count / total_class_count) * 100
                            if total_class_count > 0
                            else 0
                        )
                        percentages.append("{:.2f}".format(percentage))

                return (
                    jsonify(
                        {
                            "subjects_data": enrolled_subjects,
                            "total_classes": total_classes,
                            "attended_classes": attended_classes,
                            "percentages": percentages,
                        }
                    ),
                    200,
                )

            else:
                enrolled_subjects = user.get("enrolled_subjects", [])
                total_classes = []
                last_take_attendance = []

                for subject_name in enrolled_subjects:
                    subject = mongo.db.subjects.find_one({"subject": subject_name})

                    if subject:
                        class_list = subject.get("attendance_periods", [])
                        total_classes.append(len(class_list))
                        (
                            last_take_attendance.append(class_list[-1])
                            if class_list
                            else last_take_attendance.append(0)
                        )

                return (
                    jsonify(
                        {
                            "subjects_name": enrolled_subjects,
                            "total_classes": total_classes,
                            "last_attendance": last_take_attendance,
                        }
                    ),
                    200,
                )

        else:
            return jsonify({"error": "User not found"}), 404
    else:
        return jsonify({"error": "Method not Allowed"}), 400


@app.route("/drop_attendance", methods=["POST"])
def drop_attendance():
    if request.method == "POST":
        data = request.json
        subject_name = data.get("subject_name")
        date = data.get("dateTime")

        datetime_parts = date.split(":", 2)
        date = datetime_parts[0] + ":" + datetime_parts[1]
        print(date)

        subject = mongo.db.subjects.find_one({"subject": subject_name})
        if subject:
            student_list = subject.get("student_list", {})
            attendance_periods = subject.get("attendance_periods", [])
            attendance_periods.remove(date)

            for scholar_id, attendance_list in student_list.items():
                if date in attendance_list:
                    attendance_list.remove(date)
            # Update the subject's student_list with the modified attendance records
            mongo.db.subjects.update_one(
                {"subject": subject_name},
                {
                    "$set": {"student_list": student_list},
                    "$set": {"attendance_periods": attendance_periods},
                },
            )

            return jsonify({"message": "Attendance dropped successfully."}), 200
        else:
            return jsonify({"message": "Subject not found."}), 404

    return "Method not allowed"


@app.route("/post_attendance", methods=["POST"])
def post_attendance():
    if request.method == "POST":
        data = request.json
        scholar_id = data.get("scholarId")
        username = data.get("username")
        subject_name = data.get("subject_name")

        date_time = data.get("dateTime")

        datetime_parts = date_time.split(":", 2)
        date_time = datetime_parts[0] + ":" + datetime_parts[1]

        user = mongo.db.user.find_one({"username": username})
        sc_id = user["scholar_id"]

        subject_collection = mongo.db.subjects
        subject = subject_collection.find_one({"subject": subject_name})

        if subject and scholar_id == sc_id:
            student_list = subject.get("student_list", {})
            if scholar_id in student_list:
                # Append the current date and time to the student's attendance list
                attendance_list = student_list[scholar_id]
                attendance_list[0] = "1"
                attendance_list.append(date_time)

                # Update the subject's student list with the new attendance
                subject_collection.update_one(
                    {"subject": subject_name},
                    {"$set": {"student_list": student_list}},
                )

                return (
                    jsonify({"message": "Attendance posted successfully."}),
                    200,
                )
            else:
                return (
                    jsonify({"message": "Student not enrolled in the subject."}),
                    400,
                )
        else:
            return jsonify({"message": "Wrong Person Detected."}), 404

    return "Method not allowed", 405


@app.route("/get_location", methods=["POST"])
def get_location():
    if request.method == "POST":
        data = request.json
        username = data.get("username")

        user_collection = mongo.db.user
        user = user_collection.find_one({"username": username})
        enrolled_subjects = user.get("enrolled_subjects", [])
        scholar_id = user.get("scholar_id")

        subject_collection = mongo.db.subjects
        active_subjects_cursor = subject_collection.find({"Faculty_status": "active"})
        active_subjects = {
            subject.get("subject"): {
                "longitude": subject.get("longitude"),
                "latitude": subject.get("latitude"),
                "subject": subject.get("subject"),
            }
            for subject in active_subjects_cursor
        }

        common_locations = []
        for subject in enrolled_subjects:
            if subject in active_subjects:
                location = active_subjects[subject]
                subject_doc = mongo.db.subjects.find_one({"subject": subject})
                if subject_doc:
                    # ismarked = subject_doc["student_list"].get(scholar_id, ["0"])[0]
                    # print(ismarked)
                    # if ismarked == "0":
                    common_locations.append(
                        {
                            "subject": subject,
                            "longitude": location["longitude"],
                            "latitude": location["latitude"],
                        }
                    )
                    # else:
                    #     return jsonify(1), 200

        if common_locations:
            return jsonify(common_locations[0]), 200
        else:
            return jsonify([]), 200

    return "Method not allowed"


@app.route("/detect_faces", methods=["POST"])
def detect_faces():
    file = request.files["image"]
    file.save("received.jpg")
    frame = cv2.imread("received.jpg")

    # Encode the frame as JPEG
    _, encoded_image = cv2.imencode(".jpg", frame)

    # print("hit")
    # Send the encoded image to the receiver Flask server
    files = {"image": ("image.jpg", io.BytesIO(encoded_image.tobytes()), "image/jpeg")}
    response = requests.post("http://127.0.0.1:5000/detect_liveness", files=files)
    result = response.text  # Get the response as plain text
    label, value = result.split(" ")
    value = float(value)

    print(label)
    print(value)
    # Process the result
    if value >= 0.70 and label == "1":
        face_name = sfr.detect_known_face(frame)
        print(face_name)
        return jsonify({"regno": face_name})
    else:
        return jsonify({"error": "Liveness detection failed"})


# @app.route("/download_attendance", methods=["POST"])
# def download_attendance():
#     subject_name = request.json.get("subject_name")
#     print(subject_name)
#     subject_info = mongo.db.subjects.find_one({"subject": subject_name})
#     username = subject_info.get("username")
#     attendance_periods = subject_info.get("attendance_periods", [])
#     student_list = subject_info.get("student_list", {})
#     rows = []
#     for scholar_id, attendance_dates in student_list.items():
#         row = {
#             "Scholar ID": scholar_id,
#             **{
#                 date: "P" if date in attendance_dates else "A"
#                 for date in attendance_periods
#             },
#         }
#         rows.append(row)
#     df = pd.DataFrame(rows).set_index("Scholar ID").fillna(".")
#     print(df)
#     excel_filename = f"Attendance_{subject_name}.xlsx"
#     df.to_excel(excel_filename)
#     # user_info = mongo.db.user.find_one({"username": username})
#     # user_email = user_info.get("email")
#     user_email = "rajivsah240@gmail.com"
#     try:
#         msg = Message("Attendance Report", recipients=[user_email])
#         msg.body = "Please find the attendance report attached."
#         # with app.open_resource(excel_filename) as excel_file:
#         #     msg.attach(
#         #         excel_filename,
#         #         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#         #         excel_file.read(),
#         #     )
#         print(msg)
#         mail.send(msg)
#     except Exception as e:
#         os.remove(excel_filename)
#         return jsonify({"error": "Failed to send email: {}".format(str(e))}), 500
#     os.remove(excel_filename)
#     return jsonify(
#         {"message": "Attendance report sent successfully to {}".format(user_email)}
#     )


if __name__ == "__main__":
    app.secret_key = "mysecret"
    app.run(debug=True, host="0.0.0.0")
