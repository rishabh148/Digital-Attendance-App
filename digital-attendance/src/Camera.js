import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity,Alert,Button } from "react-native";
import { Camera } from "expo-camera";
import { AntDesign } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import axios from "axios";
import { useUserContext } from "./Context";


// Define the base URL
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function CameraComponent({ navigation, subject }) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const subject_name = subject;
  const [result, setResult] = useState(null);
  const [posted, setPosted] = useState(false);
  const [receivedResponse, setReceivedResponse] = useState("");
  const [photoDataUri, setPhotoDataUri] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const { userData } = useUserContext();
  const username = userData.username;

  // const [permission, requestPermission] = Camera.useCameraPermissions();

  // if (!permission) {
  //   // Camera permissions are still loading
  //   return <View />;
  // }

  // if (!permission.granted) {
  //   // Camera permissions are not granted yet
  //   return (
  //     <View style={styles.container}>
  //       <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
  //       <Button onPress={requestPermission} title="grant permission" />
  //     </View>
  //   );
  // }

  // const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // async function getAlbums() {
  //   if (permissionResponse.status !== 'granted') {
  //     await requestPermission();
  //   }
  //   const fetchedAlbums = await MediaLibrary.createAssetAsync({
  //     includeSmartAlbums: true,
  //   });
  // }



  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const { uri } = await cameraRef.current.takePictureAsync();
        const asset = await MediaLibrary.createAssetAsync(uri);
        const currentDate = new Date();
        const dte = currentDate.toLocaleDateString(); // Format date only
        const time = currentDate.toLocaleTimeString();
        setDate(dte);
        setTime(time);
        setPosted("");
        setResult("");
        setPhotoDataUri(asset.uri);
        // setImg(res.assets[0].uri);
        stopCamera();
        return asset;
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  };
  const retakePhoto = () => {
    setPhotoDataUri(null);
    startCamera();
  };

  const startCamera = async () => {
    try {
      await cameraRef.current.resumePreview();
    } catch (error) {
      console.error("Error starting camera:", error);
    }
  };

  const stopCamera = async () => {
    try {
      await cameraRef.current.pausePreview();
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
  };

  // async function postAttendance() {
  //   setPosted(true);
  //   axios
  //     .post(`${BASE_URL}/save_to_excel`, {
  //       register_number: result,
  //     })
  //     .then(function (response) {
  //       console.log(response);
  //     })
  //     .catch(function (error) {
  //       console.log(error);
  //     });
  // }
  const postAttendance = async () => {
    try {
      if (!result) {
        console.log("No scholar ID available to post attendance.");
        return;
      }

      const currentDate = new Date();
      const options = {
        timeZone: "Asia/Kolkata", // IST timezone
        hour12: false, // Use 24-hour format
      };
      const dateTime = currentDate.toLocaleString("en-IN", options);

      const postData = {
        subject_name,
        scholarId: result,
        username,
        dateTime,
      };

      const response = await axios.post(
        `${BASE_URL}/post_attendance`,
        postData
      );

      if (response.status === 200) {
        console.log(response);
        setPosted(true);
        Alert.alert("Attendance posted successfully!");
        navigation.navigate("Student");
        setReceivedResponse(response.data.message);
      }else if (response.status === 400) {
        console.log(response);
        setReceivedResponse(response.data.message);
      } else if (response.status === 404) {
        Alert.alert(response.data.message);
      }
      else {
        console.log(response);
        setReceivedResponse(response.data.message);
      }
    } catch (error) {
      console.error("Error posting attendance:", error);
    }
  };

  const getPrediction = async () => {
    try {
      // console.log("Button Pressed")
      const data = new FormData();
      data.append("image", {
        uri: photoDataUri,
        name: "image.jpg",
        type: "image/jpg",
      });

      const img_res = await axios.post(`${BASE_URL}/detect_faces`, data, {
        headers: {
          accept: "application/json",
          "Accept-Language": "en-US,en;q=0.8",
          "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        },
      });

      setResult(img_res.data.regno);
      console.log("ID", img_res.data.regno);
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {
  //   takeImageHandler();
  // }, []);

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        ref={cameraRef}
        type={Camera.Constants.Type.front}
        onCameraReady={() => setIsCameraReady(true)}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePhoto}
          disabled={!isCameraReady}
        >
          <Text style={styles.buttonText}>Capture</Text>
        </TouchableOpacity>
        {photoDataUri && (
          <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.picBtns}>
        <TouchableOpacity style={styles.centerbutton} onPress={getPrediction}>
          <Text style={styles.buttonText}>Get ID</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.centerbutton} onPress={postAttendance}>
          <Text style={styles.buttonText}>Post Attendance</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.resultView}>
        {result && <Text style={styles.resultTxt}>ID : {result}</Text>}
      </View>
      {posted && <Text style={styles.posted}>{receivedResponse}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  centerbutton: {
    backgroundColor: "#AC8181",
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    margin: 10,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 15,
    color: "white",
  },
  camera: {
    width: 300,
    height: 400,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "space-around",
    // alignItems: "center",
    width: "100%",
  },
  captureButton: {
    backgroundColor: "#4681f4",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retakeButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  picBtns: {
    flexDirection: "row",
    alignSelf: "center",
    justifyContent: "space-between",
    padding: 5,
  },

  resultTxt: {
    fontSize: 20,
  },
});
