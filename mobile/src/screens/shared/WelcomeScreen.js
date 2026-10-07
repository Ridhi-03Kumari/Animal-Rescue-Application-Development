import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppButton from '../../components/AppButton';
import Heading, { Accent } from '../../components/Heading';
import { Paw } from '../../components/Doodles';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

// Painted illustration of the dog and kitten (generated from the hero photo), fading into the page
const WELCOME_ART = require('../../../assets/welcome_art.jpg');
const ART_RATIO = 1160 / 990;
const MAX_ART_HEIGHT = 440;

export default function WelcomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const artHeight = Math.min(width / ART_RATIO, MAX_ART_HEIGHT);

  return (
    <View style={styles.root}>
      {/* Dark status-bar icons over the light illustration */}
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <Image
          source={WELCOME_ART}
          style={[styles.art, { height: artHeight }]}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Heading align="center" size="lg" eyebrow="Bengaluru Rescue Network">
            Animal Emergency <Accent>Rescue</Accent>
          </Heading>

          <Text maxFontSizeMultiplier={1.3} style={styles.subtitle}>
            Instant AI triage, responder matching, and live tracking for injured animals across Bengaluru.
          </Text>

          <View style={styles.buttonContainer}>
            {/* Sign In / Register Button (Primary) */}
            <AppButton
              title="Sign In / Create Profile"
              variant="accent"
              onPress={() => navigation.navigate('Auth')}
            />
            <Text maxFontSizeMultiplier={1.3} style={styles.caption}>Citizen tracking & rescuer capability profile</Text>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text maxFontSizeMultiplier={1.3} style={styles.dividerText}>QUICK ACCESS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Citizen Button */}
            <TouchableOpacity
              style={styles.roleBtn}
              onPress={() => navigation.navigate('CitizenHome')}
              activeOpacity={0.85}
            >
              <View style={styles.btnTextGroup}>
                <Text maxFontSizeMultiplier={1.3} style={styles.roleBtnTitle}>I am a Citizen</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.roleBtnSub}>Report an injured animal or view status</Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Rescuer Button */}
            <TouchableOpacity
              style={styles.roleBtn}
              onPress={() => navigation.navigate('Auth', { role: 'rescuer' })}
              activeOpacity={0.85}
            >
              <View style={styles.btnTextGroup}>
                <Text maxFontSizeMultiplier={1.3} style={styles.roleBtnTitle}>I am a Rescuer / Volunteer</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.roleBtnSub}>Log in to respond to dispatch alerts & update rescues</Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dark footer band */}
        <View style={styles.footerBand}>
          <Paw size={30} color={colors.doodleDark} />
          <Text maxFontSizeMultiplier={1.3} style={styles.footerText}>24/7 Smart Emergency Response Network for Bengaluru</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  art: {
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 36,
  },
  subtitle: {
    fontFamily: fonts.script,
    fontSize: rs(24),
    lineHeight: rs(29),
    textAlign: 'center',
    color: colors.muted,
    marginTop: 10,
    marginBottom: 26,
    paddingHorizontal: 6,
  },
  buttonContainer: {
    width: '100%',
    gap: 14,
  },
  caption: {
    fontFamily: fonts.script,
    fontSize: rs(20),
    color: colors.muted,
    textAlign: 'center',
    marginTop: -4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 14,
    fontFamily: fonts.display,
    fontSize: rs(15),
    color: colors.gold,
    letterSpacing: 2,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.forest,
    borderWidth: 1.5,
    borderColor: colors.forest,
  },
  btnTextGroup: {
    flex: 1,
  },
  roleBtnTitle: {
    fontFamily: fonts.display,
    color: '#FFFFFF',
    fontSize: rs(24),
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  roleBtnSub: {
    color: '#CFE0D6',
    fontSize: rs(14),
    lineHeight: rs(19),
  },
  chevron: {
    fontSize: rs(32),
    color: colors.lime,
    marginLeft: 10,
    marginTop: -4,
  },
  footerBand: {
    backgroundColor: colors.deep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    flexShrink: 1,
    fontSize: rs(14),
    color: '#CBDAD0',
    fontWeight: '600',
    textAlign: 'center',
  },
});
