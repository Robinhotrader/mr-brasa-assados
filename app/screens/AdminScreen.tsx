import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { OrderCard } from '../../src/components/OrderCard';
import { useAuth } from '../../src/context/AuthContext';
import {
  atualizarPedidoEntregue,
  limparPedidosEntregues,
  ouvirPedidos,
  Pedido,
} from '../../src/services/firebase';
import { colors, shadows } from '../../src/theme';

type FiltroPedidos = 'todos' | 'pendentes' | 'entregues';

const filtros: { chave: FiltroPedidos; titulo: string }[] = [
  { chave: 'todos', titulo: 'Todos' },
  { chave: 'pendentes', titulo: 'Pendentes' },
  { chave: 'entregues', titulo: 'Entregues' },
];

export const AdminScreen: React.FC = () => {
  const { user, loading: authLoading, isAdmin, logout } = useAuth();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [filtro, setFiltro] = useState<FiltroPedidos>('pendentes');
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace('/');
    else if (!isAdmin) router.replace('/cliente');
  }, [authLoading, isAdmin, router, user]);

  useEffect(() => {
    if (authLoading || !isAdmin) return undefined;
    setLoadingPedidos(true);
    const unsubscribe = ouvirPedidos(
      (lista) => {
        setPedidos(lista);
        setLoadingPedidos(false);
        setErro('');
      },
      () => {
        setErro('Não foi possível carregar os pedidos. Confira a conexão e tente novamente.');
        setLoadingPedidos(false);
      },
    );
    return unsubscribe;
  }, [authLoading, isAdmin]);

  const pendentes = pedidos.filter((pedido) => !pedido.entregue);
  const entregues = pedidos.filter((pedido) => !!pedido.entregue);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return pedidos.filter((pedido) => {
      const correspondeFiltro = filtro === 'todos'
        || (filtro === 'pendentes' && !pedido.entregue)
        || (filtro === 'entregues' && !!pedido.entregue);
      const texto = [pedido.nome, pedido.telefone, pedido.clienteEmail, ...(pedido.produtos || [])]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      return correspondeFiltro && (!termo || texto.includes(termo));
    });
  }, [busca, filtro, pedidos]);

  const handleToggleEntregue = async (pedidoId: string, entregue: boolean) => {
    setErro('');
    setAviso('');
    const resultado = await atualizarPedidoEntregue(pedidoId, entregue);
    if (!resultado.success) {
      setErro(resultado.error || 'Não foi possível atualizar o pedido.');
    } else {
      setAviso(entregue ? 'Pedido marcado como entregue.' : 'Pedido voltou para pendentes.');
    }
  };

  const confirmarApagamento = async () => {
    setApagando(true);
    setErro('');
    setAviso('');
    try {
      const resultado = await limparPedidosEntregues();
      if (resultado.success) setAviso('Os pedidos entregues foram removidos do painel.');
      else setErro(resultado.error || 'Não foi possível remover os pedidos entregues.');
    } catch {
      setErro('Não foi possível remover os pedidos entregues. Tente novamente.');
    } finally {
      setApagando(false);
      setConfirmarLimpeza(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) router.replace('/');
    else setErro(result.error || 'Não foi possível sair agora.');
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.loadingText}>Preparando o painel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View style={styles.topbar}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandEmoji}>🔥</Text></View>
              <View>
                <Text style={styles.brandName}>MR. BRASA</Text>
                <Text style={styles.brandCaption}>PAINEL DA LOJA</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.sairButton} onPress={handleLogout} accessibilityRole="button">
              <Text style={styles.sairTexto}>Sair da conta</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>PAINEL ADMINISTRATIVO</Text>
            <Text style={styles.heroTitle}>Pedidos da loja</Text>
            <Text style={styles.heroSubtitle}>Acompanhe o que chegou e atualize cada pedido em tempo real.</Text>
            <View style={styles.liveStatus}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Atualização em tempo real</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statPendente]}>
              <Text style={styles.statIcon}>◷</Text>
              <Text style={styles.statNumber}>{pendentes.length}</Text>
              <Text style={styles.statLabel}>Pendentes</Text>
            </View>
            <View style={[styles.statCard, styles.statEntregue]}>
              <Text style={styles.statIcon}>✓</Text>
              <Text style={styles.statNumber}>{entregues.length}</Text>
              <Text style={styles.statLabel}>Entregues</Text>
            </View>
            <View style={[styles.statCard, styles.statTotal]}>
              <Text style={styles.statIcon}>▤</Text>
              <Text style={styles.statNumber}>{pedidos.length}</Text>
              <Text style={styles.statLabel}>No total</Text>
            </View>
          </View>

          <View style={styles.ordersSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>ACOMPANHAMENTO</Text>
                <Text style={styles.sectionTitle}>Sua fila de pedidos</Text>
              </View>
              <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{pedidosFiltrados.length}</Text></View>
            </View>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar por cliente, telefone ou produto"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Buscar pedidos"
              />
              {busca ? (
                <TouchableOpacity onPress={() => setBusca('')} accessibilityRole="button" accessibilityLabel="Limpar busca">
                  <Text style={styles.clearSearch}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filters}>
              {filtros.map((item) => {
                const ativo = filtro === item.chave;
                const quantidade = item.chave === 'todos'
                  ? pedidos.length
                  : item.chave === 'pendentes'
                    ? pendentes.length
                    : entregues.length;
                return (
                  <TouchableOpacity
                    key={item.chave}
                    onPress={() => setFiltro(item.chave)}
                    style={[styles.filterButton, ativo && styles.filterButtonActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                  >
                    <Text style={[styles.filterText, ativo && styles.filterTextActive]}>{item.titulo}</Text>
                    <Text style={[styles.filterCount, ativo && styles.filterCountActive]}>{quantidade}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {erro ? <View style={styles.errorBanner}><Text style={styles.errorText}>{erro}</Text></View> : null}
            {aviso ? <View style={styles.successBanner}><Text style={styles.successText}>{aviso}</Text></View> : null}

            {loadingPedidos ? (
              <View style={styles.loadingOrders}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={styles.loadingText}>Buscando pedidos...</Text>
              </View>
            ) : pedidosFiltrados.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}><Text style={styles.emptyEmoji}>🍗</Text></View>
                <Text style={styles.emptyTitle}>{busca ? 'Nenhum resultado' : filtro === 'pendentes' ? 'Tudo em dia!' : 'Ainda não há pedidos'}</Text>
                <Text style={styles.emptyText}>
                  {busca ? 'Tente procurar por outro nome, telefone ou produto.' : filtro === 'pendentes' ? 'Quando chegar um novo pedido, ele aparecerá aqui.' : 'Os pedidos registrados aparecerão nesta lista.'}
                </Text>
              </View>
            ) : (
              <View style={styles.cardsList}>
                {pedidosFiltrados.map((pedido) => (
                  <OrderCard
                    key={pedido.id}
                    pedido={pedido}
                    isAdmin
                    onToggleEntregue={handleToggleEntregue}
                  />
                ))}
              </View>
            )}

            {entregues.length > 0 ? (
              <TouchableOpacity
                style={styles.cleanButton}
                onPress={() => setConfirmarLimpeza(true)}
                accessibilityRole="button"
              >
                <Text style={styles.cleanIcon}>⌫</Text>
                <Text style={styles.cleanButtonText}>Limpar pedidos entregues</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.footer}>MR. Brasa Assados · Painel administrativo</Text>
        </View>
      </ScrollView>

      <Modal transparent visible={confirmarLimpeza} animationType="fade" onRequestClose={() => setConfirmarLimpeza(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.warningIcon}><Text style={styles.warningEmoji}>!</Text></View>
            <Text style={styles.confirmTitle}>Limpar pedidos entregues?</Text>
            <Text style={styles.confirmText}>
              Esta ação remove {entregues.length} {entregues.length === 1 ? 'pedido entregue' : 'pedidos entregues'} do painel e não pode ser desfeita.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmarLimpeza(false)} disabled={apagando}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmarApagamento} disabled={apagando}>
                {apagando ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.deleteText}>Remover</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 36 },
  page: { width: '100%', maxWidth: 1020, alignSelf: 'center' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  brandEmoji: { fontSize: 24 },
  brandName: { color: colors.ink, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  brandCaption: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  sairButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  sairTexto: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  hero: { backgroundColor: colors.brandDark, borderRadius: 25, padding: 23, ...shadows.card },
  heroEyebrow: { color: '#F6C9A5', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  heroTitle: { color: colors.white, fontSize: 29, fontWeight: '900', marginTop: 6 },
  heroSubtitle: { color: '#F7E2D7', fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 620 },
  liveStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 14, backgroundColor: '#A23E24', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A8E3B7' },
  liveText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 14, marginBottom: 24 },
  statCard: { flexGrow: 1, flexBasis: 105, minHeight: 116, borderRadius: 19, padding: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, ...shadows.card },
  statPendente: { backgroundColor: '#FFF8EC', borderColor: '#F1E1C3' },
  statEntregue: { backgroundColor: '#F1FAF3', borderColor: '#D7EBDD' },
  statTotal: { backgroundColor: colors.surface },
  statIcon: { color: colors.brand, fontSize: 19, fontWeight: '900' },
  statNumber: { color: colors.ink, fontSize: 27, fontWeight: '900', marginTop: 7 },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 1 },
  ordersSection: { backgroundColor: '#F7EEE6', borderRadius: 25, padding: 17 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  sectionEyebrow: { color: colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 4 },
  sectionCount: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  sectionCountText: { color: colors.brand, fontSize: 14, fontWeight: '900' },
  searchBox: { minHeight: 48, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchIcon: { color: colors.muted, fontSize: 23, lineHeight: 26 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, minHeight: 46 },
  clearSearch: { color: colors.muted, fontSize: 23, paddingHorizontal: 4 },
  filters: { flexDirection: 'row', gap: 7, marginVertical: 13, flexWrap: 'wrap' },
  filterButton: { minHeight: 36, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterButtonActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  filterCount: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  filterCountActive: { color: '#FFE2D4' },
  errorBanner: { backgroundColor: colors.dangerSoft, borderRadius: 13, padding: 12, marginBottom: 12 },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18 },
  successBanner: { backgroundColor: colors.successSoft, borderRadius: 13, padding: 12, marginBottom: 12 },
  successText: { color: colors.success, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  loadingOrders: { alignItems: 'center', justifyContent: 'center', paddingVertical: 38, gap: 10 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 10 },
  loadingText: { color: colors.muted, fontSize: 12 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: 18, alignItems: 'center', padding: 25, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: colors.surfaceWarm, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  emptyEmoji: { fontSize: 26 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5, maxWidth: 300 },
  cardsList: { gap: 1 },
  cleanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 13, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E7C9C4', backgroundColor: '#FFF9F8' },
  cleanIcon: { color: colors.danger, fontSize: 16 },
  cleanButtonText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  footer: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(32, 20, 14, 0.52)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmCard: { width: '100%', maxWidth: 410, backgroundColor: colors.surface, borderRadius: 25, padding: 23, alignItems: 'center', ...shadows.card },
  warningIcon: { width: 51, height: 51, borderRadius: 18, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  warningEmoji: { color: colors.danger, fontSize: 25, fontWeight: '900' },
  confirmTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  confirmText: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  confirmActions: { flexDirection: 'row', gap: 9, width: '100%', marginTop: 19 },
  cancelButton: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  deleteButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.white, fontSize: 13, fontWeight: '800' },
});
