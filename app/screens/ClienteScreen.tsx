
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../src/context/AuthContext';
import { criarPedido, tiposProdutos } from '../../src/services/firebase';

const WHATSAPP_DA_LOJA = '5547999068147';

const gruposProdutos = [
  {
    titulo: 'Frangos e aves',
    emoji: '🍗',
    produtos: ['Frango sem recheio', 'Frango com recheio', 'Coxa e Sobre Coxa', 'Meio Frango'],
  },
  {
    titulo: 'Costelas e carnes',
    emoji: '🍖',
    produtos: ['Costela bovina', 'Costela suína', 'Tender'],
  },
  {
    titulo: 'Especiais da brasa',
    emoji: '🔥',
    produtos: ['Linguiça Pernil/ Frango', 'Espetinho Medalhão Suíno', 'Outros'],
  },
];

export default function ClienteScreen() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroWhatsApp, setErroWhatsApp] = useState(false);
  const [pedidoConcluido, setPedidoConcluido] = useState(false);
  const [codigoPedido, setCodigoPedido] = useState('');

  const { user, loading: authLoading, isAdmin, logout } = useAuth();
  const router = useRouter();
const scrollRef = useRef<ScrollView | null>(null);
const cardapioY = useRef(0);

const irParaCardapio = () => {
  scrollRef.current?.scrollTo({
    y: Math.max(0, cardapioY.current - 15),
    animated: true,
  });
};
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
    if (!authLoading && isAdmin) router.replace('/admin');
  }, [authLoading, isAdmin, router, user]);

  const quantidadeTotal = useMemo(
    () => Object.values(quantidades).reduce((soma, quantidade) => soma + quantidade, 0),
    [quantidades]
  );

  const produtosEscolhidos = useMemo(
    () => tiposProdutos.filter((produto) => (quantidades[produto] || 0) > 0),
    [quantidades]
  );

  const alterarQuantidade = (produto: string, variacao: number) => {
    setQuantidades((atuais) => {
      const proxima = Math.max(0, (atuais[produto] || 0) + variacao);
      const atualizadas = { ...atuais };

      if (proxima === 0) delete atualizadas[produto];
      else atualizadas[produto] = proxima;

      return atualizadas;
    });

    setErro('');
  };

  const abrirWhatsApp = async () => {
    const itens = tiposProdutos
      .filter((produto) => (quantidades[produto] || 0) > 0)
      .map((produto) => `${quantidades[produto]}x ${produto}`);

    const mensagem = [
      '🔥 Pedido MR. Brasa Assados',
      `Código: ${codigoPedido || 'recém registrado'}`,
      `Nome: ${nome.trim()}`,
      `Telefone: ${telefone.trim()}`,
      `Produtos: ${itens.join(', ')}`,
      `Observação: ${observacao.trim() || 'Nenhuma'}`,
      '',
      'Olá! Gostaria de confirmar os detalhes deste pedido.',
    ].join('\n');

    const url = `https://wa.me/${WHATSAPP_DA_LOJA}?text=${encodeURIComponent(mensagem)}`;

    try {
      await Linking.openURL(url);
      setPedidoConcluido(false);
    } catch {
      setErroWhatsApp(true);
    }
  };

  const handleAgendar = async () => {
    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();
    const telefoneNumerico = telefoneLimpo.replace(/\D/g, '');

    if (!nomeLimpo) {
      setErro('Informe seu nome para identificar o pedido.');
      return;
    }

    if (telefoneNumerico.length < 10) {
      setErro('Confira o telefone com DDD para podermos confirmar seu pedido.');
      return;
    }

    if (produtosEscolhidos.length === 0) {
      setErro('Escolha pelo menos um assado para continuar.');
      return;
    }

    setEnviando(true);
    setErro('');
    setErroWhatsApp(false);

    try {
      const produtos = tiposProdutos
        .filter((produto) => (quantidades[produto] || 0) > 0)
        .map((produto) => `${quantidades[produto]}x ${produto}`);

      const result = await criarPedido({
        nome: nomeLimpo,
        telefone: telefoneLimpo,
        produtos,
        observacao: observacao.trim(),
      });

      if (!result.success) {
        setErro(result.error || 'Não foi possível registrar seu pedido. Tente novamente.');
        return;
      }

      setCodigoPedido(result.id ? result.id.slice(-6).toUpperCase() : '');
      setPedidoConcluido(true);
    } catch {
      setErro('Não foi possível registrar seu pedido. Confira sua conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const fazerOutroPedido = () => {
    setPedidoConcluido(false);
    setNome('');
    setTelefone('');
    setQuantidades({});
    setObservacao('');
    setErro('');
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) router.replace('/');
    else setErro(result.error || 'Não foi possível sair agora.');
  };

  const renderizarGrupo = (grupo: (typeof gruposProdutos)[number]) => {
    const produtos = grupo.produtos.filter((produto) => tiposProdutos.includes(produto));

    if (produtos.length === 0) return null;

    return (
      <View key={grupo.titulo} style={styles.grupo}>
        <View style={styles.grupoTituloLinha}>
          <Text style={styles.grupoEmoji}>{grupo.emoji}</Text>
          <Text style={styles.grupoTitulo}>{grupo.titulo}</Text>
        </View>

        <View style={styles.grade}>
          {produtos.map((produto) => {
            const quantidade = quantidades[produto] || 0;
            const ehCostela = produto.toLowerCase().includes('costela');
const ehFrango = grupo.titulo === 'Frangos e aves';
const ehTender = produto.toLowerCase().includes('tender');
            return (
              <View
                key={produto}
                style={[
                  styles.produtoCard,
                  quantidade > 0 && styles.produtoSelecionado,
                ]}
              >
              {ehCostela ? (
  <Image
    source={require('../../assets/images/costela-brasa.jpeg')}
    style={styles.produtoImagem}
  />
) : ehFrango ? (
  <Image
    source={require('../../assets/images/frango-brasa.jpeg')}
    style={styles.produtoImagem}
  />
) : ehTender ? (
  <Image
    source={require('../../assets/images/tender-brasa.png')}
    style={styles.produtoImagem}
  />
) : (
  <View style={styles.produtoIcone}>
    <Text style={styles.produtoEmoji}>{grupo.emoji}</Text>
  </View>
)}
                <View style={styles.produtoTexto}>
                  <Text style={styles.produtoNome}>{produto}</Text>
                  <Text style={styles.produtoAjuda}>
                    {quantidade > 0 ? 'Adicionado ao pedido' : 'Escolha a quantidade'}
                  </Text>
                </View>

                <View style={styles.controleQuantidade}>
                  <TouchableOpacity
                    style={styles.controleBotao}
                    onPress={() => alterarQuantidade(produto, -1)}
                    disabled={quantidade === 0}
                  >
                    <Text style={styles.controleTexto}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.quantidadeTexto}>{quantidade}</Text>

                  <TouchableOpacity
                    style={styles.controleBotaoAtivo}
                    onPress={() => alterarQuantidade(produto, 1)}
                  >
                    <Text style={styles.controleTextoAtivo}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (authLoading || !user || isAdmin) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#F07832" />
        <Text style={styles.loadingText}>Preparando sua área de pedidos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
  ref={scrollRef}
  contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <View style={styles.topbar}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandEmoji}>🔥</Text>
              </View>

              <View>
                <Text style={styles.brandName}>MR. BRASA</Text>
                <Text style={styles.brandCaption}>ASSADOS NA BRASA</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.sairButton}>
              <Text style={styles.sairTexto}>Sair</Text>
            </TouchableOpacity>
          </View>

          <ImageBackground
            source={require('../../assets/images/frango-brasa.jpeg')}
            style={styles.hero}
            imageStyle={styles.heroImagem}
          >
            <View style={styles.heroOverlay} />

            <View style={styles.heroConteudo}>
              <Text style={styles.heroEyebrow}>MR. BRASA ASSADOS</Text>
              <Text style={styles.heroTitulo}>O sabor que reúne.</Text>

              <Text style={styles.heroDescricao}>
                Frangos, costelas e carnes preparados com aquele sabor especial da brasa.
              </Text>

              <TouchableOpacity
                style={styles.heroBotao}
                onPress={irParaCardapio}
              >
                <Text style={styles.heroBotaoTexto}>ESCOLHER MEU PEDIDO ↓</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroSombra} />
          </ImageBackground>

          <View style={styles.boasVindas}>
            <Text style={styles.boasVindasTexto}>
              BEM-VINDO{user.displayName ? `, ${user.displayName.toUpperCase()}` : ''}
            </Text>
            <Text style={styles.boasVindasTitulo}>Escolha seus assados</Text>
            <Text style={styles.boasVindasDescricao}>
              Selecione os produtos e as quantidades. Nossa equipe confirma os detalhes com você.
            </Text>
          </View>

          <View style={styles.destaqueCostela}>
            <Image
              source={require('../../assets/images/costela-brasa.jpeg')}
              style={styles.destaqueImagem}
            />
            <View style={styles.destaqueTexto}>
              <Text style={styles.destaqueEtiqueta}>ESPECIAL DA BRASA</Text>
              <Text style={styles.destaqueTitulo}>Costelas assadas</Text>
              <Text style={styles.destaqueDescricao}>
                Sabor marcante e preparo especial.
              </Text>
            </View>
          </View>

          <View
  style={styles.sectionHeader}
  onLayout={(event) => {
    cardapioY.current = event.nativeEvent.layout.y;
  }}
>
            <View>
              <Text style={styles.sectionEyebrow}>NOSSO CARDÁPIO</Text>
              <Text style={styles.sectionTitle}>Escolha seus produtos</Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'}
              </Text>
            </View>
          </View>

          {gruposProdutos.map(renderizarGrupo)}

          {produtosEscolhidos.length > 0 && (
            <View style={styles.resumoCard}>
              <Text style={styles.resumoTitulo}>🛒 Seu pedido</Text>

              {produtosEscolhidos.map((produto) => (
                <View key={produto} style={styles.resumoLinha}>
                  <Text style={styles.resumoProduto}>
                    {quantidades[produto]}x {produto}
                  </Text>

                  <TouchableOpacity
                    onPress={() => alterarQuantidade(produto, -quantidades[produto])}
                  >
                    <Text style={styles.removerTexto}>Remover</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.resumoNota}>
                A equipe confirma disponibilidade e detalhes pelo WhatsApp.
              </Text>
            </View>
          )}

          <View style={styles.dadosCard}>
            <Text style={styles.dadosTitulo}>Finalize seu pedido</Text>
            <Text style={styles.dadosDescricao}>
              Informe seus dados para nossa equipe entrar em contato.
            </Text>

            <Text style={styles.label}>Seu nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Como podemos chamar você?"
              placeholderTextColor="#9A8A7E"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />

            <Text style={styles.label}>WhatsApp ou telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(47) 99999-9999"
              placeholderTextColor="#9A8A7E"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>
              Observações <Text style={styles.opcional}>(opcional)</Text>
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Horário desejado ou alguma preferência..."
              placeholderTextColor="#9A8A7E"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />

            {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

            <TouchableOpacity
              style={[
                styles.enviarButton,
                (enviando || quantidadeTotal === 0) && styles.enviarDesabilitado,
              ]}
              onPress={handleAgendar}
              disabled={enviando || quantidadeTotal === 0}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.enviarIcon}>↗</Text>
              )}

              <Text style={styles.enviarTexto}>
                {enviando ? 'Registrando pedido...' : 'Registrar pedido'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.privacyText}>
              Seu pedido será registrado e você poderá confirmar os detalhes pelo WhatsApp.
            </Text>
          </View>

          <Text style={styles.footer}>🔥 MR. BRASA ASSADOS · O SABOR QUE REÚNE.</Text>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={pedidoConcluido}
        animationType="fade"
        onRequestClose={() => setPedidoConcluido(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.sucessoIcon}>✓</Text>
            <Text style={styles.modalEyebrow}>PEDIDO REGISTRADO</Text>
            <Text style={styles.modalTitulo}>Tudo certo por aqui!</Text>

            <Text style={styles.modalTexto}>
              {codigoPedido ? `Código ${codigoPedido}. ` : ''}
              Agora envie os detalhes para nossa equipe pelo WhatsApp.
            </Text>

            {erroWhatsApp ? (
              <Text style={styles.errorText}>
                Não foi possível abrir o WhatsApp. Tente novamente.
              </Text>
            ) : null}

            <TouchableOpacity style={styles.modalWhatsApp} onPress={abrirWhatsApp}>
              <Text style={styles.modalWhatsAppTexto}>
                Enviar pelo WhatsApp ↗
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalFechar} onPress={fazerOutroPedido}>
              <Text style={styles.modalFecharTexto}>Fazer outro pedido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#171411' },
  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 35 },
  page: { width: '100%', maxWidth: 940, alignSelf: 'center' },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: {
    width: 47, height: 47, borderRadius: 15,
    backgroundColor: '#B74425', alignItems: 'center', justifyContent: 'center',
  },
  brandEmoji: { fontSize: 25 },
  brandName: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  brandCaption: { color: '#D8A17C', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 3 },
  sairButton: {
    paddingVertical: 9, paddingHorizontal: 16, borderWidth: 1,
    borderColor: '#514238', borderRadius: 20, backgroundColor: '#28221D',
  },
  sairTexto: { color: '#E9D8CB', fontSize: 12, fontWeight: '700' },

  hero: {
    minHeight: 330, borderRadius: 24, overflow: 'hidden',
    justifyContent: 'flex-end', backgroundColor: '#302019',
  },
  heroImagem: { opacity: 0.55, resizeMode: 'cover' },
 heroOverlay: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: 'rgba(10, 8, 6, 0.35)',
},
  heroConteudo: { padding: 24, zIndex: 2 },
  heroEyebrow: { color: '#F6A35F', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  heroTitulo: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroDescricao: { color: '#F4E5D9', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 490 },
  heroBotao: {
    alignSelf: 'flex-start', backgroundColor: '#B74425',
    paddingHorizontal: 19, paddingVertical: 14, borderRadius: 13, marginTop: 20,
  },
  heroBotaoTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  heroSombra: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 180,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },

  boasVindas: { paddingVertical: 22 },
  boasVindasTexto: { color: '#F07832', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  boasVindasTitulo: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 6 },
  boasVindasDescricao: { color: '#BFB0A4', fontSize: 13, lineHeight: 20, marginTop: 6 },

  destaqueCostela: {
  flexDirection: 'row',
  backgroundColor: '#28211C',
  borderRadius: 19,
  overflow: 'hidden',
  marginBottom: 27,
  borderWidth: 1,
  borderColor: '#49362A',
  minHeight: 170,
},

destaqueImagem: {
  width: '80%',
  height: 170,
  resizeMode: 'cover',
},

destaqueTexto: {
  flex: 1,
  justifyContent: 'center',
  paddingHorizontal: 9,
  paddingVertical: 8,
},
  destaqueEtiqueta: { color: '#F07832', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  destaqueTitulo: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 7 },
  destaqueDescricao: { color: '#C5B5A8', fontSize: 11, lineHeight: 17, marginTop: 5 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 17,
  },
  sectionEyebrow: { color: '#F07832', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  sectionTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 5 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#3A291F' },
  countBadgeText: { color: '#F5B16F', fontSize: 11, fontWeight: '900' },

  grupo: { marginBottom: 22 },
  grupoTituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 11 },
  grupoEmoji: { fontSize: 20 },
  grupoTitulo: { color: '#F3E8DE', fontSize: 16, fontWeight: '900' },
  grade: { gap: 9 },
  produtoCard: {
    minHeight: 83, borderRadius: 16, padding: 11,
    backgroundColor: '#28221D', borderWidth: 1, borderColor: '#44362C',
    flexDirection: 'row', alignItems: 'center', gap: 11,
  },
  produtoSelecionado: { borderColor: '#D56B36', backgroundColor: '#38271F' },
  produtoImagem: { width: 57, height: 57, borderRadius: 12 },
  produtoIcone: {
    width: 57, height: 57, borderRadius: 12,
    backgroundColor: '#3D2A20', alignItems: 'center', justifyContent: 'center',
  },
  produtoEmoji: { fontSize: 25 },
  produtoTexto: { flex: 1 },
  produtoNome: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  produtoAjuda: { color: '#AD9B8D', fontSize: 10, marginTop: 5 },
  controleQuantidade: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controleBotao: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: '#3A3029',
    alignItems: 'center', justifyContent: 'center',
  },
  controleBotaoAtivo: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: '#B74425',
    alignItems: 'center', justifyContent: 'center',
  },
  controleTexto: { color: '#FFFFFF', fontSize: 19 },
  controleTextoAtivo: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  quantidadeTexto: { minWidth: 13, textAlign: 'center', color: '#FFFFFF', fontSize: 13, fontWeight: '900' },

  resumoCard: {
    backgroundColor: '#28221D', borderRadius: 19,
    borderWidth: 1, borderColor: '#59402F', padding: 17, marginBottom: 18,
  },
  resumoTitulo: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  resumoLinha: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 10, paddingVertical: 9,
    borderTopWidth: 1, borderTopColor: '#45372E',
  },
  resumoProduto: { color: '#F0E3D8', fontSize: 12, fontWeight: '600', flex: 1 },
  removerTexto: { color: '#F0785A', fontSize: 11, fontWeight: '800' },
  resumoNota: { color: '#AD9B8D', fontSize: 10, lineHeight: 16, marginTop: 8 },

  dadosCard: {
    backgroundColor: '#28221D', borderRadius: 21,
    borderWidth: 1, borderColor: '#49382D', padding: 19,
  },
  dadosTitulo: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  dadosDescricao: { color: '#B8A99D', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 12 },
  label: { color: '#F1D9C8', fontSize: 12, fontWeight: '800', marginBottom: 7, marginTop: 12 },
  opcional: { color: '#9D8D81', fontWeight: '500' },
  input: {
    minHeight: 48, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#57463A', borderRadius: 13,
    backgroundColor: '#1D1916', color: '#FFFFFF', fontSize: 13,
  },
  textArea: { minHeight: 90 },
  errorText: { color: '#FF8D80', fontSize: 12, lineHeight: 18, marginTop: 10 },
  enviarButton: {
    backgroundColor: '#B74425', minHeight: 54, borderRadius: 15,
    paddingHorizontal: 15, marginTop: 17,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  enviarDesabilitado: { opacity: 0.45 },
  enviarIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  enviarTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  privacyText: { color: '#A99A8F', fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 10 },
  footer: { color: '#A99A8F', fontSize: 9, textAlign: 'center', marginVertical: 23, letterSpacing: 1 },

  loadingScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#171411', gap: 12, padding: 24,
  },
  loadingText: { color: '#C5B5A8', fontSize: 12 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    width: '100%', maxWidth: 440, backgroundColor: '#28221D',
    borderRadius: 24, padding: 25, alignItems: 'center',
    borderWidth: 1, borderColor: '#59402F',
  },
  sucessoIcon: {
    color: '#8FE0A7', fontSize: 38, fontWeight: '900',
    backgroundColor: '#25412E', overflow: 'hidden',
    borderRadius: 30, width: 58, height: 58, textAlign: 'center',
    textAlignVertical: 'center', marginBottom: 15,
  },
  modalEyebrow: { color: '#8FE0A7', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  modalTitulo: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  modalTexto: { color: '#C5B5A8', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, marginBottom: 12 },
  modalWhatsApp: {
    width: '100%', minHeight: 50, backgroundColor: '#287A52',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    padding: 12, marginTop: 8,
  },
  modalWhatsAppTexto: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  modalFechar: { padding: 13, marginTop: 4 },
  modalFecharTexto: { color: '#F2B17B', fontWeight: '800', fontSize: 12 },
});
