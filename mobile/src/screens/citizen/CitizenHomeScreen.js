import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function CitizenHomeScreen({ navigation }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.greeting}>Hello!</Text>

      <Text style={styles.title}>
        How can we help today?
      </Text>

      <TouchableOpacity
        style={styles.emergencyCard}
        onPress={() => navigation.navigate('ReportEmergency')}
      >
        <Text style={styles.emergencyTitle}>
          Report an Injured Animal
        </Text>

        <Text style={styles.emergencyText}>
          Share a photo and location so a suitable rescuer can be contacted.
        </Text>

        <View style={styles.reportButton}>
          <Text style={styles.reportButtonText}>
            Report Emergency
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        Quick Access
      </Text>

      <View style={styles.quickRow}>
        <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('MyReports')}
            >
            <Text style={styles.quickTitle}>My Reports</Text>

            <Text style={styles.quickText}>
                View your submitted rescue reports.
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('EmergencyContacts')}
            >
            <Text style={styles.quickTitle}>
                Emergency Contacts
            </Text>

            <Text style={styles.quickText}>
                Find important animal emergency contacts.
            </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Recent Reports
      </Text>

      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>
          No reports yet
        </Text>

        <Text style={styles.emptyText}>
          Your recent rescue reports will appear here.
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

  greeting: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 24,
  },

  emergencyCard: {
    backgroundColor: '#2F5D50',
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },

  emergencyTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },

  emergencyText: {
    fontSize: 14,
    color: '#EAF2EF',
    lineHeight: 21,
    marginBottom: 18,
  },

  reportButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  reportButtonText: {
    color: '#2F5D50',
    fontSize: 14,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 16,
  },

  quickTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F5D50',
    marginBottom: 8,
  },

  quickText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});