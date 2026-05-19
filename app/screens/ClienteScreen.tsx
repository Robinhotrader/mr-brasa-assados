import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useAuth } from '../../src/context/AuthContext';
import { criarPedido, tiposProdutos } from '../../src/services/firebase';

export const ClienteScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter(); // ✅ adiciona o hook do Expo Router

  const [nome, setNome] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [produto, setProduto] = useState<string>(tiposProdutos[0]);
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleAgendar = async () => {
    if (!nome || !telefone) {
      Alert.alert('Erro', 'Preencha nome e telefone');
      return;
    }

    setLoading(true);

    const resultado = await criarPedido({
      nome,
      telefone,
      produto,
      observacao,
    });

    setLoading(false);

    if (resultado.success) {
      Alert.alert('Sucesso', 'Pedido agendado com sucesso! 🍗');
      // Limpar formulário
      setNome('');
      setTelefone('');
      setProduto(tiposProdutos[0]);
      setObservacao('');
    } else {
      Alert.alert('Erro', resultado.error);
    }
  };

  // ✅ Função para sair e voltar ao login
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.replace('/'); // volta para a tela de login
    } else {
      Alert.alert('Erro', result.error || 'Falha ao sair');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>🍗 MR. Brasa Assados</Text>
        <Text style={styles.subtitulo}>Agende seu pedido</Text>
        <Text style={styles.usuario}>Logado como: {user?.email}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Nome completo"
          value={nome}
          onChangeText={setNome}
          placeholder="Seu nome"
        />

        <Input
          label="Telefone"
          value={telefone}
          onChangeText={setTelefone}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
        />

        <View style={styles.containerSelecao}>
          <Text style={styles.label}>Produto</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tiposProdutos.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.botaoProduto,
                  produto === item && styles.botaoProdutoSelecionado
                ]}
                onPress={() => setProduto(item)}
              >
                <Text
                  style={[
                    styles.textoProduto,
                    produto === item && styles.textoProdutoSelecionado
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Input
          label="Observações (opcional)"
          value={observacao}
          onChangeText={setObservacao}
          placeholder="Ex: sem cebola, entrega às 19h, etc"
        />

        <Button
          title={loading ? 'Agendando...' : '🍗 Agendar Pedido'}
          onPress={handleAgendar}
          backgroundColor="#FF6B35"
          disabled={loading}
        />

        <Button
          title="Sair"
          onPress={handleLogout} // ✅ usa a função com redirecionamento
          backgroundColor="#999"
        />
      </View>

      <View style={styles.informacoes}>
        <Text style={styles.infoTitulo}>ℹ️ Informações</Text>
        <Text style={styles.infoTexto}>• Seu pedido será enviado para o restaurante</Text>
        <Text style={styles.infoTexto}>• Os funcionários entrarão em contato pelo telefone</Text>
        <Text style={styles.infoTexto}>• Temos: frango, costela, medalhão e mais</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#FF6B35', padding: 20, alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitulo: { fontSize: 16, color: '#fff', opacity: 0.9, marginBottom: 10 },
  usuario: { fontSize: 12, color: '#fff', opacity: 0.7 },
  form: { padding: 20 },
  containerSelecao: { marginBottom: 15 },
  label: { fontSize: 16, marginBottom: 10, color: '#333', fontWeight: '600' },
  botaoProduto: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  botaoProdutoSelecionado: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  textoProduto: { fontSize: 14, color: '#333', textAlign: 'center' },
  textoProdutoSelecionado: { color: '#fff', fontWeight: '600' },
  informacoes: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  infoTexto: { fontSize: 14, color: '#666', marginBottom: 5 },
});
