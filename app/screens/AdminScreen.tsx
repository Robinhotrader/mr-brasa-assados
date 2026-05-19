import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Button } from '../../src/components/Button';
import { OrderCard } from '../../src/components/OrderCard';
import { useAuth } from '../../src/context/AuthContext';
import { atualizarPedidoEntregue, limparPedidosEntregues, ouvirPedidos, Pedido } from '../../src/services/firebase';

export const AdminScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = ouvirPedidos((lista: Pedido[]) => {
      setPedidos(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleEntregue = async (pedidoId: string, entregue: boolean) => {
    const resultado = await atualizarPedidoEntregue(pedidoId, entregue);
    if (!resultado.success) {
      Alert.alert('Erro', resultado.error || 'Falha ao atualizar pedido');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.replace('/');
    }
  };

  const handleLimparPedidos = async () => {
    const resultado = await limparPedidosEntregues();
    if (resultado.success) {
      Alert.alert('Sucesso', 'Pedidos entregues foram removidos!');
    } else {
      Alert.alert('Erro', resultado.error || 'Falha ao limpar pedidos');
    }
  };

  const pedidosPendentes = pedidos.filter((p) => !p.entregue);
  const pedidosEntregues = pedidos.filter((p) => p.entregue);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>🔥 Painel Administrativo</Text>
        <Text style={styles.subtitulo}>MR. Brasa Assados</Text>
        <Text style={styles.usuario}>{user?.email}</Text>
      </View>

      <View style={styles.estados}>
        <View style={styles.stat}>
          <Text style={styles.statNumero}>{pedidosPendentes.length}</Text>
          <Text style={styles.statTexto}>Pendentes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumero}>{pedidosEntregues.length}</Text>
          <Text style={styles.statTexto}>Entregues</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumero}>{pedidos.length}</Text>
          <Text style={styles.statTexto}>Total</Text>
        </View>
      </View>

      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>📋 Pedidos Pendentes</Text>
        {loading && pedidos.length === 0 ? (
          <ActivityIndicator size="large" color="#FF6B35" />
        ) : pedidosPendentes.length === 0 ? (
          <Text style={styles.vazio}>Nenhum pedido pendente</Text>
        ) : (
          pedidosPendentes.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              isAdmin={true}
              onToggleEntregue={handleToggleEntregue}
            />
          ))
        )}
      </View>

      <View style={styles.secao}>
        <Text style={styles.tituloSecao}>✓ Pedidos Entregues</Text>
        {pedidosEntregues.length === 0 ? (
          <Text style={styles.vazio}>Nenhum pedido entregue</Text>
        ) : (
          pedidosEntregues.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              isAdmin={true}
              onToggleEntregue={handleToggleEntregue}
            />
          ))
        )}
      </View>

      <View style={styles.botoes}>
        <Button title="🗑️ Limpar Pedidos Entregues" onPress={handleLimparPedidos} backgroundColor="#d9534f" />
        <Button title="Sair" onPress={handleLogout} backgroundColor="#999" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#FF6B35', padding: 20, alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitulo: { fontSize: 16, color: '#fff', opacity: 0.9, marginBottom: 5 },
  usuario: { fontSize: 12, color: '#fff', opacity: 0.7 },
  estados: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  stat: { alignItems: 'center' },
  statNumero: { fontSize: 32, fontWeight: 'bold', color: '#FF6B35' },
  statTexto: { fontSize: 14, color: '#666', marginTop: 5 },
  secao: { padding: 20 },
  tituloSecao: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  vazio: { textAlign: 'center', color: '#999', fontSize: 16, padding: 30 },
  botoes: { padding: 20, paddingBottom: 40 },
});
