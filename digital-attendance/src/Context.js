import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';



const GUEST_USER_DATA = { username: "guest", role: "guest" };
const AsyncStorageContext = createContext();
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;


export const AsyncStorageProvider = ({ children }) => {
  const [userData, setUserData] = useState(GUEST_USER_DATA);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');

      console.log('userData:', userData);
      if (userData) {
        setUserData(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  

  const setUserDataInStorage = async ({ username, role }) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify({ username, role }));
      setUserData({ username, role });
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  };

  const clearUserDataFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUserData(GUEST_USER_DATA);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  return (
    <AsyncStorageContext.Provider
      value={{ userData,fetchUserData, setUserDataInStorage, clearUserDataFromStorage }}
    >
      {children}
    </AsyncStorageContext.Provider>
  );
};

export const useUserContext = () => useContext(AsyncStorageContext);
