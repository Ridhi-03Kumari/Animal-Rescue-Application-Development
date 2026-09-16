import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import AppButton from '../../components/AppButton';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Animal Emergency Rescue
      </Text>

      <Text style={styles.subtitle}>
        Help an injured animal get the right support.
      </Text>

      <View style={styles.buttonContainer}>
        <AppButton
          title="Report an Animal"
          onPress={() => navigation.navigate('CitizenHome')}
        />
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

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F5D50',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    color: '#222222',
    textAlign: 'center',
    lineHeight: 24,
  },

  buttonContainer: {
    marginTop: 32,
  },
});