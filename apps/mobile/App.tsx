import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DAY_HALVES, DEFAULT_APP_TIMEZONE, SLOT_WINDOWS } from "@repo/domain";
import { colors, radii, spacing, typography } from "@repo/theme";

const TOKEN_KEY = "service_marketplace_token_v1";

const apiBase = (
  process.env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:3001"
).replace(/\/$/, "");

async function apiJson<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  const res = await fetch(`${apiBase}${path}`, { ...init, headers });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      typeof json?.message === "string"
        ? json.message
        : Array.isArray(json?.message)
          ? json.message.join(", ")
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

type Screen = "home" | "login" | "signup";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [token, setToken] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const t = await AsyncStorage.getItem(TOKEN_KEY);
      setToken(t);
      setBooting(false);
    })();
  }, []);

  const meLabel = useMemo(() => {
    if (!token) return "Not signed in";
    return "Signed in (token saved)";
  }, [token]);

  async function persistToken(t: string | null) {
    setToken(t);
    if (!t) await AsyncStorage.removeItem(TOKEN_KEY);
    else await AsyncStorage.setItem(TOKEN_KEY, t);
  }

  async function login() {
    setMsg(null);
    try {
      const res = await apiJson<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await persistToken(res.accessToken);
      setScreen("home");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Login failed");
    }
  }

  async function signup() {
    setMsg(null);
    try {
      const res = await apiJson<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, role }),
      });
      await persistToken(res.accessToken);
      setScreen("home");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Signup failed");
    }
  }

  async function logout() {
    await persistToken(null);
  }

  if (booting) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Service marketplace</Text>
        <Text style={styles.p}>
          <Text style={styles.bold}>API: </Text>
          <Text style={styles.code}>{apiBase}</Text>
        </Text>
        <Text style={styles.p}>
          <Text style={styles.bold}>Auth:</Text> {meLabel}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button title="Home" onPress={() => setScreen("home")} />
          <Button title="Log in" onPress={() => setScreen("login")} />
          <Button title="Sign up" onPress={() => setScreen("signup")} />
          <Button title="Log out" onPress={logout} />
        </View>

        {screen === "login" ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            <Text style={styles.h2}>Log in</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button title="Submit" onPress={login} />
          </View>
        ) : null}

        {screen === "signup" ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            <Text style={styles.h2}>Sign up</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name (optional)"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 8)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button title="Customer" onPress={() => setRole("customer")} />
              <Button title="Provider" onPress={() => setRole("provider")} />
            </View>
            <Text style={styles.p}>Selected role: {role}</Text>
            <Button title="Create account" onPress={signup} />
          </View>
        ) : null}

        {msg ? <Text style={styles.error}>{msg}</Text> : null}

        <Text style={[styles.p, { marginTop: 18 }]}>
          <Text style={styles.bold}>Timezone:</Text> {DEFAULT_APP_TIMEZONE}
        </Text>
        {DAY_HALVES.map((half) => {
          const w = SLOT_WINDOWS[half];
          return (
            <Text key={half} style={styles.p}>
              <Text style={styles.bold}>{half}</Text> ({w.label}): {w.startHour}:
              {String(w.startMinute).padStart(2, "0")}–{w.endHour}:
              {String(w.endMinute).padStart(2, "0")} local
            </Text>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.xl, paddingTop: 56 },
  title: {
    fontSize: typography.sizeXl,
    fontWeight: typography.weightBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  h2: {
    fontSize: typography.sizeLg,
    fontWeight: typography.weightBold,
    color: colors.text,
  },
  p: {
    fontSize: typography.sizeMd,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  code: {
    fontFamily: typography.fontFamilyMono,
    backgroundColor: colors.codeBackground,
  },
  bold: { fontWeight: typography.weightBold },
  error: { color: colors.error, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    color: colors.text,
  },
});
