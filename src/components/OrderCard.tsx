import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pedido } from '../services/firebase';

interface OrderCardProps {
  pedido: Pedido;
  isAdmin?: boolean;
  onToggleEntregue?: (id: string, entregue: boolean) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ pedido, isAdmin, onToggleEntregue }) => {
  return (
    <View style={[styles.card, pedido.entregue && styles.cardEntregue]}>
      <Text style={styles.nome}>{pedido.nome}</Text>

      {/* ✅ Exibe lista de produtos */}
      {pedido.produtos && pedido.produtos.length > 0 ? (
        <Text style={styles.produto}>
          {pedido.produtos.join(", ")}
        </Text>
      ) : (
        <Text style={styles.produto}>Nenhum produto selecionado</Text>
      )}

      <Text style={styles.telefone}>{pedido.telefone}</Text>

      {pedido.observacao ? (
        <Text style={styles.observacao}>Obs: {pedido.observacao}</Text>
      ) : null}

      {/* 🔹 Exibe email ou "Acesso rápido" se for convidado */}
      <Text style={styles.email}>
        {pedido.clienteEmail === 'convidado' ? 'Acesso rápido' : pedido.clienteEmail}
      </Text>

      {isAdmin && (
        <TouchableOpacity
          style={[
            styles.botao,
            pedido.entregue ? styles.botaoReabrir : styles.botaoEntregar,
          ]}
          onPress={() => onToggleEntregue?.(pedido.id!, !pedido.entregue)}
        >
          <Text style={styles.botaoTexto}>
            {pedido.entregue ? 'Reabrir Pedido' : 'Marcar como Entregue'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardEntregue: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  nome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  produto: { fontSize: 16, color: '#FF6B35', marginVertical: 4 },
  telefone: { fontSize: 14, color: '#666' },
  observacao: { fontSize: 13, color: '#999', marginTop: 4 },
  email: { fontSize: 13, color: '#555', marginTop: 4, fontStyle: 'italic' },
  botao: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  botaoEntregar: { backgroundColor: '#FF6B35' },
  botaoReabrir: { backgroundColor: '#2196F3' },
  botaoTexto: { color: '#fff', fontWeight: '600' },
});
