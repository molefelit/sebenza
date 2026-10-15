import { Colors } from "@/constants/theme";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="post-job" options={{ title: "Post a Job" }} />
      <Tabs.Screen name="worker-signup" options={{ title: "Worker Sign-up" }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen
        name="login"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
    </Tabs>
  );
}
