import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

const MOCK_HISTORY = [
  {
    _id: 'case_comp_001',
    animalType: 'dog',
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    location: { address: '100 Feet Rd, Indiranagar, Bengaluru' },
    medicalNotes: 'Fractured hind leg splinted, anti-rabies booster administered',
    treatment: 'Admitted to CARE Veterinary Ward',
  },
  {
    _id: 'case_comp_002',
    animalType: 'cat',
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    location: { address: 'Koramangala 4th Block, Bengaluru' },
    medicalNotes: 'Eye infection treated with antibiotic drops',
    treatment: 'Discharged to local foster guardian',
  },
  {
    _id: 'case_comp_003',
    animalType: 'bird',
    status: 'completed',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    location: { address: 'Cubbon Park, Bengaluru' },
    medicalNotes: 'Kite thread entanglement removed, wing rested',
    treatment: 'Released after flight test at PFA Wildlife Hospital',
  },
];

export default function RescuerHistoryScreen({ navigation }) {
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getAllCases({ status: 'completed' })
      .then((res) => {
        if (res.cases && res.cases.length > 0) {
          setHistory(res.cases);
        }
      })
      .catch((err) => {
        console.log('Using offline rescue history cache:', err.message);
      });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rescue Case History</Text>
      </View>

      <Text style={styles.subtitle}>
        Archive of all completed animal emergency rescues and medical records.
      </Text>

      {history.map((item) => (
        <View key={item._id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.animalType}>🐾 Rescued {item.animalType.toUpperCase()}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ COMPLETED</Text>
            </View>
          </View>

          <Text style={styles.date}>
            Rescue Date: {new Date(item.createdAt).toLocaleDateString()}
          </Text>

          <Text style={styles.location}>
            📍 {item.location?.address || 'Bengaluru Location'}
          </Text>

          {item.medicalNotes ? (
            <View style={styles.medicalBox}>
              <Text style={styles.medicalTitle}>Medical Notes:</Text>
              <Text style={styles.medicalText}>{item.medicalNotes}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => navigation.navigate('AnimalQr', { caseId: item._id })}
          >
            <Text style={styles.qrBtnText}>🔍 View Collar QR Health Profile</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },
  content: {
    padding: 20,
    paddingTop: 45,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  animalType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  location: {
    fontSize: 13,
    color: '#444444',
    marginBottom: 10,
  },
  medicalBox: {
    backgroundColor: '#FAFAF7',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2F5D50',
    marginBottom: 12,
  },
  medicalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 2,
  },
  medicalText: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
  },
  qrBtn: {
    backgroundColor: '#DCE9E3',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrBtnText: {
    color: '#2F5D50',
    fontSize: 13,
    fontWeight: '700',
  },
});
