import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

export default function ReportSubmittedScreen({ navigation, route }) {
    const triage = route?.params?.triage;
    return (
    <ScreenBackground style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.iconCircle}>
          <View style={styles.checkMark} />
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.title}>
          Report <Accent>Submitted</Accent>
        </Text>

        <Text maxFontSizeMultiplier={1.3} style={styles.message}>
          Your animal rescue report has been submitted successfully.
        </Text>

        <View style={styles.caseCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.caseLabel}>Case Status</Text>

          <Text maxFontSizeMultiplier={1.3} style={styles.caseStatus}>
            Finding a suitable rescuer
          </Text>

          <Text maxFontSizeMultiplier={1.3} style={styles.caseInfo}>
            You will receive updates as the rescue progresses.
          </Text>

          {triage && (
            <View style={styles.triageCard}>
              <Text maxFontSizeMultiplier={1.3} style={styles.triageTitle}>
                AI Urgency Assessment
              </Text>

              <Text maxFontSizeMultiplier={1.3} style={styles.urgency}>
                {triage.urgency}
              </Text>

              <Text maxFontSizeMultiplier={1.3} style={styles.triageGuidance}>
                {triage.guidance}
              </Text>
            </View>
          )}

          <AppButton
            title="View Case Tracking"
            style={styles.trackButton}
            onPress={() =>
              navigation.navigate('CaseTracking', {
                caseId: route?.params?.caseData?._id,
              })
            }
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  inner: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },

  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.forest,
    borderWidth: 5,
    borderColor: colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  checkMark: {
    width: 16,
    height: 30,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },

  title: {
    fontFamily: fonts.display,
    fontSize: rs(38),
    lineHeight: rs(46),
    color: colors.forestDark,
    textAlign: 'center',
    marginBottom: 12,
  },

  message: {
    fontSize: rs(17),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: rs(25),
    marginBottom: 28,
  },

  caseCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },

  caseLabel: {
    fontSize: rs(14),
    color: colors.soft,
    fontWeight: '600',
    marginBottom: 6,
  },

  caseStatus: {
    fontFamily: fonts.display,
    fontSize: rs(25),
    color: colors.forest,
    marginBottom: 8,
  },

  caseInfo: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
  },

  trackButton: {
    marginTop: 20,
  },

  triageCard: {
    width: '100%',
    backgroundColor: colors.sage,
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
  },

  triageTitle: {
    fontFamily: fonts.serif,
    fontSize: rs(17),
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },

  urgency: {
    fontFamily: fonts.display,
    fontSize: rs(31),
    color: colors.forest,
    marginBottom: 8,
  },

  triageGuidance: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
  },
});
