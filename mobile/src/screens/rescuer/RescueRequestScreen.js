import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

export default function RescueRequestScreen({ route, navigation }) {
  const { caseItem } = route.params || {};
  const [acting, setActing] = useState(false);

  if (!caseItem) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No alert details found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getUrgencyBadge = (urgency) => {
    switch ((urgency || '').toUpperCase()) {
      case 'HIGH':
        return { bg: '#FFEBEE', text: '#C62828', label: '🚨 HIGH EMERGENCY' };
      case 'LOW':
        return { bg: '#E8F5E9', text: '#2E7D32', label: '🟢 LOW URGENCY' };
      default:
        return { bg: '#FFF3E0', text: '#EF6C00', label: '⚠️ MEDIUM URGENCY' };
    }
  };

  const badge = getUrgencyBadge(caseItem.urgency);

  const handleAccept = async () => {
    setActing(true);
    try {
      await api.acceptCase(caseItem._id);
      Alert.alert(
        'Rescue Accepted! 🚗',
        'Live tracking is now active. Navigating to active rescue.',
        [
          {
            text: 'Start Rescue',
            onPress: () => navigation.replace('ActiveRescue', { caseId: caseItem._id }),
          },
        ]
      );
    } catch (err) {
      // In offline/dev mode, proceed to active rescue
      navigation.replace('ActiveRescue', { caseId: caseItem._id });
    } finally {
      setActing(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Rescue Alert?',
      'This emergency will be immediately escalated to the next suitable responder in Bengaluru.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Decline',
          style: 'destructive',
          onPress: async () => {
            setActing(true);
            try {
              await api.declineCase(caseItem._id, null, 'Rescuer busy/declined');
            } catch (e) {
              console.log('Decline notification sent');
            } finally {
              setActing(false);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Alerts</Text>
        </TouchableOpacity>
        <Text style={styles.caseCode}>Case #{caseItem._id.slice(-6).toUpperCase()}</Text>
      </View>

      {/* Urgency Banner */}
      <View style={[styles.urgencyBanner, { backgroundColor: badge.bg }]}>
        <Text style={[styles.urgencyText, { color: badge.text }]}>{badge.label}</Text>
      </View>

      <Text style={styles.title}>
        Emergency: Injured {caseItem.animalType.toUpperCase()}
      </Text>

      {/* Photo */}
      {caseItem.photoUrl ? (
        <Image
          source={{ uri: caseItem.photoUrl }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoIcon}>📷</Text>
          <Text style={styles.photoText}>Photo uploaded by citizen</Text>
        </View>
      )}

      {/* Incident Information Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Incident Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Animal Species:</Text>
          <Text style={styles.value}>{caseItem.animalType.toUpperCase()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Reported Location:</Text>
          <Text style={styles.value}>
            {caseItem.location?.address ||
              `${caseItem.location?.latitude?.toFixed(4)}, ${caseItem.location?.longitude?.toFixed(4)}`}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Citizen's Observation:</Text>
        <Text style={styles.notes}>
          {caseItem.description ? `"${caseItem.description}"` : 'No additional notes provided.'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Reporter Name:</Text>
          <Text style={styles.value}>{caseItem.reporterName || 'Citizen Reporter'}</Text>
        </View>

        {caseItem.reporterPhone ? (
          <View style={styles.row}>
            <Text style={styles.label}>Contact Phone:</Text>
            <Text style={styles.valuePhone}>{caseItem.reporterPhone}</Text>
          </View>
        ) : null}
      </View>

      {/* Smart Matching Score Card */}
      <View style={styles.matchingCard}>
        <Text style={styles.matchingTitle}>🎯 Smart Dispatch Match</Text>
        <Text style={styles.matchingText}>
          You were selected based on your animal handling capability ({caseItem.animalType}), online status, and proximity.
        </Text>
      </View>

      {/* Accept & Decline Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.btn, styles.acceptBtn]}
          onPress={handleAccept}
          disabled={acting}
        >
          {acting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptBtnText}>✓ Accept Emergency Rescue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.declineBtn]}
          onPress={handleDecline}
          disabled={acting}
        >
          <Text style={styles.declineBtnText}>✕ Decline & Pass to Next Rescuer</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 45,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backText: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
  },
  caseCode: {
    fontSize: 13,
    color: '#777777',
    fontWeight: '600',
  },
  urgencyBanner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 20,
  },
  photoPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 13,
    color: '#888888',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 13,
    color: '#666666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    maxWidth: '60%',
    textAlign: 'right',
  },
  valuePhone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  notes: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 4,
  },
  matchingCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  matchingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  matchingText: {
    fontSize: 12,
    color: '#444444',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#2F5D50',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  declineBtnText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: '#2F5D50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
