import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Share,
  BackHandler
} from "react-native";

import { useUserContext } from "./Context";
import {
  EvilIcons,
  Ionicons,
  Entypo,
  AntDesign,
  Feather,
} from "@expo/vector-icons";
import * as Location from "expo-location";
// import * as XLSX from 'xlsx';
// import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
// import * as Permissions from 'expo-permissions';
// import * as MediaLibrary from 'expo-media-library';
// import * as Sharing from "expo-sharing";
// import moment from "moment";
import axios from "axios";



export default function Fac({ navigation }) {
  const { userData, clearUserDataFromStorage } = useUserContext();
  const username = userData.username;
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
  const [selectSubjectName, setSelectedSubjectName] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [selectedDownloadSubject, setSelectedDownloadSubject] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [dateToRemove, setDateToRemove] = useState("");
  const [timeToRemove, setTimeToRemove] = useState("");
  const [dropAttendanceModalVisible, setDropAttendanceModalVisible] =
    useState(false);

  const [
    viewSubjectAttendanceModalVisible,
    setViewSubjectAttendanceModalVisible,
  ] = useState(false);
  const [
    viewStudentAttendanceModalVisible,
    setViewStudentAttendanceModalVisible,
  ] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentScholarID, setStudentScholarID] = useState([]);
  const [inputSubjectName, setInputSubjectName] = useState("");
  const [inputScholarId, setInputScholarId] = useState("");
  const [totalClassDuration, setTotalClassDuration] = useState(0);
  const [totalClassAttended, setTotalClassAttended] = useState(0);
  const percentage =
    totalClassDuration > 0
      ? (totalClassAttended / totalClassDuration) * 100
      : 0;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    fetchSubjects();
    const backAction = () => {
      // Alert user or perform any necessary cleanup before exiting
      // For example:
      Alert.alert('Exit App', 'Are you sure you want to exit?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'YES', onPress: () => {handleAttendanceAction("inactive");BackHandler.exitApp();} },
      ]);
       // This will exit the app immediately
      return true; // Prevent default behavior (go back)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [subjectName, isTakingAttendance, dropAttendanceModalVisible]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (isTakingAttendance) {
        // Prevent default behavior of leaving the screen
        e.preventDefault();

        // Execute "Stop Attendance" action
        handleAttendanceAction("inactive");

        // Close the app
        navigation.dispatch(e.data.action);
        console.log("Attendance stopped before leaving screen");
      }
    });

    return unsubscribe;
  }, [navigation, isTakingAttendance]);



  

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/get_enrolled_subject_data`,
        {
          params: { username },
        }
      );
      setSubjects(response.data.subjects_name);
      setAttendances(response.data.last_attendance);
      console.log(response.data);
      // console.log(response.data.last_attendance);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      // Alert.alert("Not enrolled in any Subjects");
    }
  };

  const handleTogglePicker = () => {
    setIsVisible(!isVisible);
  };

  const handleSelectOption = (option) => {
    console.log("Selected option:", option);
    setIsVisible(false);
    setSelectedSubjectName(option);
  };

  const handleAddSubject = () => {
    setSubjectModalVisible(true);
  };

  const logout = async () => {
    try {
      await clearUserDataFromStorage();
      navigation.navigate("Start");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSubmitSubject = () => {
    axios
      .post(
        `${BASE_URL}/add_subject`,
        { subject_name: subjectName, username: username },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("Subject added successfully:", response.data);
        fetchSubjects();
      })
      .catch((error) => {
        console.error("Error adding subject:", error);
      });

    setSubjectModalVisible(false);
    setSubjectName("");
  };

  const handleAttendanceAction = (status) => {
    let latitude = 0;
    let longitude = 0;
    if (status === "active" && location) {
      latitude = location.coords.latitude;
      longitude = location.coords.longitude;
    }

    const currentDate = new Date();
    const options = {
      timeZone: "Asia/Kolkata", // IST timezone
      hour12: false, // Use 24-hour format
    };
    const dateTime = currentDate.toLocaleString("en-IN", options);

    console.log(dateTime);

    axios
      .post(
        `${BASE_URL}/set_status`,
        {
          subject_name: selectedSubject,
          status,
          latitude,
          longitude,
          dateTime,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("Attendance action successful:", response.data);
        setIsTakingAttendance(status === "active");
        if (status === "inactive") {
          setSelectedSubject(null);
        }
      })
      .catch((error) => {
        console.error("Error performing attendance action:", error);
      });
  };

  const handleViewAttendance = () => {
    setViewSubjectAttendanceModalVisible(true);
  };

  const handleViewStudentAttendance = () => {
    setViewStudentAttendanceModalVisible(true);
  };

  const fetchSubjectAttendance = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/get_attendance`, {
        params: { subject_name: selectSubjectName },
      });
      setAttendanceRecords(response.data.attendance);
      setTotalClassDuration(response.data.days);
      console.log("Attendance records:", response.data.attendance);
      console.log("Total class duration:", response.data.days);
    } catch (error) {
      console.error("Error fetching subject attendance:", error);
    }
  };

  // Fetch attendance records for a student in a subject
  const fetchStudentAttendance = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/get_student_attendance`, {
        params: { subject_name: selectSubjectName, scholar_id: inputScholarId },
      });
      setStudentScholarID(response.data.attendance.scholar_id);
      setTotalClassAttended(response.data.attendance.days.length);
      setTotalClassDuration(response.data.attendance.total_days);
      console.log("Student attendance record:", response.data.attendance);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
    }
  };

  const handleDropAttendance = () => {
    console.log("Subject Name:", subjectName);
    console.log("Date to Remove:", dateToRemove);
    console.log("Time to Remove:", timeToRemove);

    // const formattedTime = timeToRemove.padStart(8, "0");

    const ISTDateTime = `${dateToRemove}, ${timeToRemove}`;

    // const isoDate = new Date(isoDateTime).toISOString();
    console.log("IST Date:", ISTDateTime);

    axios
      .post(`${BASE_URL}/drop_attendance`, {
        subject_name: selectSubjectName,
        dateTime: ISTDateTime,
      })
      .then((response) => {
        console.log("Attendance dropped successfully:", response.data);
        setDropAttendanceModalVisible(false);
      })
      .catch((error) => {
        console.error("Error dropping attendance:", error);
      });
  };

  const handleDownload = (selectSubjectName) => {
    setSelectedDownloadSubject(selectSubjectName);
    setDownloadModalVisible(false);
    downloadAttendanceRecord(selectSubjectName);
  };

  const downloadAttendanceRecord = async (selectSubjectName) => {
    try {
      axios
        .post(`${BASE_URL}/download_attendance`, {
          subject_name: selectSubjectName,
        })
        .then((response) => {
          console.log("Attendance mailed successfully:", response.data);
        })
        .catch((error) => {
          console.error("Error Mailing attendance:", error);
        });

      
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`); // Inform user
    }
  };

