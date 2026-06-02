import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <WebView source={{ uri: "https://YOUR_VITE_URL_HERE" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});