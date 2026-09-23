import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>🐾 BENGALURU RESCUE NETWORK</Text>
      </View>

      <Text style={styles.title}>
        Animal Emergency Rescue
      </Text>

      <Text style={styles.subtitle}>
        Instant AI triage, responder matching, and live tracking for injured animals in Bengaluru.
      </Text>

      <View style={styles.buttonContainer}>
        {/* Citizen Button */}
        <TouchableOpacity
          style={styles.citizenBtn}
          onPress={() => navigation.navigate('CitizenHome')}
        >
          <Text style={styles.citizenBtnText}>I am a Citizen</Text>
          <Text style={styles.btnSubtext}>Report an injured animal or view status</Text>
        </TouchableOpacity>

        {/* Rescuer Button */}
        <TouchableOpacity
          style={styles.rescuerBtn}
          onPress={() => navigation.navigate('RescuerHome')}
        >
          <Text style={styles.rescuerBtnText}>I am a Rescuer / Volunteer</Text>
          <Text style={styles.btnSubtextRescuer}>Respond to emergency alerts & track rescues</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FAFAF7',
  },
  badgeContainer: {
    alignSelf: 'center',
    backgroundColor: '#DCE9E3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F5D50',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2F5D50',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  buttonContainer: {
    gap: 16,
  },
  citizenBtn: {
    backgroundColor: '#2F5D50',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#2F5D50',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  citizenBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  btnSubtext: {
    color: '#DCE9E3',
    fontSize: 13,
  },
  rescuerBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2F5D50',
  },
  rescuerBtnText: {
    color: '#2F5D50',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  btnSubtextRescuer: {
    color: '#666666',
    fontSize: 13,
  },
});