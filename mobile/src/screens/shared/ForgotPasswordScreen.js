import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../../services/api';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

const MIN_PASSWORD_LENGTH = 6;

// Same rule the server applies (Indian mobile with optional +91 / 0, or any 10-15 digit number),
// so a typo is caught here instead of costing a round trip.
const isValidPhone = (value) => {
  const cleaned = value.replace(/[\s\-()]/g, '');
  return /^(\+91|0)?[6-9]\d{9}$/.test(cleaned) || /^\+?[0-9]{10,15}$/.test(cleaned);
};

// Two steps: (1) ask for a reset code for the account's phone number, (2) enter that code with a new password.
export default function ForgotPasswordScreen({ navigation, route }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'reset'
  const [phone, setPhone] = useState(route.params?.phone || '');
  const [code, setCode] = useState('');
  const [codeAutoFilled, setCodeAutoFilled] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSendCode = async () => {
    setErrorMsg('');
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMsg('Please enter the phone number on your account.');
      return;
    }
    if (!isValidPhone(cleanPhone)) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(cleanPhone);
      // Until an SMS gateway is connected, the server hands the code back when it is not in production.
      // Fill it in so the flow can be tried end to end; otherwise the person types the code they received.
      if (res.resetToken) {
        setCode(res.resetToken);
        setCodeAutoFilled(true);
      } else {
        setCode('');
        setCodeAutoFilled(false);
      }
      setInfoMsg(res.message || 'If an account exists with this phone number, a reset code has been issued.');
      setStep('reset');
    } catch (err) {
      setErrorMsg(err.message || 'Could not request a reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg('');
    if (!code.trim()) {
      setErrorMsg('Please enter the reset code.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword.trim().length === 0) {
      setErrorMsg('Password cannot be only spaces.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(code.trim(), newPassword);
      // Back to the sign-in screen (already in the stack) with the phone filled in and a success note
      navigation.popTo('Auth', { resetDone: true, resetAt: Date.now(), phone: phone.trim() });
    } catch (err) {
      setErrorMsg(err.message || 'Could not reset the password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changeNumber = () => {
    setStep('phone');
    setErrorMsg('');
    setInfoMsg('');
    setCode('');
    setCodeAutoFilled(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const onPhoneStep = step === 'phone';

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="Account Recovery"
          title={
            onPhoneStep ? (
              <>
                Forgot <Accent>password?</Accent>
              </>
            ) : (
              <>
                New <Accent>password</Accent>
              </>
            )
          }
          subtitle={
            onPhoneStep
              ? "Enter the phone number on your account and we'll issue a reset code."
              : 'Choose a strong password you have not used before.'
          }
          left={
            <SegmentedNav
              activeKey="nav"
              items={[{ key: 'nav', label: '← Back', onPress: () => navigation.goBack() }]}
            />
          }
        />
      }
      scroll
      contentStyle={styles.content}
    >
      <View style={styles.card}>
        <Text maxFontSizeMultiplier={1.3} style={styles.stepLabel}>
          {onPhoneStep ? 'STEP 1 OF 2 · VERIFY YOUR NUMBER' : 'STEP 2 OF 2 · NEW PASSWORD'}
        </Text>
        <View style={styles.stepTrack}>
          <View style={[styles.stepBar, styles.stepBarDone]} />
          <View style={[styles.stepBar, !onPhoneStep && styles.stepBarDone]} />
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {onPhoneStep ? (
          <>
            <View style={styles.inputGroup}>
              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Phone Number</Text>
              <TextInput
                maxFontSizeMultiplier={1.3}
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.soft}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                onSubmitEditing={handleSendCode}
              />
            </View>

            <AppButton title="Send Reset Code" onPress={handleSendCode} loading={loading} />
          </>
        ) : (
          <>
            <View style={styles.successBox}>
              <Text maxFontSizeMultiplier={1.3} style={styles.successText}>{infoMsg}</Text>
            </View>

            {codeAutoFilled ? (
              <View style={styles.demoBox}>
                <Text maxFontSizeMultiplier={1.3} style={styles.demoTitle}>Demo mode</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.demoText}>
                  No SMS service is connected yet, so your reset code was filled in for you.
                </Text>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text maxFontSizeMultiplier={1.3} style={styles.label}>Reset Code</Text>
                <TextInput
                  maxFontSizeMultiplier={1.3}
                  style={styles.input}
                  placeholder="Paste the code you received"
                  placeholderTextColor={colors.soft}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={code}
                  onChangeText={setCode}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text maxFontSizeMultiplier={1.3} style={styles.label}>New Password</Text>
              <TextInput
                maxFontSizeMultiplier={1.3}
                style={styles.input}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                placeholderTextColor={colors.soft}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Confirm New Password</Text>
              <TextInput
                maxFontSizeMultiplier={1.3}
                style={styles.input}
                placeholder="Re-enter the new password"
                placeholderTextColor={colors.soft}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleResetPassword}
              />
            </View>

            <AppButton title="Reset Password" onPress={handleResetPassword} loading={loading} />

            <TouchableOpacity style={styles.linkBtn} onPress={changeNumber} accessibilityRole="button">
              <Text maxFontSizeMultiplier={1.3} style={styles.linkText}>Use a different phone number</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text maxFontSizeMultiplier={1.3} style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 56,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.deep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  stepLabel: {
    fontFamily: fonts.display,
    fontSize: rs(15),
    letterSpacing: 1.5,
    color: colors.gold,
    marginBottom: 10,
  },
  stepTrack: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  stepBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.divider,
  },
  stepBarDone: {
    backgroundColor: colors.forest,
  },
  errorBox: {
    backgroundColor: '#FFE3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#B3261E',
    fontSize: rs(14),
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#DDF3E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: '#1F7A3E',
    fontSize: rs(14),
    fontWeight: '600',
  },
  demoBox: {
    backgroundColor: colors.orangeSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  demoTitle: {
    fontFamily: fonts.serif,
    fontSize: rs(14),
    fontWeight: '700',
    color: colors.deep,
    marginBottom: 2,
  },
  demoText: {
    fontSize: rs(13),
    lineHeight: rs(18),
    color: colors.muted,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: rs(14),
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: rs(16),
    color: colors.ink,
    backgroundColor: colors.cream,
  },
  linkBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: rs(14),
    fontWeight: '700',
    color: colors.forest,
    textDecorationLine: 'underline',
  },
});
