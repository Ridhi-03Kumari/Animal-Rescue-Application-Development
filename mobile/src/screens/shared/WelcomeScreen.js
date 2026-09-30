import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ScrollView,
} from 'react-native';

const HERO_BG = require('../../../assets/rescue_hero_bg.jpg');

export default function WelcomeScreen({ navigation }) {
  return (
    <ImageBackground source={HERO_BG} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Glassmorphism Card */}
          <View style={styles.card}>
            {/* Top Brand Badge */}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>🐾 BENGALURU RESCUE NETWORK</Text>
            </View>

            <Text style={styles.title}>Animal Emergency Rescue</Text>

            <Text style={styles.subtitle}>
              Instant AI triage, responder matching, and live tracking for injured animals across Bengaluru.
            </Text>

            {/* Action Buttons Container */}
            <View style={styles.buttonContainer}>
              {/* Sign In / Register Button (Primary) */}
              <TouchableOpacity
                style={styles.primaryAuthBtn}
                onPress={() => navigation.navigate('Auth')}
                activeOpacity={0.85}
              >
                <View style={styles.btnContentRow}>
                  <Text style={styles.btnIcon}>🔐</Text>
                  <View style={styles.btnTextGroup}>
                    <Text style={styles.primaryBtnTitle}>Sign In / Create Profile</Text>
                    <Text style={styles.primaryBtnSub}>Citizen tracking & rescuer capability profile</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Elegant Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>QUICK ACCESS</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Citizen Button */}
              <TouchableOpacity
                style={styles.citizenBtn}
                onPress={() => navigation.navigate('CitizenHome')}
                activeOpacity={0.85}
              >
                <View style={styles.btnContentRow}>
                  <Text style={styles.btnIcon}>👤</Text>
                  <View style={styles.btnTextGroup}>
                    <Text style={styles.citizenBtnTitle}>I am a Citizen</Text>
                    <Text style={styles.citizenBtnSub}>Report an injured animal or view status</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Rescuer Button */}
              <TouchableOpacity
                style={styles.rescuerBtn}
                onPress={() => navigation.navigate('RescuerHome')}
                activeOpacity={0.85}
              >
                <View style={styles.btnContentRow}>
                  <Text style={styles.btnIcon}>🚑</Text>
                  <View style={styles.btnTextGroup}>
                    <Text style={styles.rescuerBtnTitle}>I am a Rescuer / Volunteer</Text>
                    <Text style={styles.rescuerBtnSub}>Respond to dispatch alerts & update rescues</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer Guarantee */}
            <View style={styles.footerNote}>
              <Text style={styles.footerText}>
                💚 24/7 Smart Emergency Response Network for Bengaluru
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 38, 30, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'rgba(255, 254, 245, 0.76)',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#1E4D3E',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  badgeContainer: {
    alignSelf: 'center',
    backgroundColor: '#FBECEF',
    borderWidth: 1,
    borderColor: '#F0CCD5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A1E3A',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E4D3E',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    gap: 10,
  },
  primaryAuthBtn: {
    backgroundColor: '#1E4D3E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#1E4D3E',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  btnTextGroup: {
    flex: 1,
  },
  primaryBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  primaryBtnSub: {
    color: '#D4E8E1',
    fontSize: 11,
    lineHeight: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(122, 30, 58, 0.15)',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 10,
    color: '#7A1E3A',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  citizenBtn: {
    backgroundColor: 'rgba(255, 251, 235, 0.92)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E8DCB5',
  },
  citizenBtnTitle: {
    color: '#1E4D3E',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  citizenBtnSub: {
    color: '#5C6350',
    fontSize: 11,
    lineHeight: 14,
  },
  rescuerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E2CDD3',
  },
  rescuerBtnTitle: {
    color: '#7A1E3A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  rescuerBtnSub: {
    color: '#666666',
    fontSize: 11,
    lineHeight: 14,
  },
  footerNote: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#667770',
    fontWeight: '500',
  },
});