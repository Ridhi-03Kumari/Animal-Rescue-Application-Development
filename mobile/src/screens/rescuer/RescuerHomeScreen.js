import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import api from '../../services/api';

export default function RescuerHomeScreen({ navigation }) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.getAllCases({ status: 'assigned' });
      const reportedRes = await api.getAllCases({ status: 'reported' });

      const allOpen = [...(res.cases || []), ...(reportedRes.cases || [])];

      // Deduplicate by _id
      const unique = Array.from(new Map(allOpen.map((c) => [c._id, c])).values());
      setCases(unique);

      // Check for in-progress active case
      const activeRes = await api.getAllCases();
      const inProgress = (activeRes.cases || []).find((c) =>
        ['accepted', 'on_the_way', 'reached_location', 'animal_picked_up', 'at_shelter', 'treatment_started'].includes(
          c.status
        )
      );
      setActiveCase(inProgress || null);
    } catch (err) {
      console.warn('Error loading rescue cases:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const handleAccept = async (caseItem) => {
    try {
      Alert.alert(
        'Accept Rescue',
        `Accept rescue for ${caseItem.animalType.toUpperCase()}? Live tracking will begin.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            style: 'default',
            onPress: async () => {
              try {
                await api.acceptCase(caseItem._id);
              } catch (e) {
                console.log('Proceeding to active rescue');
              }
              navigation.navigate('ActiveRescue', { caseId: caseItem._id });
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDecline = async (caseItem) => {
    try {
      Alert.alert(
        'Decline Rescue',
        'Decline this case? It will be immediately escalated to the next responder.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: async () => {
              await api.declineCase(caseItem._id, null, 'Rescuer unavailable in area');
              Alert.alert('Case Declined', 'Escalated to next responder.');
              fetchCases();
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
  };

  const getUrgencyBadge = (urgency) => {
    switch ((urgency || '').toUpperCase()) {
      case 'HIGH':
        return { bg: '#FFEBEE', text: '#C62828', label: '🚨 HIGH' };
      case 'LOW':
        return { bg: '#E8F5E9', text: '#2E7D32', label: '🟢 LOW' };
      default:
        return { bg: '#FFF3E0', text: '#EF6C00', label: '⚠️ MEDIUM' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header with Navigation Bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.title}>Rescuer Portal</Text>
          <Text style={styles.subtitle}>Bengaluru Emergency Dispatch</Text>
        </View>

        <TouchableOpacity
          style={[styles.statusToggle, isAvailable ? styles.availableBtn : styles.busyBtn]}
          onPress={toggleAvailability}
        >
          <Text style={[styles.statusToggleText, isAvailable ? styles.availableText : styles.busyText]}>
            {isAvailable ? '● Online' : '○ Busy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Quick Links (Profile & History) */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navChip}
          onPress={() => navigation.navigate('RescuerProfile')}
        >
          <Text style={styles.navChipText}>👤 My Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navChip}
          onPress={() => navigation.navigate('RescuerHistory')}
        >
          <Text style={styles.navChipText}>📜 Case History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navChip}
          onPress={() => navigation.navigate('CitizenHome')}
        >
          <Text style={styles.navChipText}>⇄ Citizen View</Text>
        </TouchableOpacity>
      </View>

      {/* Active Rescue Banner */}
      {activeCase && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => navigation.navigate('ActiveRescue', { caseId: activeCase._id })}
        >
          <View style={styles.activeHeader}>
            <Text style={styles.activeTag}>CURRENT ACTIVE RESCUE</Text>
            <Text style={styles.activeStatus}>{activeCase.status.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
          <Text style={styles.activeTitle}>
            {activeCase.animalType.toUpperCase()} — {activeCase.location?.address || 'Bengaluru'}
          </Text>
          <Text style={styles.activeResume}>Tap to resume tracking & update status →</Text>
        </TouchableOpacity>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Incoming Emergency Alerts ({cases.length})</Text>
        <TouchableOpacity onPress={fetchCases}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#2F5D50" style={{ marginTop: 24 }} />
      ) : cases.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🐾</Text>
          <Text style={styles.emptyTitle}>No Pending Emergencies</Text>
          <Text style={styles.emptyText}>
            You are online and ready. When citizens report injured animals nearby, rescue requests will appear here.
          </Text>
        </View>
      ) : (
        cases.map((c) => {
          const badge = getUrgencyBadge(c.urgency);
          return (
            <TouchableOpacity
              key={c._id}
              style={styles.card}
              onPress={() => navigation.navigate('RescueRequest', { caseItem: c })}
              activeOpacity={0.9}
            >
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
                <Text style={styles.viewDetailsText}>View Details →</Text>
              </View>

              <Text style={styles.animalName}>Injured {c.animalType.toUpperCase()}</Text>

              {c.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  "{c.description}"
                </Text>
              ) : null}

              <Text style={styles.location}>
                📍 {c.location?.address || `${c.location?.latitude.toFixed(4)}, ${c.location?.longitude.toFixed(4)}`}
              </Text>

              <Text style={styles.reporterInfo}>
                👤 Reported by: {c.reporterName || 'Anonymous Citizen'}
              </Text>

              {/* Direct Quick Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.declineBtn]}
                  onPress={() => handleDecline(c)}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => handleAccept(c)}
                >
                  <Text style={styles.acceptText}>Accept Rescue</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
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
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2F5D50',
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  statusToggle: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  availableBtn: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  busyBtn: {
    backgroundColor: '#FFEBEE',
    borderColor: '#C62828',
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  availableText: {
    color: '#2E7D32',
  },
  busyText: {
    color: '#C62828',
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  navChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  navChipText: {
    color: '#2F5D50',
    fontSize: 12,
    fontWeight: '600',
  },
  activeBanner: {
    backgroundColor: '#2F5D50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeTag: {
    color: '#C8E6C9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeStatus: {
    backgroundColor: '#FFFFFF',
    color: '#2F5D50',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  activeResume: {
    color: '#E8F5E9',
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  refreshText: {
    fontSize: 14,
    color: '#2F5D50',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#2F5D50',
    fontWeight: '700',
  },
  animalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  location: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 4,
  },
  reporterInfo: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  declineText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: '#2F5D50',
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
