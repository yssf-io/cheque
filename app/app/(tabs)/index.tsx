import { StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import axios from "axios";
import EditScreenInfo from "@/components/EditScreenInfo";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

const API_URL = "http://172.20.10.8:3000";
const WEBAPP_URL = "http://172.20.10.8:5173";

const getChequeContract = (chain: string): `0x${string}` => {
  switch (chain) {
    case "sepolia":
      return "0xa8684d7c5450A8eBf9DD6a9B21b810908Ec2EDD3";

    default:
      return "0xa8684d7c5450A8eBf9DD6a9B21b810908Ec2EDD3";
  }
};

export default function TabOneScreen() {
  const [amount, setAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [sig, setSig] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  const lockUSDC = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) return;
    console.log({ userId });

    try {
      await axios.get(`${API_URL}/lockUSDC/${userId}/${amount}`);
      console.log({ signature });

      return;
    } catch (error) {
      console.log("error");
      console.log(error);
    }
  };

  const handleCreation = async () => {
    setLoading(true);
    console.log(`need to sign a cheque of ${amount} usdc`);

    const userId = await AsyncStorage.getItem("userId");
    if (!userId) return;
    console.log({ userId });

    await lockUSDC();

    try {
      const { signature } = (
        await axios.get(`${API_URL}/signCheque/${userId}/${amount}`)
      ).data;
      console.log({ signature });

      const obj = {
        to: getChequeContract("sepolia"),
        signature,
        amount,
      };
      console.log({ signature });
      const encoded = btoa(JSON.stringify(obj, null, 2));
      console.log({ encoded });
      setSig(`${WEBAPP_URL}/claim?data=${encoded}`);
      setLoading(false);
    } catch (error) {
      console.log("error");
      console.log(error);
    }
  };

  const getInfo = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) return;
    console.log({ userId });
    const ret = await axios.get(`${API_URL}/getInfo/${userId}`);

    setAddress(ret.data.address);
    setBalance(ret.data.balance);
  };

  useEffect(() => {
    getInfo();
  }, []);

  const checkAllowance = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) return;
    console.log({ userId });

    try {
      const ret = await axios.get(`${API_URL}/approve/${userId}`);
    } catch (error) {
      console.log("error");
      console.log(error);
    }
  };

  // useEffect(() => {
  //   checkAllowance();
  // }, []);

  const clearUser = async () => {
    await AsyncStorage.clear();
  };

  return (
    <SafeAreaView className="items-center flex-1 bg-white">
      <View className="my-20">
        <Text className="text-3xl">
          {address.substring(0, 5)}...{address.substring(address.length - 5)}
        </Text>
        <Text className="text-5xl text-center my-5">{balance} USDC</Text>
      </View>
      {sig ? (
        <View className="justify-center items-center">
          <QRCode value={sig} size={300} />
          <Text
            className="mt-12 cursor-pointer"
            onPress={() => Clipboard.setString(sig)}
          >
            Copy Link
          </Text>
          <Pressable onPress={() => setSig("")}>
            <View className="px-2 mt-12 py-1 mx-auto bg-red-400 rounded-lg">
              <Text className="text-white text-lg">Back</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <View>
          <TextInput
            keyboardType="numeric"
            onChangeText={(e) => setAmount(e)}
            value={amount}
            className="h-8 mx-4 border"
          />
          <Pressable onPress={handleCreation}>
            <View className="mt-16 px-6 py-4 bg-blue-400 rounded-lg">
              <Text className="text-white text-4xl">Create Cheque</Text>
            </View>
          </Pressable>

          <Pressable onPress={checkAllowance}>
            <View className="mt-16 px-6 py-4 bg-blue-400 rounded-lg">
              <Text className="text-white text-4xl">Approve</Text>
            </View>
          </Pressable>

          <Pressable onPress={clearUser}>
            <View className="px-2 mt-36 py-1 mx-auto bg-red-400 rounded-lg">
              <Text className="text-white text-lg">Clear User</Text>
            </View>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
