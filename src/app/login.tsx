import { Screen } from '@/components/screen';
import { theme } from '@/constants/sebenza-theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;

    if (!email.trim() || password.length < 6) {
      setStatus('Enter an email and a password of at least 6 characters.');
      return;
    }

    setBusy(true);
    setStatus('');

    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });

    setBusy(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    if (mode === 'signup' && !data.session) {
      setStatus('Account created. Check your email to confirm, then sign in.');
      return;
    }

    router.replace('/');
  };

  return (
    <Screen maxWidth={440}>
      <View style={styles.brand}>
        <Text style={styles.logo}>
          Sebenza<Text style={styles.logoDot}>.</Text>
        </Text>
        <Text style={styles.tagline}>Nearby jobs. Stronger communities.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Join the community to find local work or hire local workers.'}
        </Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <Feather name="mail" size={18} color={theme.muted} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputRow}>
          <Feather name="lock" size={18} color={theme.muted} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={theme.muted}
            secureTextEntry={!showPassword}
            onSubmitEditing={submit}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.muted} />
          </Pressable>
        </View>

        <Pressable
          style={[styles.primaryButton, busy && styles.buttonDisabled]}
          onPress={submit}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <Pressable
          onPress={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setStatus('');
          }}
        >
          <Text style={styles.switchText}>
            {mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  logo: { fontSize: 36, fontWeight: '800', color: theme.slate, letterSpacing: -1 },
  logoDot: { color: theme.green },
  tagline: { fontSize: 15, color: theme.muted, marginTop: 6 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: '800', color: theme.ink },
  subtitle: { fontSize: 14, color: theme.muted, marginTop: 4, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: theme.ink, marginTop: 14, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.page,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.ink },
  primaryButton: {
    marginTop: 22,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.green,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  status: { marginTop: 14, fontSize: 14, color: theme.danger },
  switchText: { marginTop: 20, textAlign: 'center', color: theme.green, fontSize: 14, fontWeight: '600' },
});