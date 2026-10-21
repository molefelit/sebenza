import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getCurrentLocation } from "../hooks/useLocation";
import { RequireAuth, useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

const SKILLS = ["gardening", "domestic", "piece_work"];

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
  const [title, setTitle] = useState("");
  const [skillNeeded, setSkillNeeded] = useState("gardening");
  const [useDemoLocation, setUseDemoLocation] = useState(true);
  const [status, setStatus] = useState("");
  const [matches, setMatches] = useState<any[]>([]);

  const submitJob = async () => {
    if (!session) return;

    if (!title.trim()) {
      setStatus("Please enter a job title.");
      return;
    }

    setMatches([]);
    setStatus(
      useDemoLocation
        ? "Using the demo location..."
        : "Getting your location...",
    );

    const { lng, lat, usedFallback } = useDemoLocation
      ? { ...DEMO_LOCATION, usedFallback: false }
      : await getCurrentLocation();

    setStatus(
      useDemoLocation
        ? "Demo location set, submitting..."
        : usedFallback
          ? "Using default location, submitting..."
          : "Location found, submitting...",
    );

    const { data: newJob, error } = await supabase
      .from("jobs")
      .insert({
        employer_id: session.user.id,
        title: title.trim(),
        skill_needed: skillNeeded,
        location: `SRID=4326;POINT(${lng} ${lat})`,
      })
      .select("id")
      .single();

    if (error || !newJob) {
      setStatus(`Error: ${error?.message || "Job was not created"}`);
      return;
    }

    setTitle("");
    setStatus("Job posted. Finding matches...");

    const { data: matchData, error: matchError } = await supabase.rpc(
      "match_workers_for_job",
      {
        job_id: newJob.id,
      },
    );

    if (matchError) {
      setStatus(`Job posted, but matching failed: ${matchError.message}`);
      return;
    }

    setStatus(`Job posted. Found ${matchData.length} match(es) nearby.`);
    setMatches(matchData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Post a Job</Text>

      <Text style={styles.label}>Job title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Need garden cleared"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Skill needed</Text>
      <View style={styles.skillRow}>
        {SKILLS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSkillNeeded(s)}
            style={[
              styles.skillChip,
              skillNeeded === s && styles.skillChipActive,
            ]}
          >
            <Text
              style={[
                styles.skillChipText,
                skillNeeded === s && styles.skillChipTextActive,
              ]}
            >
              {s.replace("_", " ")}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Location</Text>
      <Pressable
        onPress={() => setUseDemoLocation(!useDemoLocation)}
        style={[
          styles.locationToggle,
          useDemoLocation && styles.locationToggleActive,
        ]}
      >
        <Text
          style={[
            styles.locationToggleText,
            useDemoLocation && styles.locationToggleTextActive,
          ]}
        >
          {useDemoLocation
            ? "Demo location: Johannesburg (tap to use my real location)"
            : "My real location (tap to use the demo location)"}
        </Text>
      </Pressable>

      <Pressable style={styles.primaryButton} onPress={submitJob}>
        <Text style={styles.primaryButtonText}>Submit</Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      {matches.map((match) => (
        <View key={match.worker_id} style={styles.matchCard}>
          <Text style={styles.matchName}>{match.name}</Text>
          <Text style={styles.matchText}>Skill: {match.skill}</Text>
          <Text style={styles.matchText}>
            Distance: {(match.distance_meters / 1000).toFixed(2)} km
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, color: "#fff" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#111",
  },
  skillRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  skillChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "#333",
  },
  skillChipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  skillChipText: { color: "#aaa", fontWeight: "600", fontSize: 13 },
  skillChipTextActive: { color: "#fff" },
  locationToggle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "#333",
  },
  locationToggleActive: { borderColor: "#007AFF" },
  locationToggleText: { color: "#aaa", fontSize: 14 },
  locationToggleTextActive: { color: "#fff" },
  primaryButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#007AFF",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  status: { marginTop: 16, marginBottom: 12, fontSize: 14, color: "#aaa" },
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
