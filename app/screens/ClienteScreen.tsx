import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { criarPedido, tiposProdutos } from '../../src/services/firebase';

export default function ClienteScreen() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [observacao, setObservacao] = useState('');

  const { user, logout } = useAuth();   // 🔹 agora pegamos também o user
  const router = useRouter();

  const toggleProduto = (produto: string) => {
    if (produtosSelecionados.includes(produto)) {
      setProdutosSelecionados(produtosSelecionados.filter(p => p !== produto));
    } else {
      setProdutosSelecionados([...produtosSelecionados, produto]);
    }
  };

  const handleAgendar = async () => {
    if (!nome || !telefone || produtosSelecionados.length === 0) {
      Alert.alert('Erro', 'Preencha nome, telefone e selecione ao menos um produto.');
      return;
    }

    const pedido = { nome, telefone, produtos: produtosSelecionados, observacao };
    const result = await criarPedido(pedido);

    if (result.success) {
      Alert.alert('Sucesso', 'Pedido agendado com sucesso!');
      setNome('');
      setTelefone('');
      setProdutosSelecionados([]);
      setObservacao('');
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível agendar o pedido.');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.replace('/'); // volta para tela inicial (login)
    } else {
      Alert.alert('Erro', result.error || 'Não foi possível sair.');
    }
  };

  // 🔹 Mensagem de boas-vindas
  const welcomeMessage = user?.email === "convidado@mrbrasa.com"
    ? "Bem-vindo, Convidado 👋"
    : `Bem-vindo, ${user?.email}`;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{welcomeMessage}</Text>
      <Text style={styles.subtitulo}>🍗 Agendamento de Pedido</Text>

      {/* Inputs */}
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

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Observação (opcional)"
        value={observacao}
        onChangeText={setObservacao}
        multiline
      />

      {/* Botão agendar */}
      <TouchableOpacity style={styles.botao} onPress={handleAgendar}>
        <Text style={styles.botaoTexto}>Agendar Pedido</Text>
      </TouchableOpacity>

      {/* Botão sair */}
      <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
        <Text style={styles.botaoTexto}>Sair</Text>
      </TouchableOpacity>
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
  botaoSair: { marginTop: 10, backgroundColor: '#999', padding: 15, borderRadius: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
