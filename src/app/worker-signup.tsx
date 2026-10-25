import { Screen } from '@/components/screen';
import { theme } from '@/constants/sebenza-theme';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getCurrentLocation } from '../hooks/useLocation';
import { RequireAuth, useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const SKILLS = ['gardening', 'domestic', 'piece_work'];

// Demo area (Johannesburg CBD): the sample jobs are seeded around here
const DEMO_LOCATION = { lng: 28.0473, lat: -26.2041 };

export default function WorkerSignup() {
  return (
    <RequireAuth>
      <WorkerSignupScreen />
    </RequireAuth>
  );
}

function WorkerSignupScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [skill, setSkill] = useState('gardening');
  const [useDemoLocation, setUseDemoLocation] = useState(true);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const isError = /^Error/i.test(status);

  // Load the saved profile, if there is one
  useEffect(() => {
    const loadProfile = async () => {
      if (!session) return;
      const { data } = await supabase
        .from('workers')
        .select('name, skill')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (data) {
        setName(data.name);
        setSkill(data.skill);
      }
    };
    loadProfile();
  }, []);

  const submitWorker = async () => {
    if (!session || busy) return;

    if (!name.trim()) {
      setStatus('Please enter your name.');
      return;
    }

    setBusy(true);

    try {
      setStatus(useDemoLocation ? 'Using the demo location...' : 'Getting your location...');

      const { lng, lat, usedFallback } = useDemoLocation
        ? { ...DEMO_LOCATION, usedFallback: false }
        : await getCurrentLocation();

      const { error } = await supabase.from('workers').upsert(
        {
          user_id: session.user.id,
          name: name.trim(),
          skill,
          location: `SRID=4326;POINT(${lng} ${lat})`,
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }

      setStatus(
        useDemoLocation
          ? 'Profile saved (demo location).'
          : usedFallback
            ? 'Profile saved (default location).'
            : 'Profile saved with your real location.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen maxWidth={720}>
      <Text style={styles.kicker}>FOR WORKERS</Text>
      <Text style={styles.title}>Your worker profile</Text>
      <Text style={styles.subtitle}>Tell us your skill and we'll match you with jobs near you.</Text>

      <View style={styles.privacy}>
        <Feather name="shield" size={18} color={theme.green} />
        <Text style={styles.privacyText}>
          Employers only see your name, your skill and how far away you are. They never see your exact
          location.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.muted}
        />

        <Text style={styles.label}>Skill</Text>
        <View style={styles.chipRow}>
          {SKILLS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSkill(s)}
              style={[styles.chip, skill === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, skill === s && styles.chipTextActive]}>
                {s.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Location</Text>
        <Pressable
          onPress={() => setUseDemoLocation(!useDemoLocation)}
          style={[styles.locationToggle, useDemoLocation && styles.locationToggleActive]}
        >
          <Feather name="map-pin" size={18} color={useDemoLocation ? theme.green : theme.muted} />
          <Text style={styles.locationText}>
            {useDemoLocation
              ? 'Demo location: Johannesburg (tap to use my real location)'
              : 'My real location (tap to use the demo location)'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primaryButton, busy && styles.buttonDisabled]}
          onPress={submitWorker}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Please wait...' : 'Save profile'}</Text>
        </Pressable>

        {status ? <Text style={[styles.status, isError && styles.statusError]}>{status}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: theme.green },
  title: { fontSize: 32, fontWeight: '800', color: theme.ink, marginTop: 4 },
  subtitle: { fontSize: 15, color: theme.muted, marginTop: 6, marginBottom: 16 },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.mint,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  privacyText: { flex: 1, fontSize: 13, lineHeight: 19, color: theme.ink },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
  },
  label: { fontSize: 13, fontWeight: '600', color: theme.ink, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.ink,
    backgroundColor: theme.page,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: theme.page,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.green, borderColor: theme.green },
  chipText: { color: theme.muted, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.page,
  },
  locationToggleActive: { borderColor: theme.green, backgroundColor: theme.mint },
  locationText: { flex: 1, fontSize: 14, color: theme.ink },
  primaryButton: {
    marginTop: 22,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.green,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  status: { marginTop: 14, fontSize: 14, color: theme.muted },
  statusError: { color: theme.danger },
});