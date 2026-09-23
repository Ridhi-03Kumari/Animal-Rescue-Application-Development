import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

const DEFAULT_CONTACTS = [
  {
    name: 'Government Animal Emergency Helpline (Pashu Chikitsa)',
    phone: '1962',
    category: 'Government Helpline',
    description: 'Toll-free emergency veterinary ambulance and medical assistance helpline.',
  },
  {
    name: 'CUPA Trauma Centre (Hebbal)',
    phone: '+91 80 2294 7300',
    category: 'Trauma Rescue & Care',
    description: 'Trauma rescue, surgical care, and rehabilitation for street animals.',
  },
  {
    name: "CARE - Charlie's Animal Rescue Centre (Yelahanka)",
    phone: '+91 94839 16052',
    category: 'Shelter & Hospital',
    description: 'Specializes in severe trauma care and round-the-clock shelter.',
  },
  {
    name: 'Cessna Lifeline 24x7 Veterinary Hospital (Domlur)',
    phone: '+91 76763 65365',
    category: '24x7 Private Hospital',
    description: '24-hour veterinary ICU, emergency trauma surgery, and ambulance.',
  },
];

export default function EmergencyContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getContacts()
      .then((res) => {
        if (res.contacts && res.contacts.length > 0) {
          setContacts(res.contacts);
        }
      })
      .catch((err) => {
        console.log('Using offline contacts cache:', err.message);
      });
  }, []);

  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Unable to call', 'Calling is not available on this device.');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Bengaluru Emergency Contacts</Text>
      <Text style={styles.subtitle}>
        24x7 government helplines, trauma centers, and animal shelters across Bengaluru.
      </Text>

      {contacts.map((contact, idx) => (
        <View key={contact.id || idx} style={styles.contactCard}>
          <Text style={styles.contactCategory}>{contact.category || 'Rescue Service'}</Text>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.description}>{contact.description}</Text>
          {contact.area ? <Text style={styles.areaText}>📍 {contact.area}</Text> : null}
          <Text style={styles.number}>{contact.phone || contact.number}</Text>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => callNumber(contact.phone || contact.number)}
          >
            <Text style={styles.callButtonText}>Call {contact.phone || contact.number}</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Government 1962 Note</Text>
        <Text style={styles.noteText}>
          1962 is a toll-free government veterinary ambulance service operating across Karnataka.
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
    paddingTop: 45,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  contactCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F5D50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
    marginBottom: 10,
  },
  areaText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 10,
  },
  number: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 14,
  },
  callButton: {
    backgroundColor: '#2F5D50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noteCard: {
    backgroundColor: '#DCE9E3',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 18,
  },
});