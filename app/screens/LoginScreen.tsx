// LoginScreen.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useAuth } from '../../src/context/AuthContext';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isRegister, setIsRegister] = useState<boolean>(false);

  const { login, register, loginAnonimo } = useAuth();
  const router = useRouter();

  const handlePress = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);

    let result;
    if (isRegister) {
      result = await register(email, senha);
      if (result.success) {
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
        setIsRegister(false);
      } else {
        Alert.alert('Erro', result.error);
      }
    } else {
      result = await login(email, senha);
      if (!result.success) {
        Alert.alert('Erro', result.error);
      } else {
        if (email === 'bobyyasmim@gmail.com') {
          router.replace('/admin');
        } else {
          router.replace('/cliente');
        }
      }
    }

    setLoading(false);
  };

  // 🔓 Fluxo de convidado com login fixo
  const handleGuestAccess = async () => {
    setLoading(true);
    const result = await loginAnonimo(); // já usa convidado@mrbrasa.com
    if (!result.success) {
      Alert.alert('Erro', result.error || 'Não foi possível entrar como convidado.');
    } else {
      router.replace('/cliente');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>🍗 MR. Brasa Assados</Text>
        <Text style={styles.subtitulo}>Sistema de Reservas</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
        />

        <Input
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          placeholder="******"
          secureTextEntry
        />

        <Button
          title={loading ? 'Carregando...' : isRegister ? 'Cadastrar' : 'Entrar'}
          onPress={handlePress}
          disabled={loading}
        />

        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => setIsRegister(!isRegister)}
        >
          <Text style={styles.toggleText}>
            {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </Text>
        </TouchableOpacity>

        {/* 🔹 Botão convidado */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleGuestAccess}
          disabled={loading}
        >
          <Text style={styles.guestText}>Entrar sem cadastro</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Clientes: Faça login para agendar</Text>
        <Text style={styles.footerText}>Ou entre como convidado</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', marginBottom: 10 },
  subtitulo: { fontSize: 16, color: '#666' },
  form: { flex: 1 },
  toggleBtn: { alignItems: 'center', marginTop: 15 },
  toggleText: { color: '#FF6B35', fontSize: 14, fontWeight: '600' },
  guestBtn: { alignItems: 'center', marginTop: 20 },
  guestText: { color: '#333', fontSize: 14, fontWeight: '600' },
  footer: { alignItems: 'center', marginBottom: 30 },
  footerText: { fontSize: 12, color: '#999', marginBottom: 5 },
});
