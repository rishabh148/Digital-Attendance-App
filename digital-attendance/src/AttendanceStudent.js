import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from "react-native";
import {
  MaterialCommunityIcons,
  SimpleLineIcons,
  FontAwesome5,
} from "@expo/vector-icons";


import { Dimensions } from "react-native";
import { useLinkTo } from "@react-navigation/native";
import * as Location from "expo-location";
import { useUserContext } from "./Context";
import Camera from "./Camera";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;



const AttendanceStudent = ({ navigation }) => {
  const [valid, setValid] = useState(null);
  const linkTo = useLinkTo();
  const { userData, clearUserDataFromStorage } = useUserContext();
  const [clat, setClat] = useState(0);
  const [clong, setClong] = useState(0);
  const [subject,setSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarked, setIsMarked] = useState(null);

  useEffect(() => {
    async function fetchData() {
      await fetchLocation();
      await getPermissions();
      setIsLoading(false);
    }
    fetchData();
  }, [isLoading]);

  const { username } = userData;

  const fetchLocation = async () => {
    try {
      const response = await fetch(`${BASE_URL}/get_location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      // console.log(data);
      setIsMarked(data);
      console.log(isMarked)
      if (data.latitude && data.longitude) {
        setClat(data.latitude);
        setClong(data.longitude);
        setSubject(data.subject);
        // console.log(data);
      }
    } catch (error) {
      console.log("Error fetching location:", error);
      Alert.alert(
        "Attendance Not Started"
      );
      setIsLoading(false);
    }
  };

  

  const getPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Please grant location permissions");
      return;
    }
    let currentLocation = await Location.getCurrentPositionAsync({});
    const curr_time = new Date().toLocaleTimeString();
    const curr_lat = currentLocation["coords"].latitude;
    const curr_long = currentLocation["coords"].longitude;
    console.log("Time", curr_time);
    console.log("Latitude", curr_lat);
    console.log("Longtitude", curr_long);
    console.log(clong);
    console.log(clat);

    if (
      Math.abs(curr_lat - clat) <= 1.0 && Math.abs(curr_long - clong) <= 1.0
    ) {
      setValid(true);
    } else {
      setValid(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isLoading ? (
        <Text>Loading...</Text>
      ) : valid ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            FACE RECOGNITION
          </Text>
          <Camera navigation={navigation} subject={subject}/>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={24} color="red" />
          
              {isMarked==null ? (<Text style={styles.errorText}> You have Already Marked Your Attendance</Text>) : <><Text style={styles.errorText}>
            Try verifying in the proper location
              </Text></>}
              
        </View>
      )}
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fbfbfe",
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#AC8181",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    // marginVertical: 20,
  },
  buttonText: {
    fontFamily: "OpenSans-Medium",
    fontSize: 16,
    color: "white",
    marginLeft: 10,
  },
  successContainer: {
    alignItems: "center",
  },
  successText: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 20,
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:'center',
  },
  errorText: {
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
    color: "red",
    marginLeft: 10,
  },
});

export default AttendanceStudent;
