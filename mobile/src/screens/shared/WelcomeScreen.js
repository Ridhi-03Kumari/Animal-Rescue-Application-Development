import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import Heading, { Accent } from '../../components/Heading';
import { Paw } from '../../components/Doodles';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

// Painted illustration of the dog and kitten (generated from the hero photo), fading into the page
const WELCOME_ART = require('../../../assets/welcome_art.jpg');
const ART_RATIO = 1160 / 990;

// The start page is laid out to fit one screen with no scrolling: the text and button keep their natural
// size and the illustration takes whatever height is left. (The ScrollView is only a safety net for very
// short screens or very large system fonts; on a normal phone there is nothing to scroll.)
export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [artBox, setArtBox] = useState({ width: 0, height: 0 });

  // Scale the picture to cover its area, keep its bottom edge (where it fades into the page) pinned
  // to the bottom, and centre it sideways. A short area crops the top; a wide one crops the sides.
  const artHeight = Math.max(artBox.height, artBox.width / ART_RATIO);
  const artWidth = artHeight * ART_RATIO;

  const onArtLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setArtBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={styles.root}>
      {/* Dark status-bar icons over the light illustration */}
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.page}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration (flexes to fill the free space) */}
        <View style={styles.artArea} onLayout={onArtLayout}>
          {artBox.width > 0 ? (
            <Image
              source={WELCOME_ART}
              resizeMode="cover"
              style={{
                position: 'absolute',
                bottom: 0,
                left: (artBox.width - artWidth) / 2,
                width: artWidth,
                height: artHeight,
              }}
            />
          ) : null}
        </View>

        <View style={styles.content}>
          <Heading align="center" size="md" eyebrow="Bengaluru Rescue Network">
            Animal Emergency <Accent>Rescue</Accent>
          </Heading>

          <Text maxFontSizeMultiplier={1.3} style={styles.subtitle}>
            Instant AI triage, responder matching, and live tracking for injured animals across Bengaluru.
          </Text>

          <AppButton
            title="Sign In / Create Profile"
            variant="accent"
            onPress={() => navigation.navigate('Auth')}
          />
          <Text maxFontSizeMultiplier={1.3} style={styles.caption}>
            Citizen tracking & rescuer capability profile
          </Text>
        </View>

        {/* Dark footer band (extends under the phone's home indicator) */}
        <View style={[styles.footerBand, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Paw size={26} color={colors.doodleDark} />
          <Text maxFontSizeMultiplier={1.3} style={styles.footerText}>
            {'24/7 Smart Emergency Response\nNetwork for Bengaluru'}
          </Text>
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
  // flexGrow makes the page at least as tall as the screen, so the art area can stretch to fill it
  page: {
    flexGrow: 1,
  },
  artArea: {
    flex: 1,
    minHeight: 150,
    overflow: 'hidden',
    backgroundColor: colors.cream,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 2,
    paddingBottom: 18,
  },
  subtitle: {
    fontFamily: fonts.script,
    fontSize: rs(23),
    lineHeight: rs(27),
    textAlign: 'center',
    color: colors.muted,
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  caption: {
    fontFamily: fonts.script,
    fontSize: rs(20),
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  footerBand: {
    backgroundColor: colors.deep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 14,
    paddingHorizontal: 20,
  },
  footerText: {
    flexShrink: 1,
    fontSize: rs(13),
    color: '#CBDAD0',
    fontWeight: '600',
    textAlign: 'center',
  },
});
