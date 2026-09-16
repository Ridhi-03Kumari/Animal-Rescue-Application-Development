import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';

const CONTACTS = [
  {
    name: 'Animal Emergency Helpline',
    number: '1962',
    description: 'Government animal health and veterinary support helpline.',
  },
];

export default function EmergencyContactsScreen() {
  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert(
        'Unable to call',
        'Calling is not available on this device.'
      );
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Emergency Contacts</Text>

      <Text style={styles.subtitle}>
        Important contacts that may help during an animal emergency.
      </Text>

      {CONTACTS.map((contact) => (
        <View key={contact.number} style={styles.contactCard}>
          <Text style={styles.contactName}>
            {contact.name}
          </Text>

          <Text style={styles.description}>
            {contact.description}
          </Text>

          <Text style={styles.number}>
            {contact.number}
          </Text>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => callNumber(contact.number)}
          >
            <Text style={styles.callButtonText}>
              Call {contact.number}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Important</Text>

        <Text style={styles.noteText}>
          1962 is primarily a government veterinary service for
          livestock and animal owners. Availability and service
          coverage can vary by location.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 24,
  },

  contactCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },

  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 14,
  },

  number: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 16,
  },

  callButton: {
    backgroundColor: '#2F5D50',
    paddingVertical: 13,
    borderRadius: 9,
    alignItems: 'center',
  },

  callButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  noteCard: {
    backgroundColor: '#DCE9E3',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
  },

  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 6,
  },

  noteText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 19,
  },
});