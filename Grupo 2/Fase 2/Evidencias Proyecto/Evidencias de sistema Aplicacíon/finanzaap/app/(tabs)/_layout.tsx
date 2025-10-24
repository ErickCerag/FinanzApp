import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // 👇 esto oculta completamente la barra negra
        tabBarStyle: { display: 'none' },
        // 👇 y esto evita interacción (aunque esté oculta)
        tabBarButton: () => null,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="wishlist" options={{ title: 'WishList', tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} /> }} />
      <Tabs.Screen name="balance" options={{ title: 'Balance', tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} /> }} />
    </Tabs>
  );
}
