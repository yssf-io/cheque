import { Text, View, SafeAreaView, Image, Pressable } from "react-native";

export default function Create() {
  return (
    <SafeAreaView className="items-center bg-white h-screen">
      <Text className="mt-12 text-5xl">Welcome!</Text>
      <Text className="mt-6 mb-12 text-xl">Let's make you an account</Text>
      <Image
        className="h-64 w-64 rounded-lg shadow-black shadow-2xl"
        source={require("../assets/images/cheque_logo.png")}
      />

      <Pressable onPress={() => console.log("hello")}>
        <View className="mt-16 px-6 py-4 bg-blue-400 rounded-lg">
          <Text className="text-white text-4xl">Continue</Text>
        </View>
      </Pressable>

      <Text className="mt-24 text-sm">stay hydrated</Text>
    </SafeAreaView>
  );
}
