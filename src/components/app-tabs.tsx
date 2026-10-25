import { AppHeader } from '@/components/app-header';
import { theme } from '@/constants/sebenza-theme';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: theme.greenBright,
        tabBarInactiveTintColor: theme.onSlateMuted,
        tabBarStyle: {
          backgroundColor: theme.slate,
          borderTopColor: theme.slateSoft,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', paddingBottom: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: 'Post a Job',
          tabBarIcon: ({ color, size }) => <Feather name="plus-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="worker-signup"
        options={{
          title: 'Worker Sign-up',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen
        name="login"
        options={{ href: null, headerShown: false, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}