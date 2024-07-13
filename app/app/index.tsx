import { useEffect, useState } from "react";
import { Text, View, SafeAreaView, Image, Pressable } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { v4 as uuidv4 } from "uuid";
const API_URL = "http://172.20.10.8:3000";

export default function Create() {
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    // do the circle stuff
    const userId = uuidv4(); // uncomment for prod
    // const userId = "uuuid"; // using this for testing

    try {
      const res = await axios.get(
        `${API_URL}/generateWallet/${userId}`,
        // TODO WARNING: need to add authorization for prod, now anyone can sign for anyone!
      );
      console.log("user created");
      await AsyncStorage.setItem("userId", userId);
    } catch (error) {
      console.log("err");
      console.log(error);
    }
  };

  const handleContinue = async () => {
    setLoading(true);

    await createUser();

    // redirect to (tabs)
    router.replace("/(tabs)");
  };

  const checkIfUserExists = async () => {
    // get uuid from localstorage
    const userId = await AsyncStorage.getItem("userId");
    // TODO: check userId points to a real wallet
    if (userId) {
      console.log("need to be redirected!!!!!");
      router.replace(`/(tabs)`);
    } else console.log("user not registered yet");
  };

  useEffect(() => {
    checkIfUserExists();
  }, []);

  const clearUser = async () => {
    await AsyncStorage.clear();
  };

  return (
    <SafeAreaView className="items-center bg-white h-screen">
      <Text className="mt-12 text-5xl">Welcome!</Text>
      <Text className="mt-6 mb-12 text-xl">Let's make you an account</Text>
      <Image
        className="h-64 w-64 rounded-lg shadow-black shadow-2xl"
        source={require("../assets/images/cheque_logo.png")}
      />

      <Pressable onPress={handleContinue}>
        <View className="mt-16 px-6 py-4 bg-blue-400 rounded-lg">
          <Text className="text-white text-4xl">Continue</Text>
        </View>
      </Pressable>

      <Text className="mt-24 text-sm">stay hydrated</Text>
    </SafeAreaView>
  );
}
