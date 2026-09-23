import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
export default function ReportSubmittedScreen({ navigation, route }) {
    const triage = route?.params?.triage;
    return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.title}>
        Report Submitted
      </Text>

      <Text style={styles.message}>
        Your animal rescue report has been submitted successfully.
      </Text>

      <View style={styles.caseCard}>
        <Text style={styles.caseLabel}>Case Status</Text>

        <Text style={styles.caseStatus}>
          Finding a suitable rescuer
        </Text>

        <Text style={styles.caseInfo}>
          You will receive updates as the rescue progresses.
        </Text>
      <View/> 
        {triage && (
            <View style={styles.triageCard}>
                <Text style={styles.triageTitle}>
                AI Urgency Assessment
                </Text>

                <Text style={styles.urgency}>
                {triage.urgency}
                </Text>

                <Text style={styles.triageGuidance}>
                {triage.guidance}
                </Text>
            </View>
            )}
        <TouchableOpacity
            style={styles.trackButton}
            onPress={() =>
              navigation.navigate('CaseTracking', {
                caseId: route?.params?.caseData?._id,
              })
            }
          >
            <Text style={styles.trackButtonText}>
                View Case Tracking
            </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAF7',
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCE9E3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  check: {
    fontSize: 40,
    color: '#2F5D50',
    fontWeight: '700',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F5D50',
    textAlign: 'center',
    marginBottom: 12,
  },

  message: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },

  caseCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D5DED9',
  },

  caseLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },

  caseStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F5D50',
    marginBottom: 8,
  },

  caseInfo: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 21,
  },
  trackButton: {
  marginTop: 18,
  backgroundColor: '#2F5D50',
  paddingVertical: 13,
  borderRadius: 9,
  alignItems: 'center',
},

trackButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '600',
},
triageCard: {
  width: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 20,
  borderWidth: 1,
  borderColor: '#D5DED9',
  marginTop: 16,
},

triageTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#222222',
  marginBottom: 8,
},

urgency: {
  fontSize: 22,
  fontWeight: '700',
  color: '#2F5D50',
  marginBottom: 8,
},

triageGuidance: {
  fontSize: 14,
  color: '#555555',
  lineHeight: 21,
},
});