import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';

export default function RescuerProfileScreen({ navigation }) {
  const [isAvailable, setIsAvailable] = useState(true);

  const ANIMALS_HANDLED = ['Dogs', 'Cats', 'Cows / Cattle', 'Birds', 'Monkeys'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rescuer Profile</Text>
      </View>

      {/* Avatar Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RK</Text>
        </View>

        <Text style={styles.name}>Rahul Kumar</Text>
        <Text style={styles.org}>Compassion Animal Rescue Bengaluru</Text>
        <Text style={styles.phone}>📞 +91 98765 43210</Text>

        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified Responder</Text>
        </View>
      </View>

      {/* Availability Status Card */}
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>Duty Availability</Text>
          <Text style={styles.statusSubtext}>
            {isAvailable ? 'Available to receive nearby emergency dispatches' : 'Busy / Off duty'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ false: '#DDDDDD', true: '#C8E6C9' }}
          thumbColor={isAvailable ? '#2E7D32' : '#888888'}
        />
      </View>

      {/* Performance Stats */}
      <Text style={styles.sectionHeader}>Rescue Performance</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>15</Text>
          <Text style={styles.statLabel}>Completed Rescues</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNum}>92%</Text>
          <Text style={styles.statLabel}>Response Rate</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNum}>~8 min</Text>
          <Text style={styles.statLabel}>Avg Arrival</Text>
        </View>
      </View>

      {/* Species Capability */}
      <Text style={styles.sectionHeader}>Animals Handled</Text>
      <View style={styles.chipContainer}>
        {ANIMALS_HANDLED.map((animal) => (
          <View key={animal} style={styles.chip}>
            <Text style={styles.chipText}>🐾 {animal}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('RescuerHistory')}
        >
          <Text style={styles.historyBtnText}>📜 View Completed Rescue History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => navigation.navigate('CitizenHome')}
        >
          <Text style={styles.switchBtnText}>⇄ Switch to Citizen View</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2F5D50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  org: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    textAlign: 'center',
  },
  phone: {
    fontSize: 13,
    color: '#2F5D50',
    fontWeight: '600',
    marginBottom: 12,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  verifiedText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 3,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#666666',
    maxWidth: 220,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 14,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  chip: {
    backgroundColor: '#DCE9E3',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipText: {
    color: '#2F5D50',
    fontSize: 13,
    fontWeight: '600',
  },
  actionContainer: {
    gap: 12,
  },
  historyBtn: {
    backgroundColor: '#2F5D50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  historyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  switchBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2F5D50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchBtnText: {
    color: '#2F5D50',
    fontSize: 14,
    fontWeight: '600',
  },
});
