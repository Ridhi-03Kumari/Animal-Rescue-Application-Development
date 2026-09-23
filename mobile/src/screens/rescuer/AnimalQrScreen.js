import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import api from '../../services/api';

export default function AnimalQrScreen({ route, navigation }) {
  const { caseId, animal: initialAnimal } = route.params || {};
  const [animal, setAnimal] = useState(initialAnimal || null);
  const [loading, setLoading] = useState(!initialAnimal);

  useEffect(() => {
    if (!initialAnimal && caseId) {
      api
        .getAnimalByCaseId(caseId)
        .then((res) => setAnimal(res.animal))
        .catch((err) => console.warn('Error loading animal:', err.message))
        .finally(() => setLoading(false));
    }
  }, [caseId, initialAnimal]);

  const shareRecord = async () => {
    if (!animal) return;
    try {
      await Share.share({
        message: `🐾 Animal Rescue Record: ${animal.animalType.toUpperCase()}\nStatus: ${animal.status}\nRescue Date: ${new Date(
          animal.rescueDate
        ).toLocaleDateString()}\nMedical Notes: ${animal.medicalNotes || 'Healthy'}\nRecord URL: ${animal.qrCodeUrl}`,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F5D50" />
        <Text style={styles.loadingText}>Generating Digital Animal Profile...</Text>
      </View>
    );
  }

  if (!animal) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Record Created</Text>
        <Text style={styles.subtext}>Case marked as complete. Animal profile is now permanent.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('RescuerHome')}>
          <Text style={styles.primaryBtnText}>Back to Rescuer Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Animal Digital Health Record</Text>
      <Text style={styles.headerSubtitle}>Permanent QR-linked rescue & medical profile</Text>

      {/* QR Code Collar Tag Card */}
      <View style={styles.qrCard}>
        <Text style={styles.qrBadge}>SCAN COLLAR / TAG</Text>

        {animal.qrCodeData ? (
          <Image
            source={{ uri: animal.qrCodeData }}
            style={styles.qrImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>[QR Code Active]</Text>
          </View>
        )}

        <Text style={styles.animalType}>Rescued {animal.animalType.toUpperCase()}</Text>
        <Text style={styles.animalId}>ID: {animal._id}</Text>
        <Text style={styles.statusBadge}>Status: {animal.status.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Medical & Rescue History</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Rescue Date:</Text>
          <Text style={styles.value}>{new Date(animal.rescueDate).toLocaleDateString()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Found Location:</Text>
          <Text style={styles.value}>
            {animal.foundLocation?.address ||
              `${animal.foundLocation?.latitude?.toFixed(4)}, ${animal.foundLocation?.longitude?.toFixed(4)}`}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Medical Notes:</Text>
        <Text style={styles.descText}>
          {animal.medicalNotes || 'No trauma complications observed upon admission.'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Treatment & Shelter:</Text>
        <Text style={styles.descText}>
          {animal.treatment || 'Sheltered for observation & veterinary recovery.'}
        </Text>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.shareBtn} onPress={shareRecord}>
        <Text style={styles.shareBtnText}>📤 Share Digital Record</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('RescuerHome')}
      >
        <Text style={styles.primaryBtnText}>Return to Rescuer Dashboard</Text>
      </TouchableOpacity>
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
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2F5D50',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qrBadge: {
    backgroundColor: '#DCE9E3',
    color: '#2F5D50',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 8,
  },
  qrPlaceholderText: {
    color: '#888888',
    fontWeight: '600',
  },
  animalType: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  animalId: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 18,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#666666',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222222',
    maxWidth: '65%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  descText: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 19,
    marginTop: 4,
  },
  shareBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2F5D50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareBtnText: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#2F5D50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
