import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Run',
          tabBarIcon: ({ color }) => (
            // Icône inline sans dépendance externe
            <TabIcon emoji="🏃" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lore"
        options={{
          title: 'Lore',
          tabBarIcon: ({ color }) => <TabIcon emoji="📜" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#ef4444' ? 1 : 0.5 }}>{emoji}</Text>;
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0d0d0d',
    borderTopColor: '#1f1f1f',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  label: { fontSize: 11, fontWeight: '600' },
});