//   const downloadAttendanceRecord = async (selectSubjectName) => {
//     try {
//         const response = await axios.post(`${BASE_URL}/download_attendance`, {
//             subject_name: selectSubjectName
//         }, {
//             responseType: 'blob' // Set the response type to blob
//         });

//         // Create a blob URL for the PDF
//         const blobUrl = window.URL.createObjectURL(new Blob([response.data]));

//         // Create a temporary link element
//         const link = document.createElement('a');
//         link.href = blobUrl;
//         link.setAttribute('download', `Attendance_${selectSubjectName}.pdf`);

//         // Append the link to the document body
//         document.body.appendChild(link);

//         // Trigger the click event on the link to start the download
//         link.click();

//         // Remove the link from the document body
//         document.body.removeChild(link);
//     } catch (error) {
//         console.error('Error downloading file:', error);
//     }
// };



  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome {userData.username}</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddSubject}
        >
          <Text style={styles.actionButtonText}>Add a Subject</Text>
          <Ionicons name="add-circle-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewAttendance}
        >
          <Text style={styles.actionButtonText}>
            View Subject Attendance Record
          </Text>
          <EvilIcons name="eye" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewStudentAttendance}
        >
          <Text style={styles.actionButtonText}>
            View A Student Attendance Record
          </Text>
          <EvilIcons name="eye" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setDropAttendanceModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Drop Attendance</Text>
          <Entypo name="remove-user" size={20} color="white" />
        </TouchableOpacity>
        {/* <TouchableOpacity
          onPress={() => setDownloadModalVisible(true)}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>
            Download Subject Attendance
          </Text>
          <Feather name="download" size={20} color="white" />
        </TouchableOpacity> */}

        {/* Modal for subject selection */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={downloadModalVisible}
          onRequestClose={() => setDownloadModalVisible(false)}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalHeaderText}>
              Select Subject to Download Attendance
            </Text>
            {/* Replace with your list of subjects */}
            {!selectSubjectName ? (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>Select Subject</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>{selectSubjectName}</Text>
              </TouchableOpacity>
            )}
            <Modal
              visible={isVisible}
              transparent={true}
              onRequestClose={() => {
                setIsVisible(false);
              }}
            >
              <View style={styles.modalContainer}>
                {subjects.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectOption(option)}
                  >
                    <Text>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Modal>
            <TouchableOpacity
              onPress={() => handleDownload(selectSubjectName)}
              style={styles.subjectButton}
            >
              <Text style={styles.subjectButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Drop attendance modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={dropAttendanceModalVisible}
          onRequestClose={() => setDropAttendanceModalVisible(false)}
        >
          <View style={styles.modalView}>
            {/* <TextInput
              style={styles.input}
              placeholder="Subject Name"
              value={subjectName}
              onChangeText={(text) => setSubjectName(text)}
            /> */}
            <Text style={styles.modalHeaderText}>Enter Subject Name:</Text>
            {!selectSubjectName ? (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>Select Subject</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>{selectSubjectName}</Text>
              </TouchableOpacity>
            )}
            <Modal
              visible={isVisible}
              transparent={true}
              onRequestClose={() => {
                setIsVisible(false);
              }}
            >
              <View style={styles.modalContainer}>
                {subjects.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectOption(option)}
                  >
                    <Text>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Modal>

            <Text style={styles.modalHeaderText}>Enter Date to Remove:</Text>
            <TextInput
              style={styles.input}
              placeholder="Date (DD/M/YYYY)"
              value={dateToRemove}
              onChangeText={(text) => setDateToRemove(text)}
            />
            <Text style={styles.modalHeaderText}>Enter Time to Remove:</Text>
            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM)"
              value={timeToRemove}
              onChangeText={(text) => setTimeToRemove(text)}
            />

            {/* Button to drop attendance */}
            <TouchableOpacity
              onPress={handleDropAttendance}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Drop Attendance</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Modal for viewing attendance records */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={viewSubjectAttendanceModalVisible}
          onRequestClose={() => {
            setViewSubjectAttendanceModalVisible(false);
            setAttendanceRecords([]);
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalHeaderText}>Enter Subject Name:</Text>
            {!selectSubjectName ? (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>Select Subject</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>{selectSubjectName}</Text>
              </TouchableOpacity>
            )}
            <Modal
              visible={isVisible}
              transparent={true}
              onRequestClose={() => {
                setIsVisible(false);
              }}
            >
              <View style={styles.modalContainer}>
                {subjects.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectOption(option)}
                  >
                    <Text>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Modal>
            <TouchableOpacity
              onPress={fetchSubjectAttendance}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>View Attendance</Text>
            </TouchableOpacity>

            <View style={styles.totalClassesContainer}>
              <Text
                style={styles.totalClassesText}
              >{`Total Classes: ${totalClassDuration}`}</Text>
            </View>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.columnHeader}>Scholar ID</Text>
                <Text style={styles.columnHeader}>Classes</Text>
                <Text style={styles.columnHeader}>Percentage</Text>
              </View>
              <FlatList
                data={Object.entries(attendanceRecords)}
                renderItem={({ item }) => (
                  <View style={styles.tableRow}>
                    <Text style={styles.cell}>{item[0]}</Text>
                    <Text style={styles.cell}>{item[1].length}</Text>
                    <Text style={styles.cell}>
                      {((item[1].length / totalClassDuration) * 100).toFixed(2)}
                      %
                    </Text>
                  </View>
                )}
                keyExtractor={(item) => item[0]}
              />
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={viewStudentAttendanceModalVisible}
          onRequestClose={() => {
            setViewStudentAttendanceModalVisible(false);
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalHeaderText}>Enter Subject Name:</Text>
            {!selectSubjectName ? (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>Select Subject</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.inputModal}
                onPress={handleTogglePicker}
              >
                <Text style={{ color: "grey" }}>{selectSubjectName}</Text>
              </TouchableOpacity>
            )}
            <Modal
              visible={isVisible}
              transparent={true}
              onRequestClose={() => {
                setIsVisible(false);
              }}
            >
              <View style={styles.modalContainer}>
                {subjects.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectOption(option)}
                  >
                    <Text>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Modal>
            <Text style={styles.modalHeaderText}>Enter Scholar ID:</Text>
            <TextInput
              style={styles.input}
              placeholder="Scholar ID"
              value={inputScholarId}
              onChangeText={(text) => setInputScholarId(text)}
            />
            <TouchableOpacity
              onPress={fetchStudentAttendance}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>
                View Student Attendance
              </Text>
            </TouchableOpacity>

            <View style={styles.studentAttendanceContainer}>
              {studentScholarID && (
                <>
                  <Text
                    style={styles.attendanceInfoText}
                  >{`Scholar ID: ${studentScholarID}`}</Text>
                  <Text
                    style={styles.attendanceInfoText}
                  >{`Classes Attended: ${totalClassAttended}`}</Text>
                  <Text
                    style={styles.attendanceInfoText}
                  >{`Total Classes: ${totalClassDuration}`}</Text>
                  <Text
                    style={styles.attendanceInfoText}
                  >{`Percentage: ${percentage.toFixed(2)} %`}</Text>
                </>
              )}
              {!studentScholarID && (
                <Text style={styles.noAttendanceText}>
                  No attendance information available
                </Text>
              )}
            </View>
          </View>
        </Modal>

        {selectedSubject && !isTakingAttendance && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startAttendanceBtn]}
            onPress={() => handleAttendanceAction("active")}
          >
            <Text style={styles.actionButtonText}>Take Attendance</Text>
            <AntDesign name="caretright" size={24} color="white" />
          </TouchableOpacity>
        )}

        {selectedSubject && isTakingAttendance && (
          <TouchableOpacity
            style={[styles.actionButton, styles.stopAttendanceBtn]}
            onPress={() => handleAttendanceAction("inactive")}
          >
            <Text style={styles.actionButtonText}>Stop Attendance</Text>
            <Entypo name="controller-stop" size={24} color="white" />
          </TouchableOpacity>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={subjectModalVisible}
          onRequestClose={() => {
            setSubjectModalVisible(false);
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalHeaderText}>Enter Subject Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="Subject Name"
              value={subjectName}
              onChangeText={(text) => setSubjectName(text)}
            />
            <TouchableOpacity
              onPress={handleSubmitSubject}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {subjects.length > 0 && (
          <View style={styles.subjectList}>
            <Text style={styles.subjectListHeading}>
              Select a Subject for which to Take Attendance:
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 10,
              }}
            >
              <Text style={styles.subjectHeading}>Subjects</Text>
              <Text style={styles.subjectHeading}>Last Attendance</Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View>
                {subjects.map((subject, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.subjectListItem,
                      selectedSubject === subject &&
                        styles.selectedSubjectListItem,
                    ]}
                    onPress={() => setSelectedSubject(subject)}
                  >
                    <Text style={styles.subjectListItemText}>{subject}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View>
                {attendances.map((date, index) => (
                  <TouchableOpacity key={index} style={styles.subjectListItem}>
                    <Text style={styles.subjectListItemText}>{date}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          {/* <SimpleLineIcons name="logout" size={24} color="white" /> */}
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  welcomeText: {
    fontFamily: "OpenSans-Bold",
    fontSize: 30,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#253D5B",
    padding: 20,
    alignItems: "center",
    borderRadius: 30,
    justifyContent: "space-between",
    marginBottom: 20,
    width: "100%",
  },
  startAttendanceBtn: {
    backgroundColor: "green",
  },
  stopAttendanceBtn: {
    backgroundColor: "red",
  },
  actionButtonText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 14,
    color: "white",
  },
  modalView: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 55,
    marginTop: 10,
  },
  modalHeaderText: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    width: "100%",
  },
  inputModal: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    paddingLeft: 10,
    justifyContent: "center",
    color: "black",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    margin: 80,
    marginTop: 200,
    elevation: 55,
  },
  modalButton: {
    backgroundColor: "#253D5B",
    padding: 10,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 18,
    color: "white",
  },
  logoutButton: {
    // flexDirection: "row",
    // alignContent: "center",
    padding: 20,
    backgroundColor: "#AC8181",
    // alignSelf: "center",
    borderRadius: 20,
    marginTop: 20,
  },
  logoutButtonText: {
    fontFamily: "OpenSans-Medium",
    // marginLeft: 10,
    fontSize: 15,
    color: "white",
  },
  subjectHeading: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 15,
  },
  subjectList: {
    marginTop: 20,
  },
  subjectListHeading: {
    fontFamily: "OpenSans-Regular",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textDecorationLine: "underline",
    // alignItems:'center'
    textTransform: "uppercase",
    textAlign: "center",
  },
  subjectListItem: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedSubjectListItem: {
    backgroundColor: "#253D5B",
  },
  subjectListItemText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    color: "#000",
  },
  studentAttendanceContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  attendanceInfoText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  noAttendanceText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    color: "#666",
  },
  totalClassesContainer: {
    marginBottom: 20,
  },
  totalClassesText: {
    fontFamily: "OpenSans-Bold",
    fontSize: 18,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 5,
  },
  columnHeader: {
    fontWeight: "bold",
    // flex: 1,
    padding: 10,
    textAlign: "center",
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
});
