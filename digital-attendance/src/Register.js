import React, { useState, useRef,useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  Modal,
  Alert,
  Button
} from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import axios from "axios";


const Register = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [scholarId, setScholarId] = useState("");
  const [photoDataUri, setPhotoDataUri] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [camera, setCamera] = useState(null);
  const cameraRef = useRef(null);
  const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
  const options = ["Student", "Faculty"];


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

  const handleRegister = async () => {
    try {
      if (!username || !password || !name || !scholarId || !photoDataUri || !selectedRole) {
        Alert.alert(
          "Incomplete Data",
          "Please fill in all the required fields and capture a photo."
        );
        return;
      }

      // Convert image URI to file object
      const file = {
        uri: photoDataUri,
        type: "image/jpeg", // Adjust the type according to your image format
        name: "photo.jpg", // You can name the file whatever you like
      };

      // Create FormData object and append form data and image file
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("name", name);
      formData.append("scholarId", scholarId);
      formData.append("image", file);
      formData.append("role", selectedRole);
      
      Alert.alert(
        "Registration Ongoing"        
      );

      
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      

      const data = await response.json();
      console.log(data);
      // Handle response as needed
      if (response.status === 200) {
        Alert.alert(
          "Registration Successful",
          "You have successfully registered."
        );
        setUsername("");
        setPassword("");
        setName("");
        setScholarId("");
        setPhotoDataUri(null);
        setSelectedRole(null);
        navigation.navigate("Start");
        // setIsTakingPhoto(false); // Reset photo capture state
      } else {
        Alert.alert(
          "Registration Failed",
          "An error occurred while registering."
        );
      }
    } catch (error) {
      console.error("Error registering:", error);
      Alert.alert(
        "Registration Failed",
        "An error occurred while registering. Please try again later."
      );
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const { uri } = await cameraRef.current.takePictureAsync();
        const asset = await MediaLibrary.createAssetAsync(uri);
        setPhotoDataUri(asset.uri);
        stopCamera();
        return asset;
      } catch (error) {
        console.error("Error taking photo:", error);
        throw error;
      }
    }
  };

  const convertImageToBase64 = async (uri) => {
    try {
      // Read the image file
      const fileUri = uri.replace("file://", "");
      const base64String = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return base64String;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
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

  

  const handleTogglePicker = () => {
    setIsVisible(!isVisible);
  };

  const handleSelectOption = (option) => {
    console.log("Selected option:", option);
    setIsVisible(false);
    setSelectedRole(option);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      enabled={true}
    >
      <Text style={styles.title}>User Registration</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />
      {!selectedRole?(<TouchableOpacity style={styles.input} onPress={handleTogglePicker}>
        <Text style={{color:"grey"}}>Select Account Type</Text>
      </TouchableOpacity>):(<TouchableOpacity style={styles.input} onPress={handleTogglePicker}>
        <Text style={{color:"grey"}}>{selectedRole}</Text>
      </TouchableOpacity>)}
      
      <Modal visible={isVisible} transparent={true} onRequestClose={()=>{setIsVisible(false)}}>
        <View style={styles.modalContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectOption(option)}
            >
              <Text>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Registration Number"
        value={scholarId}
        onChangeText={setScholarId}
      />
      {/* {photoDataUri && <Image source={{ uri: photoDataUri }} style={styles.photoPreview} />} */}
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
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={
            !(isCameraReady && username && password && name && scholarId)
          }
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity>
          <Text onPress={() => navigation.navigate('Login')}>Go To Login</Text>
        </TouchableOpacity> */}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    // color: '#333',
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    paddingLeft: 10,
    justifyContent:'center',
    color:'black'
  },
  camera: {
    width: 250,
    height: 350,
    borderRadius: 15,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  captureButton: {
    backgroundColor: "#007bff",
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
  registerButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 5,
    marginTop: 10,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    margin: 80,
    marginTop: 200,
    elevation: 55,
  },
});

export default Register;
