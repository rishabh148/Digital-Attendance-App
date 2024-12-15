import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  ScrollView,
} from "react-native";
import {
  MaterialCommunityIcons,
  SimpleLineIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import axios from "axios";

import { useUserContext } from "./Context";

const Student = ({ navigation }) => {
  const [subjects, setSubjects] = useState([]);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [scholarId, setScholarId] = useState("");
  const [subjectData, setSubjectData] = useState([]);
  const { userData, clearUserDataFromStorage } = useUserContext();
  const { username } = userData;
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

  useEffect(() => {
    fetchSubjects();
    fetchSubjectData();
    console.log("User info in Student Page:", userData);
  }, []);

  const handleMarkAttendance = () => {
    navigation.navigate("AttendanceStudent");
  };

  const logout = async () => {
    try {
      clearUserDataFromStorage();
      navigation.navigate("Start");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_subject`);
      const data = await response.json();
      setSubjects(data.subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchSubjectData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/get_enrolled_subject_data?username=${username}`);
      setSubjectData(response.data);
    } catch (error) {
      console.error("Error fetching subject data:", error);
    }
  };

  const enrollInSubject = () => {
    setShowEnrollForm(!showEnrollForm);
  };

  const handleEnroll = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/enroll`, {
        username,
        subject: selectedSubject,
      });
      console.log("Enrollment response:", response.data);

      setSelectedSubject("");
      setShowEnrollForm(false);
      fetchSubjectData();
    } catch (error) {
      console.error("Error enrolling:", error);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/classroom.png")}
      style={styles.backgroundImage}
      blurRadius={3}
    >
      <View style={styles.container}>
        <View style={styles.topNameWrapper}>
          <Text style={styles.text}>Welcome {username} !!</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={enrollInSubject}>
          <Text style={styles.buttonText}>Enroll in a Subject</Text>
        </TouchableOpacity>

        {showEnrollForm && (
          <View style={styles.enrollForm}>
            <Text style={styles.formLabel}>Select Subject:</Text>
            <ScrollView style={{ maxHeight: 200 }}>
            <FlatList
              data={subjects}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.subjectItem,
                    selectedSubject === item && styles.selectedSubjectItem,
                  ]}
                  onPress={() => setSelectedSubject(item)}
                >
                  <Text style={styles.subjectText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            </ScrollView>
            <View style={{ justifyContent: "center" }}>
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={handleEnroll}
              >
                <Text style={styles.enrollButtonText}>Enroll</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleMarkAttendance}>
          <Text style={styles.buttonText}>Mark Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Attendance Record</Text>
          <View style={styles.row}>
            <Text style={styles.cell}>Subject</Text>
            <Text style={styles.cell}>Total Classes</Text>
            <Text style={styles.cell}>Attended Classes</Text>
            <Text style={styles.cell}>Percentage</Text>
          </View>
          <ScrollView style={{ maxHeight: 500 }}>
          <FlatList
            data={subjectData.subjects_data}
            renderItem={({ item, index }) => (
              <View style={[styles.row, index % 2 === 1 ? styles.stripedRow : null]}>
                <Text style={styles.cell}>{item}</Text>
                <Text style={styles.cell}>{subjectData.total_classes[index]}</Text>
                <Text style={styles.cell}>{subjectData.attended_classes[index]}</Text>
                <Text style={styles.cell}>{subjectData.percentages[index]}%</Text>
              </View>
            )}
            keyExtractor={(item) => item}
          />
          </ScrollView>
        </View>

      </View>
    </ImageBackground>
  );
};

export default Student;

const styles = StyleSheet.create({
  container: {
    // justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  topNameWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    // marginTop: 80,
  },
  text: {
    fontFamily: "OpenSans-Bold",
    fontSize: 30,
  },
  button: {
    backgroundColor: "#4681f4",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: 200,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "OpenSans-Bold",
    fontSize: 15,
    color: "white",
  },
  enrollButton: {
    backgroundColor: "#ffffff",
    padding: 5,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  enrollButtonText: {
    fontFamily: "OpenSans-Bold",
    fontSize: 15,
    color: "black",
  },
  enrollForm: {
    width: "50%",
  },
  formLabel: {
    fontFamily: "OpenSans-Bold",
    fontSize: 15,
    marginBottom: 5,
  },
  subjectItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedSubjectItem: {
    backgroundColor: "#AC8181",
  },
  subjectText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    color: "#253D5B",
  },
  tableContainer: {
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#AC8181",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
    width: "90%",
  },
  tableTitle: {
    fontFamily: "OpenSans-Bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  stripedRow: {
    backgroundColor: "#f2f2f2",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize:12
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
});
