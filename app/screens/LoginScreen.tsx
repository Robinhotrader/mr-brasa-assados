import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ehEmailAdministrador, useAuth } from '../../src/context/AuthContext';
import { colors, shadows } from '../../src/theme';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarAcesso, setMostrarAcesso] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const { user, loading: authLoading, isAdmin, login, register, loginAnonimo } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(isAdmin ? '/admin' : '/cliente');
    }
  }, [authLoading, isAdmin, router, user]);

  const handlePress = async () => {
    const emailNormalizado = email.trim().toLowerCase();
    setErro('');
    setMensagem('');

    if (!emailNormalizado || !senha) {
      setErro('Informe seu e-mail e sua senha para continuar.');
      return;
    }

    setLoading(true);
    try {
      const result = isRegister
        ? await register(emailNormalizado, senha)
        : await login(emailNormalizado, senha);

      if (!result.success) {
        setErro(result.error || 'Não foi possível concluir o acesso. Confira seus dados.');
        return;
      }

      if (isRegister) {
        setIsRegister(false);
        setMensagem('Cadastro criado. Estamos abrindo sua área de pedidos.');
      } else if (result.user) {
        const destino = ehEmailAdministrador(result.user.email) ? '/admin' : '/cliente';
        router.replace(destino);
      }
    } catch {
      setErro('Não foi possível acessar agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setErro('');
    setMensagem('');
    setLoading(true);
    try {
      const result = await loginAnonimo();
      if (!result.success) {
        setErro(result.error || 'Não foi possível abrir o pedido rápido. Tente novamente.');
        return;
      }
      router.replace('/cliente');
    } catch {
      setErro('Não foi possível abrir o pedido rápido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.loadingText}>Preparando seu acesso...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.page}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandEmoji}>🔥</Text>
            </View>
            <View>
              <Text style={styles.brandName}>MR. BRASA</Text>
              <Text style={styles.brandCaption}>ASSADOS • SABOR DE CASA</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>🍗 FEITO NA BRASA, COM CAPRICHO</Text>
            </View>
            <Text style={styles.title}>Seu próximo assado começa aqui.</Text>
            <Text style={styles.description}>
              Escolha seus favoritos, conte para quantas pessoas e deixe o pedido organizado para combinar os detalhes pelo WhatsApp.
            </Text>

            <View style={styles.featureRow}>
              <View style={styles.featureIcon}><Text style={styles.featureEmoji}>🥘</Text></View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>Opções para compartilhar</Text>
                <Text style={styles.featureText}>Frango, costelas, tender e outros assados.</Text>
              </View>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}><Text style={styles.featureEmoji}>📲</Text></View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>Pedido sem complicação</Text>
                <Text style={styles.featureText}>Monte sua seleção e confirme pelo WhatsApp.</Text>
              </View>
            </View>

            <Button
              title={loading ? 'Preparando...' : 'Montar meu pedido  →'}
              onPress={handleGuestAccess}
              disabled={loading}
            />
            <Text style={styles.helperText}>Você pode começar sem criar uma conta.</Text>
          </View>

          <View style={styles.accessCard}>
            <View style={styles.accessHeading}>
              <View>
                <Text style={styles.accessEyebrow}>JÁ TEM ACESSO?</Text>
                <Text style={styles.accessTitle}>Entre na sua área</Text>
              </View>
              <Text style={styles.accessIcon}>✦</Text>
            </View>
            <Text style={styles.accessDescription}>
              Acesse sua conta de cliente ou o painel administrativo.
            </Text>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => {
                setMostrarAcesso((atual) => !atual);
                setErro('');
                setMensagem('');
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: mostrarAcesso }}
            >
              <Text style={styles.outlineButtonText}>
                {mostrarAcesso ? 'Fechar acesso' : 'Entrar com e-mail'}
              </Text>
              <Text style={styles.outlineArrow}>{mostrarAcesso ? '−' : '+'}</Text>
            </TouchableOpacity>

            {mostrarAcesso ? (
              <View style={styles.form}>
                <Input
                  label="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <Input
                  label="Senha"
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Digite sua senha"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handlePress}
                />
                {erro ? <Text accessibilityRole="alert" style={styles.errorText}>{erro}</Text> : null}
                {mensagem ? <Text style={styles.successText}>{mensagem}</Text> : null}
                <Button
                  title={loading ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
                  onPress={handlePress}
                  disabled={loading}
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => {
                    setIsRegister((atual) => !atual);
                    setErro('');
                    setMensagem('');
                  }}
                >
                  <Text style={styles.toggleText}>
                    {isRegister ? 'Já tenho conta — entrar' : 'Quero criar uma conta'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <Text style={styles.footer}>MR. Brasa Assados · Um bom assado reúne todo mundo.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 28 },
  page: { width: '100%', maxWidth: 650, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  brandMark: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: { fontSize: 27 },
  brandName: { color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
  brandCaption: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.35, marginTop: 3 },
  heroCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: '#F1DECC',
    ...shadows.card,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF9F3',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
  },
  heroBadgeText: { color: colors.brandDark, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -0.8 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  featureIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#FFFAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: { fontSize: 21 },
  featureCopy: { flex: 1 },
  featureTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  featureText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  helperText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 5 },
  accessCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    padding: 21,
    marginTop: 18,
    ...shadows.card,
  },
  accessHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accessEyebrow: { color: colors.brand, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  accessTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 5 },
  accessIcon: { color: colors.accent, fontSize: 28 },
  accessDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 14 },
  outlineButton: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFCF9',
  },
  outlineButtonText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  outlineArrow: { color: colors.brand, fontSize: 24, fontWeight: '500' },
  form: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 16, paddingTop: 17 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  successText: { color: colors.success, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  toggleButton: { alignItems: 'center', paddingVertical: 10 },
  toggleText: { color: colors.brandDark, fontWeight: '700', fontSize: 13 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 11, marginTop: 22, marginBottom: 10 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12 },
  loadingText: { color: colors.muted, fontSize: 13 },
});
