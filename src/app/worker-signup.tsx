import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getCurrentLocation } from "../hooks/useLocation";
import { supabase } from "../lib/supabase";

const SKILLS = ["gardening", "domestic", "piece_work"];

export default function WorkerSignup() {
  const [name, setName] = useState("");
  const [skill, setSkill] = useState("gardening");
  const [status, setStatus] = useState("");

  const submitWorker = async () => {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please enter a name.");
      return;
    }

    setStatus("Getting your location...");
    const { lng, lat, usedFallback } = await getCurrentLocation();

    setStatus(
      usedFallback
        ? "Using default location, submitting..."
        : "Location found, submitting...",
    );

    const { data: existingWorker } = await supabase
      .from("workers")
      .select("user_id")
      .limit(1)
      .maybeSingle();

    const userId = existingWorker?.user_id;

    if (!userId) {
      setStatus(
        "Error: no existing user_id found to reuse. Create a test user in Supabase Auth first.",
      );
      return;
    }

    const { error } = await supabase.from("workers").insert({
      user_id: userId,
      name,
      skill,
      location: `SRID=4326;POINT(${lng} ${lat})`,
    });

    if (error) {
      setStatus(`Error: ${error.message}`);
      console.log("Insert error:", error);
    } else {
      setStatus(
        usedFallback
          ? "Worker profile created (used default location)!"
          : "Worker profile created with your real location!",
      );
      setName("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Sign Up</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Skill</Text>
      <View style={styles.skillRow}>
        {SKILLS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSkill(s)}
            style={[styles.skillChip, skill === s && styles.skillChipActive]}
          >
            <Text
              style={[
                styles.skillChipText,
                skill === s && styles.skillChipTextActive,
              ]}
            >
              {s.replace("_", " ")}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={submitWorker}>
        <Text style={styles.primaryButtonText}>Submit</Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
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
  skillChipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  skillChipText: { color: "#aaa", fontWeight: "600", fontSize: 13 },
  skillChipTextActive: { color: "#fff" },
  primaryButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#007AFF",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  status: { marginTop: 16, fontSize: 14, color: "#aaa" },
});
