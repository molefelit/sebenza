import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Index() {
  const [matches, setMatches] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLatestMatches = async () => {
    setLoading(true);

    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!jobs || jobs.length === 0) {
      setLoading(false);
      return;
    }

    const job = jobs[0];
    setJobTitle(job.title);

    const { data: matchData } = await supabase.rpc("match_workers_for_job", {
      job_id: job.id,
    });

    setMatches(matchData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLatestMatches();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Sebenza</Text>
      <Text style={styles.tagline}>
        Hyperlocal work matching for South Africa's informal economy
      </Text>

      <Link href="/post-job" asChild>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.buttonText}>Post a Job</Text>
        </Pressable>
      </Link>

      <Link href="/worker-signup" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.buttonText}>Sign Up as a Worker</Text>
        </Pressable>
      </Link>

      {loading ? (
        <Text style={styles.status}>Loading recent activity...</Text>
      ) : jobTitle ? (
        <View style={styles.matchesSection}>
          <Text style={styles.sectionTitle}>Latest job: "{jobTitle}"</Text>
          <Text style={styles.status}>
            {matches.length > 0
              ? `${matches.length} worker(s) nearby`
              : "No matching workers nearby yet"}
          </Text>

          {matches.map((match) => (
            <View key={match.worker_id} style={styles.matchCard}>
              <Text style={styles.matchName}>{match.name}</Text>
              <Text style={styles.matchText}>Skill: {match.skill}</Text>
              <Text style={styles.matchText}>
                Distance: {(match.distance_meters / 1000).toFixed(2)} km
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.status}>No jobs posted yet — try posting one!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 70, alignItems: "stretch" },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 32,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#2c2c2e",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  matchesSection: { marginTop: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,
  },
  status: { fontSize: 14, color: "#aaa", marginBottom: 16 },
  matchCard: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  matchName: { fontWeight: "600", fontSize: 16, color: "#fff" },
  matchText: { color: "#fff" },
});
