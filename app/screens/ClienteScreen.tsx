import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Animated, Linking, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { criarPedido, tiposProdutos } from '../../src/services/firebase';

export default function ClienteScreen() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [observacao, setObservacao] = useState('');
  const [pedidoConcluido, setPedidoConcluido] = useState(false);
  const [alturaInput] = useState(new Animated.Value(120));

  const { user, logout } = useAuth();
  const router = useRouter();

  const toggleProduto = (produto: string) => {
    if (produtosSelecionados.includes(produto)) {
      setProdutosSelecionados(produtosSelecionados.filter(p => p !== produto));
    } else {
      setProdutosSelecionados([...produtosSelecionados, produto]);
    }
  };

  // 🔹 Função única: agenda no Firebase e envia pelo WhatsApp
  const handleAgendarEEnviarWhatsApp = async () => {
    if (!nome || !telefone || produtosSelecionados.length === 0) {
      Alert.alert('Erro', 'Preencha nome, telefone e selecione os produtos.');
      return;
    }

    // 1. Agendar no Firebase
    const pedido = { nome, telefone, produtos: produtosSelecionados, observacao };
    const result = await criarPedido(pedido);

    if (result.success) {
      // 2. Enviar pelo WhatsApp
      const numero = '5547999068147'; // ✅ Teu número com DDD e código do Brasil
      const mensagem = `🍗 Pedido MR Brasa\n\nNome: ${nome}\nTelefone: ${telefone}\nProdutos: ${produtosSelecionados.join(', ')}\nObservação: ${observacao || 'Nenhuma'}\n\nObrigado pelo pedido!`;
      const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

      Linking.openURL(url).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
      });

      // 3. Limpa os campos
      setPedidoConcluido(true);
      setNome('');
      setTelefone('');
      setProdutosSelecionados([]);
      setObservacao('');
      Animated.timing(alturaInput, {
        toValue: 120,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Alert.alert('Erro', 'Não foi possível agendar o pedido.');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.replace('/');
    }
  };

  const welcomeMessage = user?.email === 'convidado@mrbrasa.com'
    ? 'Bem-vindo, Convidado 👋'
    : `Bem-vindo, ${user?.email}`;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{welcomeMessage}</Text>
      <Text style={styles.subtitulo}>🍗 Agendamento de Pedido</Text>

      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

      <Text style={styles.subtitulo}>Selecione os produtos:</Text>
      <View style={styles.cardContainer}>
        {tiposProdutos.map((produto) => (
          <TouchableOpacity
            key={produto}
            style={[styles.card, produtosSelecionados.includes(produto) && styles.cardSelecionado]}
            onPress={() => toggleProduto(produto)}
          >
            <Text style={styles.cardTitulo}>{produto}</Text>
            <Text style={styles.cardDescricao}>Clique para selecionar</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={{ width: '100%', marginBottom: 12 }}>
        <TextInput
          style={[styles.input, { height: alturaInput, textAlignVertical: 'top' }]}
          placeholder="Observação (opcional)"
          value={observacao}
          onChangeText={setObservacao}
          multiline
          onContentSizeChange={(event) => {
            const novaAltura = Math.max(120, event.nativeEvent.contentSize.height);
            Animated.timing(alturaInput, {
              toValue: novaAltura,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }}
        />
      </Animated.View>

      {/* 🔹 Botão único */}
      <TouchableOpacity style={styles.botao} onPress={handleAgendarEEnviarWhatsApp}>
        <Text style={styles.botaoTexto}>Agendar e Enviar pelo WhatsApp</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
        <Text style={styles.botaoTexto}>Sair</Text>
      </TouchableOpacity>

      <Modal transparent visible={pedidoConcluido} animationType="fade" onRequestClose={() => setPedidoConcluido(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>🎉 Pedido concluído!</Text>
            <Text style={styles.modalTexto}>Seu pedido foi agendado e enviado pelo WhatsApp.</Text>
            <TouchableOpacity style={styles.modalBotao} onPress={() => setPedidoConcluido(false)}>
              <Text style={styles.modalBotaoTexto}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#FF6B35', marginBottom: 10, textAlign: 'center' },
  subtitulo: { fontSize: 16, fontWeight: '600', marginVertical: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#eee', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  cardSelecionado: { borderColor: '#FF6B35', backgroundColor: '#FFEDE4' },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardDescricao: { fontSize: 12, color: '#666', marginTop: 4 },
  botao: { marginTop: 20, backgroundColor: '#FF6B35', padding: 15, borderRadius: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botaoSair: { marginTop: 10, backgroundColor: '#999', padding: 15, borderRadius: 8, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35', marginBottom: 10 },
  modalTexto: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
  modalBotao: { backgroundColor: '#FF6B35', padding: 10, borderRadius: 8 },
  modalBotaoTexto: { color: '#fff', fontWeight: 'bold' },
});
