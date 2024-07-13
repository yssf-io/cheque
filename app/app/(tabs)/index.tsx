import { StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import axios from "axios";
import EditScreenInfo from "@/components/EditScreenInfo";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";

const API_URL = "http://172.20.10.8:3000";
const WEBAPP_URL = "http://172.20.10.8:5173";

const getChequeContract = (chain: string): `0x${string}` => {
  switch (chain) {
    case "sepolia":
      return "0x12B85b67bC99aBB893919d1ed3707b1ec7792C20";

    default:
      return "0x12B85b67bC99aBB893919d1ed3707b1ec7792C20";
  }
};

export default function TabOneScreen() {
  const [amount, setAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [sig, setSig] = useState("");

  const handleCreation = async () => {
    setLoading(true);
    console.log(`need to sign a cheque of ${amount} usdc`);

    const userId = await AsyncStorage.getItem("userId");
    if (!userId) return;
    console.log({ userId });

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
      const encoded = btoa(JSON.stringify(obj, null, 2));
      console.log({ encoded });
      setSig(`${WEBAPP_URL}/claim?data=${encoded}`);
      setLoading(false);
    } catch (error) {
      console.log("error");
      console.log(error);
    }
  };

  return (
    <View className="items-center justify-center flex-1 bg-white">
      {sig ? (
        <View>
          <QRCode value={sig} size={300} />
          <Text>{sig}</Text>
        </View>
      ) : (
        <View>
          <TextInput
            onChangeText={(e) => setAmount(e)}
            value={amount}
            className="h-8 mx-4 border"
          />
          <Pressable onPress={handleCreation}>
            <View className="mt-16 px-6 py-4 bg-blue-400 rounded-lg">
              <Text className="text-white text-4xl">Create Cheque</Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
