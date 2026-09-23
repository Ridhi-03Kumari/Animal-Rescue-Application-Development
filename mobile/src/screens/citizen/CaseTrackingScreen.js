import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import api from '../../services/api';

const PROGRESS_STAGES = [
  { key: 'reported', title: 'Report Submitted', desc: 'Your rescue request has been received.' },
  { key: 'assigned', title: 'Finding a Rescuer', desc: 'The system has matched a suitable nearby responder.' },
  { key: 'accepted', title: 'Rescuer Accepted', desc: 'A rescuer accepted your case and is preparing.' },
  { key: 'on_the_way', title: 'On the Way', desc: 'The rescuer is travelling to the animal location.' },
  { key: 'reached_location', title: 'Reached Location', desc: 'Rescuer has arrived at the animal location.' },
  { key: 'animal_picked_up', title: 'Animal Picked Up', desc: 'The animal has been safely secured.' },
  { key: 'at_shelter', title: 'At Shelter / Vet', desc: 'Reached veterinary care facility.' },
  { key: 'completed', title: 'Case Completed', desc: 'Rescue complete. Digital animal profile created.' },
];

export default function CaseTrackingScreen({ route, navigation }) {
  const { caseId } = route.params || {};
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCaseDetails = async () => {
    if (!caseId) {
      // If opened directly without caseId, fetch latest case
      try {
        const allRes = await api.getAllCases();
        if (allRes.cases && allRes.cases.length > 0) {
          setCaseData(allRes.cases[0]);
        }
      } catch (err) {
        console.warn('Error fetching latest case:', err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }

    try {
      setLoading(true);
      const res = await api.getCaseById(caseId);
      setCaseData(res.case);
    } catch (err) {
      console.warn('Error fetching case:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    // Poll every 6 seconds for live demo updates
    const interval = setInterval(fetchCaseDetails, 6000);
    return () => clearInterval(interval);
  }, [caseId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCaseDetails();
  };

  if (loading && !caseData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F5D50" />
        <Text style={styles.loadingText}>Fetching live rescue status...</Text>
      </View>
    );
  }

  const currentStatus = caseData?.status || 'reported';
  const stageOrder = [
    'reported',
    'assigned',
    'accepted',
    'on_the_way',
    'reached_location',
    'animal_picked_up',
    'at_shelter',
    'treatment_started',
    'completed',
  ];
  const currentStageIdx = stageOrder.indexOf(currentStatus);

  const assignedRescuer = caseData?.assignedRescuer;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.navigate('CitizenHome')}>
          <Text style={styles.backBtn}>← Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={fetchCaseDetails}>
          <Text style={styles.refreshBtn}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Live Case Tracking</Text>
      <Text style={styles.subtitle}>Follow the live progress of your rescue report</Text>

      {/* Case Header Card */}
      <View style={styles.caseCard}>
        <View style={styles.caseHeader}>
          <View>
            <Text style={styles.caseLabel}>Case ID</Text>
            <Text style={styles.caseId}>#{caseData ? caseData._id.slice(-6).toUpperCase() : 'DEMO'}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{currentStatus.replace(/_/g, ' ').toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.animalText}>
          Animal: {caseData?.animalType ? caseData.animalType.toUpperCase() : 'Dog'}
        </Text>

        <Text style={styles.locationText}>
          📍 {caseData?.location?.address || 'Indiranagar / Bengaluru Location Captured'}
        </Text>

        {caseData?.urgency && (
          <Text style={styles.urgencyTag}>AI Urgency: {caseData.urgency}</Text>
        )}
      </View>

      {/* Progress Timeline */}
      <Text style={styles.sectionTitle}>Rescue Progress</Text>
      <View style={styles.timeline}>
        {PROGRESS_STAGES.map((stage, index) => {
          const stageIdx = stageOrder.indexOf(stage.key);
          const isCompleted = currentStageIdx >= stageIdx && currentStageIdx >= 0;

          return (
            <View key={stage.key} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.circle, isCompleted && styles.completedCircle]}>
                  {isCompleted && <Text style={styles.check}>✓</Text>}
                </View>
                {index < PROGRESS_STAGES.length - 1 && (
                  <View style={[styles.line, isCompleted && styles.completedLine]} />
                )}
              </View>

              <View style={styles.timelineContent}>
                <Text style={[styles.stepTitle, isCompleted && styles.completedTitle]}>
                  {stage.title}
                </Text>
                <Text style={styles.stepDescription}>{stage.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Assigned Rescuer Card */}
      <View style={styles.rescuerCard}>
        <Text style={styles.rescuerLabel}>Assigned Rescuer</Text>
        <Text style={styles.rescuerName}>
          {assignedRescuer?.organizationName ||
            assignedRescuer?.user?.name ||
            'Smart Responder Dispatched'}
        </Text>
        <Text style={styles.rescuerInfo}>
          {currentStageIdx >= stageOrder.indexOf('accepted')
            ? 'Rescuer is active. Live tracking updates are active.'
            : 'Matching best rescuer by proximity and animal capability...'}
        </Text>
      </View>

      {/* View QR Profile if completed */}
      {currentStatus === 'completed' && (
        <TouchableOpacity
          style={styles.qrActionBtn}
          onPress={() =>
            navigation.navigate('AnimalQr', {
              caseId: caseData._id,
            })
          }
        >
          <Text style={styles.qrActionBtnText}>🔍 View Animal Digital Profile & QR Tag</Text>
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
    padding: 24,
    paddingTop: 45,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
  },
  refreshBtn: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 20,
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseLabel: {
    fontSize: 12,
    color: '#777777',
  },
  caseId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  statusBadge: {
    backgroundColor: '#DCE9E3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  statusText: {
    color: '#2F5D50',
    fontSize: 11,
    fontWeight: '700',
  },
  animalText: {
    fontSize: 15,
    color: '#2F5D50',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  urgencyTag: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 16,
  },
  timeline: {
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 64,
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
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#D5DED9',
    marginVertical: 2,
  },
  completedLine: {
    backgroundColor: '#2F5D50',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777777',
    marginBottom: 2,
  },
  completedTitle: {
    color: '#2F5D50',
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 17,
  },
  rescuerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rescuerLabel: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 4,
  },
  rescuerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 6,
  },
  rescuerInfo: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  qrActionBtn: {
    backgroundColor: '#2F5D50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});