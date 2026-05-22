import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AdminScreen } from '../../app/screens/AdminScreen';
import ClienteScreen from '../../app/screens/ClienteScreen';

import { LoginScreen } from '../../app/screens/LoginScreen';
import { useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  Login: undefined;
  Admin: undefined;
  Cliente: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // 🔹 Sem usuário → vai para Login
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : isAdmin ? (
        // 🔹 Admin → painel admin
        <Stack.Screen name="Admin" component={AdminScreen} />
      ) : (
        // 🔹 Qualquer outro usuário (inclusive convidado) → cliente
        <Stack.Screen name="Cliente" component={ClienteScreen} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
