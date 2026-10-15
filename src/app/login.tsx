import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
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
    <View style={styles.container}>
      <Text style={styles.logo}>Sebenza</Text>
      <Text style={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#666"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        placeholderTextColor="#666"
        secureTextEntry
      />

      <Pressable style={styles.primaryButton} onPress={submit} disabled={busy}>
        <Text style={styles.primaryButtonText}>
          {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        <Text style={styles.switchText}>
          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 16, color: '#aaa', textAlign: 'center', marginBottom: 32 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#111',
  },
  primaryButton: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  status: { marginTop: 16, fontSize: 14, color: '#ff8a80' },
  switchText: { marginTop: 24, textAlign: 'center', color: '#007AFF', fontSize: 14 },
});