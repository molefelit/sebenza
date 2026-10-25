import { theme } from '@/constants/sebenza-theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function AppHeader() {
  const { session } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!session) return null;

  const signOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.push('/')}>
          <Text style={styles.logo}>
            Sebenza<Text style={styles.logoDot}>.</Text>
          </Text>
        </Pressable>

        <View>
          <Pressable style={styles.account} onPress={() => setOpen(!open)}>
            <Feather name="user" size={16} color={theme.onSlate} />
            <Text style={styles.accountText}>Account</Text>
            <Feather name="chevron-down" size={14} color={theme.onSlate} />
          </Pressable>

          {open && (
            <View style={styles.menu}>
              <Text style={styles.menuLabel}>Signed in as</Text>
              <Text style={styles.menuEmail} numberOfLines={1}>
                {session.user.email}
              </Text>
              <Pressable style={styles.menuItem} onPress={signOut}>
                <Feather name="log-out" size={16} color={theme.ink} />
                <Text style={styles.menuItemText}>Sign out</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: theme.slate, zIndex: 50, paddingVertical: 14, paddingHorizontal: 16 },
  inner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { fontSize: 24, fontWeight: '800', color: theme.onSlate, letterSpacing: -0.5 },
  logoDot: { color: theme.greenBright },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.slateSoft,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  accountText: { color: theme.onSlate, fontSize: 14, fontWeight: '600' },
  menu: {
    position: 'absolute',
    right: 0,
    top: 46,
    width: 250,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
  },
  menuLabel: { fontSize: 12, color: theme.muted, marginBottom: 2 },
  menuEmail: { fontSize: 14, color: theme.ink, fontWeight: '600', marginBottom: 10 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  menuItemText: { fontSize: 14, color: theme.ink },
});