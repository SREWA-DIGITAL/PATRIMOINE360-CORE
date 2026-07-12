import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { fontSize, spacing, borderRadius } from "@/lib/constants";
import { useTheme } from "@/lib/theme-context";
import { createStyles } from "@/lib/create-styles";

export default function ForgotPasswordScreen() {
  const { resetPassword, confirmPasswordReset } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) return "Veuillez saisir votre adresse e-mail.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Veuillez saisir une adresse e-mail valide.";
    }

    return null;
  };

  const handleRequestOtp = async () => {
    Keyboard.dismiss();
    setError(null);

    const trimmedEmail = email.trim();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsSubmitting(true);
    const { error: resetError } = await resetPassword(trimmedEmail);
    setIsSubmitting(false);

    if (resetError) {
      setError(resetError);
    } else {
      setIsOtpSent(true);
    }
  };

  const handleConfirmReset = async () => {
    Keyboard.dismiss();
    setError(null);

    const trimmedEmail = email.trim();
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (!otp.trim()) {
      setError("Veuillez saisir le code reçu par e-mail.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    const { error: confirmError } = await confirmPasswordReset(
      trimmedEmail,
      otp.trim(),
      password
    );
    setIsSubmitting(false);

    if (confirmError) {
      setError(confirmError);
      return;
    }

    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.inner}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={40}
                color={colors.success}
              />
            </View>
            <Text style={styles.successTitle}>Mot de passe modifié</Text>
            <Text style={styles.successText}>
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe.
            </Text>
            <TouchableOpacity
              testID="back-to-signin-button"
              style={styles.button}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityLabel="Retour à la connexion"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View accessible={false} style={styles.inner}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Retour à la connexion"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Mot de passe oublié ?</Text>
            <Text style={styles.subtitle}>
              {isOtpSent
                ? "Saisissez le code reçu par e-mail et choisissez un nouveau mot de passe."
                : "Saisissez l’e-mail associé à votre compte pour recevoir un code de réinitialisation."}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              testID="forgot-email-input"
              style={[styles.input, error ? styles.inputError : null]}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={colors.placeholderText}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={isOtpSent ? undefined : handleRequestOtp}
              editable={!isSubmitting && !isOtpSent}
              autoFocus
              accessibilityLabel="Adresse e-mail"
            />

            {isOtpSent && (
              <>
                <Text style={styles.label}>Code de vérification</Text>
                <TextInput
                  testID="reset-otp-input"
                  style={[styles.input, error ? styles.inputError : null]}
                  value={otp}
                  onChangeText={(t) => {
                    setOtp(t);
                    setError(null);
                  }}
                  placeholder="123456"
                  placeholderTextColor={colors.placeholderText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="number-pad"
                  returnKeyType="next"
                  editable={!isSubmitting}
                  accessibilityLabel="Code de vérification"
                />

                <Text style={styles.label}>Nouveau mot de passe</Text>
                <TextInput
                  testID="reset-password-input"
                  style={[styles.input, error ? styles.inputError : null]}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError(null);
                  }}
                  placeholder="Votre nouveau mot de passe"
                  placeholderTextColor={colors.placeholderText}
                  secureTextEntry
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="next"
                  editable={!isSubmitting}
                  accessibilityLabel="Nouveau mot de passe"
                />

                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  testID="reset-password-confirm-input"
                  style={[styles.input, error ? styles.inputError : null]}
                  value={passwordConfirm}
                  onChangeText={(t) => {
                    setPasswordConfirm(t);
                    setError(null);
                  }}
                  placeholder="Confirmez le mot de passe"
                  placeholderTextColor={colors.placeholderText}
                  secureTextEntry
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleConfirmReset}
                  editable={!isSubmitting}
                  accessibilityLabel="Confirmer le mot de passe"
                />
              </>
            )}

            {error && (
              <Text
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                {error}
              </Text>
            )}

            <TouchableOpacity
              testID="send-reset-button"
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={isOtpSent ? handleConfirmReset : handleRequestOtp}
              disabled={isSubmitting}
              activeOpacity={0.8}
              accessibilityLabel={
                isOtpSent
                  ? "Réinitialiser le mot de passe"
                  : "Envoyer le code de réinitialisation"
              }
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.buttonText}>
                  {isOtpSent
                    ? "Réinitialiser le mot de passe"
                    : "Envoyer le code"}
                </Text>
              )}
            </TouchableOpacity>

            {isOtpSent && (
              <TouchableOpacity
                testID="resend-reset-code-button"
                style={styles.secondaryButton}
                onPress={handleRequestOtp}
                disabled={isSubmitting}
                activeOpacity={0.8}
                accessibilityLabel="Renvoyer le code"
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>
                  Renvoyer le code
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const useStyles = createStyles((colors, shadows) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  backButton: {
    position: "absolute",
    top: spacing.lg,
    left: 0,
    padding: spacing.sm,
  },
  header: {
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.muted,
    lineHeight: 22,
  },
  form: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSize.lg,
    color: colors.foreground,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xxl,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.buttonGhostText,
    fontSize: fontSize.base,
    fontWeight: "600",
  },

  // Success state
  successContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: "800",
    color: colors.foreground,
  },
  successText: {
    fontSize: fontSize.lg,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  emailHighlight: {
    fontWeight: "600",
    color: colors.foreground,
  },
  successHint: {
    fontSize: fontSize.sm,
    color: colors.mutedLight,
    textAlign: "center",
    marginTop: spacing.sm,
  },
}));
