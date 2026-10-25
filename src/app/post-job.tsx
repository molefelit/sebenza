import { Screen } from '@/components/screen';
import { theme } from '@/constants/sebenza-theme';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getCurrentLocation } from '../hooks/useLocation';
import { RequireAuth, useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const SKILLS = ['gardening', 'domestic', 'piece_work'];

// Demo area (Johannesburg CBD): the sample workers are seeded around here
const DEMO_LOCATION = { lng: 28.0473, lat: -26.2041 };

export default function PostJob() {
  return (
    <RequireAuth>
      <PostJobScreen />
    </RequireAuth>
  );
}

function PostJobScreen() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [skillNeeded, setSkillNeeded] = useState('gardening');
  const [useDemoLocation, setUseDemoLocation] = useState(true);
  const [status, setStatus] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const isError = /^Error|failed/i.test(status);

  const submitJob = async () => {
    if (!session || busy) return;

    if (!title.trim()) {
      setStatus('Please enter a job title.');
      return;
    }

    setBusy(true);
    setMatches([]);

    try {
      setStatus(useDemoLocation ? 'Using the demo location...' : 'Getting your location...');

      const { lng, lat, usedFallback } = useDemoLocation
        ? { ...DEMO_LOCATION, usedFallback: false }
        : await getCurrentLocation();

      setStatus(
        useDemoLocation
          ? 'Demo location set, submitting...'
          : usedFallback
            ? 'Using default location, submitting...'
            : 'Location found, submitting...'
      );

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          employer_id: session.user.id,
          title: title.trim(),
          skill_needed: skillNeeded,
          location: `SRID=4326;POINT(${lng} ${lat})`,
        })
        .select('id')
        .single();

      if (error || !newJob) {
        setStatus(`Error: ${error?.message || 'Job was not created'}`);
        return;
      }

      setTitle('');
      setStatus('Job posted. Finding matches...');

      const { data: matchData, error: matchError } = await supabase.rpc('match_workers_for_job', {
        job_id: newJob.id,
      });

      if (matchError) {
        setStatus(`Job posted, but matching failed: ${matchError.message}`);
        return;
      }

      setStatus(`Job posted. Found ${matchData.length} match(es) nearby.`);
      setMatches(matchData);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen maxWidth={720}>
      <Text style={styles.kicker}>FOR HIRERS</Text>
      <Text style={styles.title}>Post a Job</Text>
      <Text style={styles.subtitle}>Tell us what you need and we'll find the right person nearby.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Job title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Need garden cleared"
          placeholderTextColor={theme.muted}
        />

        <Text style={styles.label}>Skill needed</Text>
        <View style={styles.chipRow}>
          {SKILLS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSkillNeeded(s)}
              style={[styles.chip, skillNeeded === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, skillNeeded === s && styles.chipTextActive]}>
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
          onPress={submitJob}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Please wait...' : 'Post job'}</Text>
        </Pressable>

        {status ? <Text style={[styles.status, isError && styles.statusError]}>{status}</Text> : null}
      </View>

      {matches.length > 0 && <Text style={styles.sectionTitle}>Workers nearby</Text>}
      {matches.map((m) => (
        <View key={m.worker_id} style={styles.matchCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{String(m.name).charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.matchName}>{m.name}</Text>
            <Text style={styles.matchMeta}>{String(m.skill).replace('_', ' ')}</Text>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{(m.distance_meters / 1000).toFixed(1)} km</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: theme.green },
  title: { fontSize: 32, fontWeight: '800', color: theme.ink, marginTop: 4 },
  subtitle: { fontSize: 15, color: theme.muted, marginTop: 6, marginBottom: 20 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    marginBottom: 20,
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
  sectionTitle: { fontSize: 20, fontWeight: '800', color: theme.ink, marginBottom: 12 },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: theme.green, fontWeight: '800', fontSize: 17 },
  matchName: { fontSize: 16, fontWeight: '700', color: theme.ink },
  matchMeta: { fontSize: 13, color: theme.muted, marginTop: 2, textTransform: 'capitalize' },
  distanceBadge: { backgroundColor: theme.slate, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  distanceText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});