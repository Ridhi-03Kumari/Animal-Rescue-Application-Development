import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import api from '../../services/api';

const STATUS_STEPS = [
  { key: 'accepted', label: 'Accepted', icon: '✓' },
  { key: 'on_the_way', label: 'On the Way', icon: '🚗' },
  { key: 'reached_location', label: 'Reached', icon: '📍' },
  { key: 'animal_picked_up', label: 'Picked Up', icon: '🐾' },
  { key: 'at_shelter', label: 'At Shelter / Vet', icon: '🏥' },
  { key: 'completed', label: 'Completed', icon: '🎉' },
];

export default function ActiveRescueScreen({ route, navigation }) {
  const { caseId } = route.params || {};
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [treatment, setTreatment] = useState('');

  const loadCase = async () => {
    try {
      setLoading(true);
      const res = await api.getCaseById(caseId);
      setCaseData(res.case);
      if (res.case?.medicalNotes) setMedicalNotes(res.case.medicalNotes);
      if (res.case?.treatment) setTreatment(res.case.treatment);
    } catch (err) {
      Alert.alert('Error', 'Unable to load case details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) loadCase();
  }, [caseId]);

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const res = await api.updateCaseStatus(caseId, {
        status: newStatus,
        note: `Rescuer updated status to ${newStatus.replace(/_/g, ' ')}`,
        medicalNotes,
        treatment,
      });

      setCaseData(res.case);

      if (newStatus === 'completed') {
        Alert.alert(
          'Rescue Completed!',
          'Permanent digital animal profile has been generated with a scannable QR code.',
          [
            {
              text: 'View Animal QR Profile',
              onPress: () =>
                navigation.navigate('AnimalQr', {
                  caseId,
                  animal: res.animal,
                }),
            },
          ]
        );
      } else {
        Alert.alert('Status Updated', `Status changed to "${newStatus.replace(/_/g, ' ')}". Citizen notified.`);
      }
    } catch (err) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const callReporter = () => {
    const phone = caseData?.reporterPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Call Error', 'Unable to initiate call from this device');
      });
    } else {
      Alert.alert('No Phone', 'Reporter did not provide a phone number');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F5D50" />
        <Text style={styles.loadingText}>Loading Rescue Case...</Text>
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Rescue case not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === caseData.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('RescuerHome')}>
          <Text style={styles.backArrow}>← All Alerts</Text>
        </TouchableOpacity>
        <Text style={styles.topStatus}>Status: {caseData.status.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>

      <Text style={styles.caseHeader}>
        Emergency: Injured {caseData.animalType.toUpperCase()}
      </Text>
      <Text style={styles.caseIdText}>Case #{caseData._id.slice(-6).toUpperCase()}</Text>

      {/* Animal Photo */}
      {caseData.photoUrl ? (
        <Image source={{ uri: caseData.photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : null}

      {/* Caller & Location Card */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionHeader}>Caller & Location</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Reporter:</Text>
          <Text style={styles.value}>{caseData.reporterName || 'Anonymous'}</Text>
        </View>

        {caseData.reporterPhone ? (
          <TouchableOpacity style={styles.phoneRow} onPress={callReporter}>
            <Text style={styles.phoneText}>📞 Call Reporter: {caseData.reporterPhone}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.label}>Location Coordinates:</Text>
        <Text style={styles.address}>
          📍 Lat: {caseData.location?.latitude?.toFixed(5)}, Long: {caseData.location?.longitude?.toFixed(5)}
        </Text>
        {caseData.location?.address ? (
          <Text style={styles.addressDetails}>{caseData.location.address}</Text>
        ) : null}

        {caseData.description ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>Citizen Report Notes:</Text>
            <Text style={styles.descText}>"{caseData.description}"</Text>
          </>
        ) : null}
      </View>

      {/* Status Progress Stepper */}
      <Text style={styles.sectionHeader}>Rescue Progress Stepper</Text>
      <View style={styles.stepperContainer}>
        {STATUS_STEPS.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepCircle, isDone && styles.stepCircleDone]}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
              </View>

              <View style={styles.stepInfo}>
                <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>{step.label}</Text>
                {isCurrent && <Text style={styles.currentBadge}>Current State</Text>}
              </View>

              {idx > currentIdx && idx === currentIdx + 1 && (
                <TouchableOpacity
                  style={styles.advanceBtn}
                  onPress={() => updateStatus(step.key)}
                  disabled={updating}
                >
                  <Text style={styles.advanceBtnText}>
                    {step.key === 'completed' ? 'Complete' : 'Advance →'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Post-Rescue Medical Notes */}
      <View style={styles.medicalCard}>
        <Text style={styles.sectionHeader}>Medical Notes & Treatment</Text>
        <Text style={styles.subtext}>Recorded into animal's permanent QR health profile</Text>

        <TextInput
          style={styles.input}
          placeholder="Medical observations (e.g. laceration cleaned, bone splinted)..."
          placeholderTextColor="#888888"
          value={medicalNotes}
          onChangeText={setMedicalNotes}
          multiline
          numberOfLines={3}
        />

        <TextInput
          style={styles.input}
          placeholder="Treatment administered / Vet Clinic Name..."
          placeholderTextColor="#888888"
          value={treatment}
          onChangeText={setTreatment}
        />
      </View>

      {/* Direct Complete Button */}
      {caseData.status !== 'completed' && (
        <TouchableOpacity
          style={styles.completeBigBtn}
          onPress={() => updateStatus('completed')}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.completeBigBtnText}>✓ Complete Rescue & Generate QR Profile</Text>
          )}
        </TouchableOpacity>
      )}

      {caseData.status === 'completed' && (
        <TouchableOpacity
          style={styles.viewQrBtn}
          onPress={() => navigation.navigate('AnimalQr', { caseId })}
        >
          <Text style={styles.viewQrBtnText}>🔍 View Animal Digital Profile & QR Tag</Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
    fontSize: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backArrow: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
  },
  topStatus: {
    backgroundColor: '#DCE9E3',
    color: '#2F5D50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  caseHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
  },
  caseIdText: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 10,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  phoneRow: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  phoneText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  address: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '600',
    marginTop: 2,
  },
  addressDetails: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  descText: {
    fontSize: 13,
    color: '#444444',
    fontStyle: 'italic',
    marginTop: 4,
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 16,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepCircleDone: {
    backgroundColor: '#DCE9E3',
  },
  stepIcon: {
    fontSize: 14,
  },
  stepInfo: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    color: '#888888',
  },
  stepLabelDone: {
    color: '#222222',
    fontWeight: '600',
  },
  currentBadge: {
    fontSize: 11,
    color: '#2F5D50',
    fontWeight: '700',
  },
  advanceBtn: {
    backgroundColor: '#2F5D50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  advanceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  medicalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 16,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 10,
    backgroundColor: '#FAFAF7',
    color: '#222222',
  },
  completeBigBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeBigBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  viewQrBtn: {
    backgroundColor: '#2F5D50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  viewQrBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    backgroundColor: '#2F5D50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
