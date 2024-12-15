import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome5, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useUserContext} from "./Context";
import axios from "axios";


const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function Login({ navigation }) {
  const { userData, fetchUserData, setUserDataInStorage } = useUserContext();
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [valid, setValid] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Student");
  const [errorTxt,setErrorTxt] = useState(null);
  const [URl,setURL] = useState(null);

  useEffect(() => {
    fetchUserData();
    console.log("Login:", userData);
    const { username } = userData;
    if (username != "guest") {
      const { username, role } = userData;
      navigation.navigate(role === "Faculty" ? "Faculty" : "Student");
    }
  }, []);

  async function loginCheck() {
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        username: username,
        password: password,
        role: selectedRole, 
      });

      if (response.data.login === "success") {
        await setUserDataInStorage({ username, role: selectedRole });
        setPass("");
        setUser("");

        navigation.navigate(selectedRole === "Faculty" ? "Faculty" : "Student");
      } else if (response.data.login === "Invalid") {
        console.log("Invalid Credentials");
        setErrorTxt(response.data);
        setValid(false);
        setPass("");
        setUser("");
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorTxt(error);
      setURL(BASE_URL);
    }
  }

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={require("../assets/nit.png")} />

      <View >
        <Text style={styles.headtext}>LOGIN</Text>
      </View>

      <View style={styles.roleView}>
        <Text style={styles.roleTxt}>Select Your Role</Text>
      </View>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "Faculty" && styles.selectedRole,
          ]}
          onPress={() => setSelectedRole("Faculty")}
        >
          <Text style={styles.roleButtonText}>Faculty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "Student" && styles.selectedRole,
          ]}
          onPress={() => setSelectedRole("Student")}
        >
          <Text style={styles.roleButtonText}>Student</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.details}>
        <Text style={styles.text}>Username</Text>
        <TextInput
          style={styles.inputtext}
          placeholder={`Enter Username...`}
          value={username}
          onChangeText={(text) => setUser(text)}
        />
        <Text style={styles.text}>Password</Text>
        <TextInput
          placeholder="Enter password..."
          secureTextEntry={true}
          style={styles.inputtext}
          value={password}
          onChangeText={(text) => setPass(text)}
        />
        {/* <Text style={styles.text}>Role</Text> */}
      </View>
      {!valid && (
        <Text style={styles.redtext}>**Enter valid Credentials**</Text>
      )}
      <TouchableOpacity style={styles.signin} onPress={loginCheck}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
      {/* <Text style={styles.redtext}>{errorTxt}</Text>
      <Text style={styles.redtext}>{URl}</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    padding: 10,
    color: "#253D5B",
  },
  buttonText: {
    fontFamily: "OpenSans-SemiBold",
    fontSize: 15,
    color: "black",
  },
  signin: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    // backgroundColor: "#AC8181",
    borderWidth: 0.5,
    margin: 20,
    alignSelf: "center",
    borderRadius: 10,
  },
  details: {
    padding: 20,
  },
  inputtext: {
    borderWidth: 0.5,
    padding: 10,
    fontFamily: "OpenSans-Regular",
    fontSize: 17,
    borderRadius: 10,
  },
  headtext: {
    fontFamily: "OpenSans-Bold",
    fontSize: 30,
    alignSelf: "center",
    paddingVertical: 30,
    color: "#253D5B",
  },
  image: {
    width: windowWidth - 60,
    height: windowHeight / 6,
    resizeMode: "contain",
    alignSelf:'center',
    borderRadius: 10,
  },
  redtext: {
    color: "red",
    fontFamily: "OpenSans-Regular",
    fontSize: 20,
    alignSelf: "center",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    // marginBottom: 20,
  },
  roleView: {
    fontFamily: "OpenSans-Regular",
    padding: 10,
    alignItems: "center",
  },
  roleTxt: {
    fontSize: 17,
    color: "#253D5B",
  },
  roleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  selectedRole: {
    backgroundColor: "#4681f4",
  },
  roleButtonText: {
    color: "black",
    fontFamily: "OpenSans-Regular",
    fontSize: 16,
  },
});
