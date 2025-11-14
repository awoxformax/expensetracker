import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Logo from "../../assets/images/Logo.svg";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { useOnboarding } from "../../context/Onboarding";
import { useUser } from "../../context/UserContext";
import { ONBOARDING_DONE_KEY } from "../../constants/storage";

type PremiumAuthScreenProps = {
  mode: "login" | "signup";
};

type GradientTuple = [string, string];

const BACKGROUND_SOURCE = {
  uri: "https://images.unsplash.com/photo-1557683316-973673baf926",
};

const ACTION_GRADIENT_LIGHT: GradientTuple = ["#3A7BD5", "#00D2FF"];
const ACTION_GRADIENT_DARK: GradientTuple = ["#4C7FF0", "#18C1FF"];

type IconName = keyof typeof Ionicons.glyphMap;

export default function PremiumAuthScreen({ mode }: PremiumAuthScreenProps) {
  const { colors, fonts, isDark } = useTheme();
  const { login, signup } = useAuth();
  const { reset: resetOnboarding } = useOnboarding();
  const { setName } = useUser();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 768;

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslate, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 160,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }),
    ]).start();
  }, [screenOpacity, cardTranslate, logoScale]);

  const title = mode === "login" ? "Welcome Back" : "Create Account";
  const subtitle =
    mode === "login"
      ? "Securely sign in to track every AZN with confidence."
      : "Open your expense vault and stay ahead of every transaction.";

  const actionLabel = mode === "login" ? "Sign In" : "Register";
  const secondaryLabel = mode === "login" ? "Switch to Register" : "Switch to Login";
  const secondaryRoute = mode === "login" ? "/auth/signup" : "/auth/login";

  const overlayColors: GradientTuple = isDark
    ? ["rgba(5,8,18,0.95)", "rgba(6,12,26,0.65)"]
    : ["rgba(255,255,255,0.78)", "rgba(235,245,255,0.25)"];

  const glassBackground = isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.22)";
  const borderColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(14,35,64,0.18)";
  const inputBackground = isDark ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.75)";
  const inputBorder = isDark ? "rgba(255,255,255,0.25)" : "rgba(32,64,128,0.18)";
  const shadowColor = isDark ? "#000000" : "#0E2A4F";
  const socialBorder = isDark ? "rgba(255,255,255,0.24)" : "rgba(15,23,42,0.16)";
  const actionGradient = isDark ? ACTION_GRADIENT_DARK : ACTION_GRADIENT_LIGHT;

  const panelWidth = Math.min(540, width * 0.92);
  const horizontalPadding = Math.max(24, Math.min(width * 0.12, 72));
  const panelPadding = Math.max(24, Math.min(panelWidth * 0.15, 60));
  const titleSize = width >= 1024 ? 40 : width >= 768 ? 34 : 30;
  const subtitleSize = titleSize * 0.55;
  const logoSize = isTablet ? 110 : 80;

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    let success = false;
    if (mode === "login") {
      success = await login(trimmedEmail, password);
    } else {
      success = await signup(trimmedEmail, password);
      if (success && trimmedName) {
        const segments = trimmedName.split(" ");
        const first = segments.shift() ?? "";
        const last = segments.join(" ");
        setName(first, last);
      }
    }
    if (success) {
      resetOnboarding();
      await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
      router.replace("/onboarding/tutorial");
    }
    setSubmitting(false);
  }, [submitting, mode, email, password, fullName, login, signup, resetOnboarding, router, setName]);

  const renderSocialButton = (icon: IconName, label: string, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.socialButton,
        {
          borderColor: socialBorder,
          backgroundColor: inputBackground,
          opacity: pressed ? 0.65 : hovered ? 0.85 : 1,
        },
        { shadowColor },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={[styles.socialText, { color: colors.text, fontFamily: fonts.body }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <ImageBackground source={BACKGROUND_SOURCE} style={styles.background} resizeMode="cover">
        <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingVertical: isTablet ? 80 : 40,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.center, { paddingHorizontal: horizontalPadding }]}>
              <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                <Logo width={logoSize} height={logoSize} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.panelWrapper,
                  {
                    width: panelWidth,
                    transform: [{ translateY: cardTranslate }],
                    shadowColor,
                  },
                ]}
              >
                <BlurView
                  intensity={isDark ? 95 : 55}
                  tint={isDark ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    styles.panel,
                    {
                      backgroundColor: glassBackground,
                      borderColor,
                      paddingHorizontal: panelPadding,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.title,
                      { fontSize: titleSize, color: colors.text, fontFamily: fonts.heading },
                    ]}
                  >
                    {title}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      {
                        fontSize: subtitleSize,
                        color: colors.subtext,
                        fontFamily: fonts.body,
                      },
                    ]}
                  >
                    {subtitle}
                  </Text>

                  {mode === "signup" && (
                    <View style={styles.fieldBlock}>
                      <Text style={[styles.label, { color: colors.subtext, fontFamily: fonts.body }]}>
                        Full Name
                      </Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          { backgroundColor: inputBackground, borderColor: inputBorder, shadowColor },
                        ]}
                      >
                        <Ionicons name="person-outline" size={20} color={colors.subtext} />
                        <TextInput
                          value={fullName}
                          onChangeText={setFullName}
                          placeholder="Jane Doe"
                          placeholderTextColor={colors.subtext}
                          style={[styles.input, { color: colors.text, fontFamily: fonts.body }]}
                          autoCapitalize="words"
                          returnKeyType="next"
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.fieldBlock}>
                    <Text style={[styles.label, { color: colors.subtext, fontFamily: fonts.body }]}>
                      Email
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: inputBackground, borderColor: inputBorder, shadowColor },
                      ]}
                    >
                      <Ionicons name="mail-outline" size={20} color={colors.subtext} />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="finance@example.com"
                        placeholderTextColor={colors.subtext}
                        style={[styles.input, { color: colors.text, fontFamily: fonts.body }]}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldBlock}>
                    <Text style={[styles.label, { color: colors.subtext, fontFamily: fonts.body }]}>
                      Password
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        { backgroundColor: inputBackground, borderColor: inputBorder, shadowColor },
                      ]}
                    >
                      <Ionicons name="lock-closed-outline" size={20} color={colors.subtext} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor={colors.subtext}
                        style={[styles.input, { color: colors.text, fontFamily: fonts.body }]}
                        secureTextEntry
                        returnKeyType="done"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={{ marginTop: 8 }}
                  >
                    <LinearGradient
                      colors={actionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryButton}
                    >
                      <Text
                        style={[
                          styles.primaryText,
                          { fontFamily: fonts.heading },
                        ]}
                      >
                        {submitting ? "Please wait..." : actionLabel}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { borderColor }]} />
                    <Text
                      style={[
                        styles.dividerText,
                        { color: colors.subtext, fontFamily: fonts.body },
                      ]}
                    >
                      or continue with
                    </Text>
                    <View style={[styles.dividerLine, { borderColor }]} />
                  </View>

                  <View style={styles.socialRow}>
                    {renderSocialButton("logo-google", "Continue with Google", () => {})}
                    {Platform.OS === "ios" &&
                      renderSocialButton("logo-apple", "Continue with Apple", () => {})}
                  </View>

                  <Pressable
                    onPress={() => router.replace(secondaryRoute)}
                    style={({ hovered, pressed }) => [
                      styles.secondaryButton,
                      { opacity: pressed ? 0.5 : hovered ? 0.75 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryText,
                        { color: colors.text, fontFamily: fonts.body },
                      ]}
                    >
                      {secondaryLabel}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    gap: 32,
  },
  panelWrapper: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: 36,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 6,
  },
  panel: {
    width: "100%",
    borderRadius: 22,
    paddingVertical: 24,
    borderWidth: 1,
    gap: 16,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 24,
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    height: 52,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  dividerRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    borderBottomWidth: 1,
    opacity: 0.4,
  },
  dividerText: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  socialRow: {
    marginTop: 12,
    width: "100%",
    gap: 12,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  secondaryText: {
    fontSize: 15,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
