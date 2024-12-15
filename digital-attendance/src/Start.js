import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image,Button } from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import NetInfo from '@react-native-community/netinfo';
import * as Network from 'expo-network';

const Start = ({ navigation }) => {
  // const [status, setStatus] = useState(null);
  // const [connectStatus,setConnectStatus]= useState(null);
  // const [connectionType,setConnecType] = useState(null);
  // const [networkState, setNetworkState] = useState(null);
  // useEffect(() => {
  //   NetInfo.fetch().then(state => {
  //     console.log('Connection type', state.type);
  //     console.log('Is connected?', state.isConnected);
  //     setConnectStatus(state.isConnected);
  //     setConnecType(state.type);
  //   });
  //   const unsubscribe = NetInfo.addEventListener(state => {
  //     // console.log('Connection type', state.type);
  //     // console.log('Is connected?', state.isConnected);
  //     setConnectStatus(state.isConnected);
  //     setConnecType(state.type);
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, []);

  // useEffect(() => {
  //   const fetchNetworkState = async () => {
  //     const state = await Network.getNetworkStateAsync();
  //     setNetworkState(state);
  //   };

  //   fetchNetworkState();
  // }, []);

  const handleLoginClick = () => {
    navigation.navigate("Login");
  };

  const handleRegisterClick = () => {
    navigation.navigate("Register");
  };

  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

  if (!cameraPermission || !mediaLibraryPermission) {
    return <View />;
  }

  if (!cameraPermission.granted || !mediaLibraryPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to access the camera and media library</Text>
        <Button onPress={() => {requestCameraPermission(); requestMediaLibraryPermission();}} title="Grant Permissions" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.credentialBtns}>Welcome to Digital Attendance</Text>
      <Image source={require("../assets/startBackgroundImg.png")} style={styles.logo} />
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity style={styles.button} onPress={handleLoginClick}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleRegisterClick}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
      

      {/* <View>
        <Text style={{textAlign:'center',fontSize:20,fontWeight:'bold',paddingTop:20}}>Connection Status: {connectStatus}</Text>
        <Text style={{textAlign:'center',fontSize:20,fontWeight:'bold'}}>Connection Type: {connectionType}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {networkState ? (
        <View>
          <Text>Connection Type: {networkState.type}</Text>
          <Text>Is Connected?: {networkState.isConnected.toString()}</Text>
          <Text>Is Internet Reachable?: {networkState.isInternetReachable.toString()}</Text>
        </View>
      ) : (
        <Text>Loading network state...</Text>
      )}
    </View> */}
    </View>
  );
};

export default Start;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:'white'
  },
  credentialBtns: { 
    padding: 10,
    paddingBottom:40, 
    fontSize: 25, 
    textAlign: "center",
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: "white",
    padding: 10,
    margin: 10,
    borderRadius: 10,
    borderWidth:0.5,
  },
  buttonText: {
    color: "black",
    fontSize: 18,
    textAlign: "center",
  },
  logo: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
});
