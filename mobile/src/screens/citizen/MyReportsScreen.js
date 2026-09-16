import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { getReports } from '../../services/storage';

export default function MyReportsScreen() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      const savedReports = await getReports();
      setReports(savedReports);
    };

    loadReports();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>My Reports</Text>

      <Text style={styles.subtitle}>
        View the animal rescue reports you have submitted.
      </Text>

      {reports.length === 0 ? (
        <View style={styles.reportCard}>
          <Text style={styles.animalType}>
            No reports yet
          </Text>

          <Text style={styles.details}>
            Your submitted rescue reports will appear here.
          </Text>
        </View>
      ) : (
        reports.map((report) => (
          <View
            key={report.id}
            style={styles.reportCard}
          >
            <View style={styles.headerRow}>
              <Text style={styles.caseId}>
                Case #{report.id.slice(-6)}
              </Text>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {report.status}
                </Text>
              </View>
            </View>

            <Text style={styles.animalType}>
              {report.animalType}
            </Text>

            <Text style={styles.details}>
              {report.description ||
                'No description provided.'}
            </Text>

            <Text style={styles.date}>
              {new Date(
                report.createdAt
              ).toLocaleDateString()}
            </Text>

            <Text style={styles.details}>
              AI Urgency: {report.urgency}
            </Text>
          </View>
        ))
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

  reportCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  caseId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  statusBadge: {
    backgroundColor: '#DCE9E3',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },

  statusText: {
    color: '#2F5D50',
    fontSize: 12,
    fontWeight: '600',
  },

  animalType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F5D50',
    marginBottom: 6,
  },

  details: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 10,
  },

  date: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 8,
  },
});