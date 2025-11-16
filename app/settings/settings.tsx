import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeProvider";
import { PIN_KEY, BIOMETRIC_KEY } from "@/src/constants/security";
import { getItem, setItem } from "@/src/lib/storage";
import { useLang } from "@/src/context/LangContext";

export default function SecuritySettingsScreen() {
  const { colors } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const [savingPin, setSavingPin] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const pin = await getItem<string | null>(PIN_KEY, null);
      setStoredPin(pin);
      const enabled = await getItem<boolean>(BIOMETRIC_KEY, false);
      setBiometricEnabled(enabled);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return;
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (!types.length) return;
      setBiometricSupported(true);
      setSupportedTypes(types);
    })();
  }, []);

  const labelForBiometric = useCallback(
    (type: number) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return t("security_bioFingerprint");
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return t("security_bioFaceId");
        default:
          return t("security_bioGeneric");
      }
    },
    [t]
  );

  const handleSavePin = async () => {
    if (savingPin) return;
    if (storedPin && currentPin !== storedPin) {
      Alert.alert(t("security_errorTitle"), t("security_errorCurrent"));
      return;
    }
    if (newPin.length < 4) {
      Alert.alert(t("security_errorTitle"), t("security_errorLength"));
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert(t("security_errorTitle"), t("security_errorMismatch"));
      return;
    }
    setSavingPin(true);
    try {
      await setItem(PIN_KEY, newPin);
      setStoredPin(newPin);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      Alert.alert(t("security_successTitle"), t("security_pinUpdated"));
    } finally {
      setSavingPin(false);
    }
  };

  const validateCurrentPin = () => {
    if (!storedPin) {
      Alert.alert(t("security_pinRequiredTitle"), t("security_pinRequiredMessage"));
      return false;
    }
    if (currentPin !== storedPin) {
      Alert.alert(t("security_pinWrongTitle"), t("security_pinWrongMessage"));
      return false;
    }
    return true;
  };

  const toggleBiometric = async () => {
    if (!biometricSupported) {
      Alert.alert(t("security_bioUnsupportedTitle"), t("security_bioUnsupportedMessage"));
      return;
    }
    if (!validateCurrentPin()) return;
    if (bioLoading) return;
    setBioLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("security_bioPrompt"),
        fallbackLabel: t("security_bioFallback"),
      });
      if (!result.success) {
        Alert.alert(t("security_bioFailedTitle"), t("security_bioFailedMessage"));
        return;
      }
      const next = !biometricEnabled;
      await setItem(BIOMETRIC_KEY, next);
      setBiometricEnabled(next);
      Alert.alert(t("security_bioReadyTitle"), next ? t("security_bioEnabled") : t("security_bioDisabled"));
    } finally {
      setBioLoading(false);
    }
  };

  const supportedNames = supportedTypes.map(labelForBiometric).join(", ");

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}
    >
      <Stack.Screen options={{ title: t("security_title") }} />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t("security_pinManagement")}</Text>
        {storedPin && (
          <>
            <Text style={[styles.label, { color: colors.subtext }]}>{t("security_currentPin")}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="****"
              placeholderTextColor={colors.subtext}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
          </>
        )}
        <Text style={[styles.label, { color: colors.subtext }]}>{t("security_newPin")}</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={newPin}
          onChangeText={setNewPin}
          placeholder={t("security_pinPlaceholder")}
          placeholderTextColor={colors.subtext}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <Text style={[styles.label, { color: colors.subtext }]}>{t("security_confirmPin")}</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={confirmPin}
          onChangeText={setConfirmPin}
          placeholder={t("security_pinConfirmPlaceholder")}
          placeholderTextColor={colors.subtext}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSavePin}
          activeOpacity={0.9}
        >
          <Text style={styles.saveText}>
            {savingPin ? t("security_savingPin") : t("security_savePin")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t("security_biometricsTitle")}</Text>
        <Text style={[styles.helper, { color: colors.subtext }]}>
          {biometricSupported
            ? t("security_biometricsSupported", { types: supportedNames })
            : t("security_biometricsNotSupported")}
        </Text>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            { backgroundColor: biometricEnabled ? "#059669" : colors.border },
          ]}
          onPress={toggleBiometric}
          disabled={bioLoading}
          activeOpacity={0.9}
        >
          <Text style={[styles.toggleText, { color: biometricEnabled ? "#fff" : colors.text }]}>
            {bioLoading
              ? t("security_toggleChecking")
              : biometricEnabled
              ? t("security_toggleDisable")
              : t("security_toggleEnable")}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.helper, { color: colors.subtext }]}>{t("security_bioInfo")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  helper: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  toggleText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
