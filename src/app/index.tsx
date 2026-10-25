import { Screen } from '@/components/screen';
import { theme } from '@/constants/sebenza-theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RequireAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const features = [
  { icon: 'map-pin', title: 'Local jobs', text: 'Find work within a few kilometres of home.' },
  { icon: 'users', title: 'Easy to start', text: 'Sign up with your email and start in minutes.' },
  { icon: 'shield', title: 'Private by design', text: "Employers never see a worker's exact location." },
  { icon: 'smartphone', title: 'Works on any phone', text: 'Opens in your browser. No download needed.' },
] as const;

export default function Index() {
  return (
    <RequireAuth>
      <HomeScreen />
    </RequireAuth>
  );
}

function HomeScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLatestMatches = async () => {
    setLoading(true);

    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!jobs || jobs.length === 0) {
      setLoading(false);
      return;
    }

    const job = jobs[0];
    setJobTitle(job.title);

    const { data: matchData } = await supabase.rpc('match_workers_for_job', {
      job_id: job.id,
    });

    setMatches(matchData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLatestMatches();
  }, []);

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroCircle} />
        <Text style={styles.kicker}>SEBENZA</Text>
        <Text style={styles.heroTitle}>
          Local work.{'\n'}Real opportunities.
        </Text>
        <Text style={styles.heroText}>
          Hyperlocal work matching for South Africa's informal economy.
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={[styles.action, styles.actionPrimary]}
            onPress={() => router.push('/post-job')}
          >
            <View style={styles.iconCircle}>
              <Feather name="briefcase" size={24} color="#fff" />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionKicker}>FOR HIRERS</Text>
              <Text style={styles.actionTitle}>Post a Job</Text>
              <Text style={styles.actionText}>Find someone to get the job done.</Text>
            </View>
            <Feather name="arrow-up-right" size={22} color="#fff" />
          </Pressable>

          <Pressable
            style={[styles.action, styles.actionSecondary]}
            onPress={() => router.push('/worker-signup')}
          >
            <View style={styles.iconCircle}>
              <Feather name="user" size={24} color="#fff" />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionKicker}>FOR WORKERS</Text>
              <Text style={styles.actionTitle}>Sign Up as a Worker</Text>
              <Text style={styles.actionText}>Access local opportunities.</Text>
            </View>
            <Feather name="arrow-up-right" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.features}>
        {features.map((f) => (
          <View key={f.title} style={styles.tile}>
            <View style={styles.tileIcon}>
              <Feather name={f.icon} size={20} color={theme.green} />
            </View>
            <Text style={styles.tileTitle}>{f.title}</Text>
            <Text style={styles.tileText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <Text style={styles.status}>Loading recent activity...</Text>
      ) : jobTitle ? (
        <View>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Latest job</Text>
              <Text style={styles.sectionSub}>{jobTitle}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{matches.length} nearby</Text>
            </View>
          </View>

          {matches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No matching workers nearby yet</Text>
              <Text style={styles.emptyText}>Workers with the right skill will show up here.</Text>
            </View>
          ) : (
            matches.map((m) => (
              <View key={m.worker_id} style={styles.matchCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{String(m.name).charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchName}>{m.name}</Text>
                  <Text style={styles.matchMeta}>{String(m.skill).replace('_', ' ')}</Text>
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    {(m.distance_meters / 1000).toFixed(1)} km
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>No jobs posted yet.</Text>
              <Text style={styles.emptyText}>Jobs will appear here when they become available.</Text>
            </View>
            <Pressable style={styles.outlineButton} onPress={() => router.push('/post-job')}>
              <Text style={styles.outlineButtonText}>Post a Job</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: theme.slate,
    borderRadius: 20,
    padding: 28,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroCircle: {
    position: 'absolute',
    right: -70,
    top: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.slateSoft,
    opacity: 0.55,
  },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.6, color: theme.greenBright },
  heroTitle: { fontSize: 40, fontWeight: '800', lineHeight: 46, color: theme.onSlate, marginTop: 8 },
  heroText: { fontSize: 16, lineHeight: 24, color: theme.onSlateMuted, marginTop: 12, maxWidth: 520 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  action: {
    flexGrow: 1,
    flexBasis: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 14,
  },
  actionPrimary: { backgroundColor: theme.green },
  actionSecondary: { backgroundColor: theme.slateSoft },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: { flex: 1 },
  actionKicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.8)' },
  actionTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  actionText: { fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  tile: {
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: { fontSize: 15, fontWeight: '700', color: theme.ink },
  tileText: { fontSize: 13, lineHeight: 19, color: theme.muted, marginTop: 4 },
  status: { color: theme.muted, fontSize: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: theme.ink },
  sectionSub: { fontSize: 14, color: theme.muted, marginTop: 2 },
  countBadge: { backgroundColor: theme.mint, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  countText: { color: theme.green, fontWeight: '700', fontSize: 12 },
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
  emptyCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.ink },
  emptyText: { fontSize: 14, color: theme.muted, marginTop: 4 },
  outlineButton: {
    borderWidth: 1,
    borderColor: theme.green,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  outlineButtonText: { color: theme.green, fontWeight: '700', fontSize: 14 },
});