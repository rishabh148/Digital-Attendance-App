import React from "react";
import "react-native-gesture-handler";
import { SafeAreaView, StyleSheet,StatusBar } from "react-native";
import * as Linking from "expo-linking";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { AsyncStorageProvider } from "./src/Context";


import Login from "./src/Login";
import Register from "./src/Register";
import Start from "./src/Start";
import Faculty from "./src/Faculty";
import Student from "./src/Student";
import AttendanceStudent from "./src/AttendanceStudent";
import Camera from "./src/Camera";


const config = {
  screens: {
    Camera: "camera",
  },
};

const prefix = Linking.createURL("myapp://");
const Stack = createStackNavigator();
export default function App() {
  const [fontsLoaded] = useFonts({
    "OpenSans-Bold": require("./assets/fonts/OpenSans-Bold.ttf"),
    "OpenSans-SemiBold": require("./assets/fonts/OpenSans-SemiBold.ttf"),
    "OpenSans-Regular": require("./assets/fonts/OpenSans-Regular.ttf"),
    "OpenSans-Medium": require("./assets/fonts/OpenSans-Medium.ttf"),
  });

  if (fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar></StatusBar>
        <AsyncStorageProvider>
          {/* <Auth /> */}
          <NavigationContainer linking={{ prefixes: [prefix], config }}>
            <Stack.Navigator
              initialRouteName="Start"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Start" component={Start} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Register" component={Register} />
              <Stack.Screen name="Faculty" component={Faculty} />
              <Stack.Screen name="Student" component={Student} />
              <Stack.Screen name="AttendanceStudent" component={AttendanceStudent} />
              <Stack.Screen name="Camera" component={Camera} />
            </Stack.Navigator>
          </NavigationContainer>
        </AsyncStorageProvider>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fbfbfe",
  },
});
