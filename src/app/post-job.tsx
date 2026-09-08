import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { getCurrentLocation } from "../hooks/useLocation";
import { supabase } from "../lib/supabase";

const SKILLS = ["gardening", "domestic", "piece_work"];

// MoMo sandbox test number — safe to use, no real money moves
const SANDBOX_TEST_MSISDN = "56733123453";

export default function PostJob() {
  const [title, setTitle] = useState("");
  const [skillNeeded, setSkillNeeded] = useState("gardening");
  const [status, setStatus] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payStatus, setPayStatus] = useState<{ [key: string]: string }>({});

  const submitJob = async () => {
    if (!title.trim()) {
      setStatus("Please enter a job title.");
      return;
    }

    setMatches([]);
    setPayStatus({});
    setStatus("Getting your location...");
    const { lng, lat, usedFallback } = await getCurrentLocation();

    setStatus(
      usedFallback
        ? "Using default location, submitting..."
        : "Location found, submitting...",
    );

    const { data: existing } = await supabase
      .from("jobs")
      .select("employer_id")
      .limit(1)
      .maybeSingle();

    let employerId = existing?.employer_id;

    if (!employerId) {
      const { data: anyWorker } = await supabase
        .from("workers")
        .select("user_id")
        .limit(1)
        .maybeSingle();
      employerId = anyWorker?.user_id;
    }

    if (!employerId) {
      setStatus(
        "Error: no existing user_id found. Create a test user in Supabase Auth first.",
      );
      return;
    }

    const { data: newJob, error } = await supabase
      .from("jobs")
      .insert({
        employer_id: employerId,
        title,
        skill_needed: skillNeeded,
        location: `SRID=4326;POINT(${lng} ${lat})`,
      })
      .select("id")
      .single();

    if (error || !newJob) {
      setStatus(`Error: ${error?.message || "Job was not created"}`);
      console.log("Insert error:", error);
      return;
    }

    setStatus(
      usedFallback
        ? "Job posted (used default location)! Finding matches..."
        : "Job posted with your real location! Finding matches...",
    );
    setTitle("");

    const { data: matchData, error: matchError } = await supabase.rpc(
      "match_workers_for_job",
      { job_id: newJob.id },
    );

    if (matchError) {
      setStatus(`Job posted, but matching failed: ${matchError.message}`);
      console.log("Match error:", matchError);
    } else {
      setStatus(`Job posted — found ${matchData.length} match(es) nearby`);
      setMatches(matchData);
    }
  };

  const payWorker = async (workerId: string) => {
    setPayingId(workerId);
    setPayStatus((prev) => ({ ...prev, [workerId]: "Requesting payment..." }));

    const { data, error } = await supabase.functions.invoke("momo-pay", {
      body: {
        amount: "50", // placeholder demo amount
        payerMsisdn: SANDBOX_TEST_MSISDN,
        externalId: `job-payment-${Date.now()}`,
      },
    });

    if (error) {
      setPayStatus((prev) => ({
        ...prev,
        [workerId]: `Error: ${error.message}`,
      }));
      console.log("Payment error:", error);
    } else if (data?.error) {
      setPayStatus((prev) => ({ ...prev, [workerId]: `Error: ${data.error}` }));
      console.log("Payment error (from function):", data.error);
    } else {
      setPayStatus((prev) => ({
        ...prev,
        [workerId]: `Payment requested! Reference: ${data.referenceId}`,
      }));
    }

    setPayingId(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post a Job</Text>

      <Text style={styles.label}>Job title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Need garden cleared"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Skill needed</Text>
      <View style={styles.skillRow}>
        {SKILLS.map((s) => (
          <Button
            key={s}
            title={s}
            color={skillNeeded === s ? "#007AFF" : "#999"}
            onPress={() => setSkillNeeded(s)}
          />
        ))}
      </View>

      <Button title="Submit" onPress={submitJob} />
      {status ? <Text style={styles.status}>{status}</Text> : null}

      {matches.map((match) => (
        <View key={match.worker_id} style={styles.matchCard}>
          <Text style={styles.matchName}>{match.name}</Text>
          <Text style={styles.matchText}>Skill: {match.skill}</Text>
          <Text style={styles.matchText}>
            Distance: {(match.distance_meters / 1000).toFixed(2)} km
          </Text>

          <View style={styles.payButtonWrapper}>
            <Button
              title={
                payingId === match.worker_id ? "Processing..." : "Pay via MoMo"
              }
              onPress={() => payWorker(match.worker_id)}
              disabled={payingId === match.worker_id}
              color="#FFCC00"
            />
          </View>

          {payStatus[match.worker_id] ? (
            <Text style={styles.payStatus}>{payStatus[match.worker_id]}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  label: { fontSize: 14, fontWeight: "600", marginTop: 10, color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    color: "#fff",
  },
  skillRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  status: { marginTop: 15, marginBottom: 15, fontSize: 14, color: "#fff" },
  matchCard: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  matchName: { fontWeight: "600", fontSize: 16, color: "#fff" },
  matchText: { color: "#fff" },
  payButtonWrapper: { marginTop: 10 },
  payStatus: { color: "#FFCC00", marginTop: 8, fontSize: 13 },
});
