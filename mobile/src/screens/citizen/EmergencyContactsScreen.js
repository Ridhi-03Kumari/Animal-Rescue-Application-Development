import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

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
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="24x7 Helplines"
          title={
            <>
              Bengaluru Emergency <Accent>Contacts</Accent>
            </>
          }
          subtitle="Government helplines, trauma centers, and animal shelters across Bengaluru."
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
        {contacts.map((contact, idx) => (
          <View key={contact.id || idx} style={styles.contactCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.contactCategory}>{contact.category || 'Rescue Service'}</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.contactName}>{contact.name}</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.description}>{contact.description}</Text>
            {contact.area ? <Text maxFontSizeMultiplier={1.3} style={styles.areaText}>{contact.area}</Text> : null}
            <Text maxFontSizeMultiplier={1.3} style={styles.number}>{contact.phone || contact.number}</Text>

            <AppButton
              title={`Call ${contact.phone || contact.number}`}
              size="md"
              onPress={() => callNumber(contact.phone || contact.number)}
            />
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.noteTitle}>Government 1962 Note</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.noteText}>
            1962 is a toll-free government veterinary ambulance service operating across Karnataka.
          </Text>
        </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  contactCategory: {
    fontSize: rs(13),
    fontWeight: '800',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  contactName: {
    fontFamily: fonts.display,
    fontSize: rs(25),
    lineHeight: rs(32),
    color: colors.ink,
    marginBottom: 8,
  },
  description: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
    marginBottom: 12,
  },
  areaText: {
    fontSize: rs(14),
    color: colors.soft,
    fontWeight: '600',
    marginBottom: 12,
  },
  number: {
    fontFamily: fonts.display,
    fontSize: rs(30),
    color: colors.forest,
    marginBottom: 16,
  },
  noteCard: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    padding: 20,
    marginTop: 4,
  },
  noteTitle: {
    fontFamily: fonts.serif,
    fontSize: rs(17),
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 6,
  },
  noteText: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
  },
});
