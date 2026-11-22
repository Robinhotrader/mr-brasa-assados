import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadows } from '../theme';
import { Pedido } from '../services/firebase';

interface OrderCardProps {
  pedido: Pedido;
  isAdmin?: boolean;
  onToggleEntregue?: (id: string, entregue: boolean) => void | Promise<void>;
}

const formatarData = (valor: Pedido['createdAt']) => {
  if (!valor) return '';
  const data = typeof valor?.toDate === 'function'
    ? valor.toDate()
    : valor instanceof Date
      ? valor
      : null;
  if (!data || Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const abrirContato = async (telefone: string) => {
  const digitos = telefone.replace(/\D/g, '');
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;
  try {
    await Linking.openURL(`https://wa.me/${numero}`);
  } catch {
    // O número segue visível no cartão para contato manual.
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({ pedido, isAdmin, onToggleEntregue }) => {
  const produtos = Array.isArray(pedido.produtos) ? pedido.produtos : [];
  const data = formatarData(pedido.createdAt);

  return (
    <View style={[styles.card, pedido.entregue && styles.cardEntregue]}>
      <View style={styles.topLine}>
        <View style={[styles.statusDot, pedido.entregue ? styles.statusDotEntregue : styles.statusDotPendente]} />
        <Text style={[styles.status, pedido.entregue ? styles.statusEntregue : styles.statusPendente]}>
          {pedido.entregue ? 'Entregue' : 'Pendente'}
        </Text>
        <Text style={styles.codigo}>PEDIDO #{pedido.id?.slice(-6).toUpperCase() || '—'}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.clientRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{pedido.nome?.trim()?.charAt(0)?.toUpperCase() || 'C'}</Text></View>
        <View style={styles.clientInfo}>
          <Text style={styles.nome}>{pedido.nome || 'Cliente'}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {pedido.clienteEmail === 'convidado' ? 'Pedido rápido' : pedido.clienteEmail || 'Cliente'}
          </Text>
        </View>
        {data ? <Text style={styles.data}>{data}</Text> : null}
      </View>

      <View style={styles.detailBlock}>
        <Text style={styles.label}>ASSADOS DO PEDIDO</Text>
        {produtos.length > 0 ? (
          <View style={styles.productList}>
            {produtos.map((produto, index) => (
              <View key={`${produto}-${index}`} style={styles.productPill}>
                <Text style={styles.productText}>{produto}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.productText}>Nenhum produto informado</Text>
        )}
      </View>

      <View style={styles.contactRow}>
        <Text style={styles.contactIcon}>☎</Text>
        <Text style={styles.telefone}>{pedido.telefone || 'Telefone não informado'}</Text>
        {pedido.telefone ? (
          <TouchableOpacity
            onPress={() => abrirContato(pedido.telefone)}
            style={styles.contactButton}
            accessibilityRole="button"
            accessibilityLabel={`Abrir WhatsApp para ${pedido.nome}`}
          >
            <Text style={styles.contactButtonText}>WhatsApp ↗</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {pedido.observacao ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>OBSERVAÇÃO</Text>
          <Text style={styles.observacao}>{pedido.observacao}</Text>
        </View>
      ) : null}

      {isAdmin ? (
        <TouchableOpacity
          style={[styles.actionButton, pedido.entregue ? styles.actionReabrir : styles.actionEntregar]}
          onPress={() => pedido.id && onToggleEntregue?.(pedido.id, !pedido.entregue)}
          disabled={!pedido.id}
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>
            {pedido.entregue ? '↶  Reabrir pedido' : '✓  Marcar como entregue'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 17, marginBottom: 13, ...shadows.card },
  cardEntregue: { borderColor: '#C6E1CF', backgroundColor: '#FCFFFC' },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 8, height: 8, borderRadius: 5 },
  statusDotPendente: { backgroundColor: colors.accent },
  statusDotEntregue: { backgroundColor: colors.success },
  status: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  statusPendente: { color: colors.brandDark },
  statusEntregue: { color: colors.success },
  codigo: { marginLeft: 'auto', color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F1E9E2', marginVertical: 13 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 41, height: 41, borderRadius: 15, backgroundColor: colors.surfaceWarm, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.brandDark, fontSize: 17, fontWeight: '900' },
  clientInfo: { flex: 1 },
  nome: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  email: { color: colors.muted, fontSize: 11, marginTop: 2 },
  data: { color: colors.muted, fontSize: 11, marginLeft: 4, textAlign: 'right' },
  detailBlock: { marginTop: 16 },
  label: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  productList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  productPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11, backgroundColor: colors.surfaceWarm },
  productText: { color: colors.ink, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  contactIcon: { color: colors.brand, fontSize: 15 },
  telefone: { color: colors.ink, fontSize: 13, fontWeight: '600', flex: 1 },
  contactButton: { borderWidth: 1, borderColor: '#BFE0CC', backgroundColor: colors.successSoft, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12 },
  contactButtonText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  noteBox: { backgroundColor: '#FFFCF8', borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 11, marginTop: 13 },
  noteLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 4 },
  observacao: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  actionButton: { minHeight: 44, padding: 11, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  actionEntregar: { backgroundColor: colors.brand },
  actionReabrir: { backgroundColor: colors.success },
  actionButtonText: { color: colors.white, fontWeight: '800', fontSize: 13 },
});
