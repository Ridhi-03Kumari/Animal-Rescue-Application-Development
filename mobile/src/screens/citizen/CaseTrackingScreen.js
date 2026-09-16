import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

const STEPS = [
  {
    title: 'Report Submitted',
    description: 'Your rescue request has been received.',
    completed: true,
  },
  {
    title: 'Finding a Rescuer',
    description: 'The system is finding a suitable available rescuer.',
    completed: true,
  },
  {
    title: 'Rescuer Accepted',
    description: 'A rescuer has accepted the rescue request.',
    completed: true,
  },
  {
    title: 'On the Way',
    description: 'The rescuer is travelling to the animal location.',
    completed: false,
  },
  {
    title: 'Animal Picked Up',
    description: 'The animal has been safely picked up.',
    completed: false,
  },
  {
    title: 'At Shelter or Vet',
    description: 'The animal has reached the shelter or veterinary facility.',
    completed: false,
  },
];

export default function CaseTrackingScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Case Tracking</Text>

      <Text style={styles.subtitle}>
        Follow the progress of your animal rescue request.
      </Text>

      <View style={styles.caseCard}>
        <View style={styles.caseHeader}>
          <View>
            <Text style={styles.caseLabel}>Case ID</Text>
            <Text style={styles.caseId}>AR001</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              In Progress
            </Text>
          </View>
        </View>

        <Text style={styles.animalText}>
          Animal: Dog
        </Text>

        <Text style={styles.locationText}>
          Rescue location captured
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Rescue Progress
      </Text>

      <View style={styles.timeline}>
        {STEPS.map((step, index) => (
          <View
            key={step.title}
            style={styles.timelineRow}
          >
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.circle,
                  step.completed && styles.completedCircle,
                ]}
              >
                {step.completed && (
                  <Text style={styles.check}>
                    ✓
                  </Text>
                )}
              </View>

              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    step.completed && styles.completedLine,
                  ]}
                />
              )}
            </View>

            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.stepTitle,
                  step.completed && styles.completedTitle,
                ]}
              >
                {step.title}
              </Text>

              <Text style={styles.stepDescription}>
                {step.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.rescuerCard}>
        <Text style={styles.rescuerLabel}>
          Assigned Rescuer
        </Text>

        <Text style={styles.rescuerName}>
          Rescue Volunteer
        </Text>

        <Text style={styles.rescuerInfo}>
          The rescuer's live location will appear here
          once live tracking is active.
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

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 24,
  },

  caseCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
  },

  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  caseLabel: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 3,
  },

  caseId: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
  },

  statusBadge: {
    backgroundColor: '#DCE9E3',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 15,
  },

  statusText: {
    color: '#2F5D50',
    fontSize: 12,
    fontWeight: '600',
  },

  animalText: {
    fontSize: 15,
    color: '#2F5D50',
    fontWeight: '600',
    marginBottom: 6,
  },

  locationText: {
    fontSize: 13,
    color: '#666666',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 18,
  },

  timeline: {
    marginBottom: 24,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 72,
  },

  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },

  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B8C8C1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  completedCircle: {
    backgroundColor: '#2F5D50',
    borderColor: '#2F5D50',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#D5DED9',
    marginVertical: 3,
  },

  completedLine: {
    backgroundColor: '#2F5D50',
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },

  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#777777',
    marginBottom: 4,
  },

  completedTitle: {
    color: '#2F5D50',
  },

  stepDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },

  rescuerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 18,
  },

  rescuerLabel: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 5,
  },

  rescuerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F5D50',
    marginBottom: 8,
  },

  rescuerInfo: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },
});