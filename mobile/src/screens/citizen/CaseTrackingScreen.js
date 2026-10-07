import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../../services/api';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

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
        console.log('Could not load latest case:', err.message);
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
      console.log('Could not load case:', err.message);
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
      <ScreenBackground variant="citizen" style={styles.center}>
        <ActivityIndicator size="large" color={colors.forest} />
        <Text maxFontSizeMultiplier={1.3} style={styles.loadingText}>Fetching live rescue status...</Text>
      </ScreenBackground>
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
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow={caseData ? `Case #${caseData._id.slice(-6).toUpperCase()}` : 'Live Status'}
          title={
            <>
              Live Case <Accent>Tracking</Accent>
            </>
          }
          subtitle="Follow the live progress of your rescue report"
          left={
            <SegmentedNav
              activeKey="nav"
              items={[{ key: 'nav', label: '← Home', onPress: () => navigation.navigate('CitizenHome') }]}
            />
          }
          right={
            <SegmentedNav
              activeKey="nav"
              items={[{ key: 'nav', label: 'Refresh', onPress: fetchCaseDetails }]}
            />
          }
        />
      }
      scroll
      contentStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
        {/* Case Header Card */}
        <View style={styles.caseCard}>
          <View style={styles.caseHeader}>
            <View>
              <Text maxFontSizeMultiplier={1.3} style={styles.caseLabel}>Case ID</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.caseId}>#{caseData ? caseData._id.slice(-6).toUpperCase() : 'DEMO'}</Text>
            </View>

            <View style={styles.statusBadge}>
              <Text maxFontSizeMultiplier={1.3} style={styles.statusText}>{currentStatus.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
          </View>

          <Text maxFontSizeMultiplier={1.3} style={styles.animalText}>
            Animal: {caseData?.animalType ? caseData.animalType.toUpperCase() : 'Dog'}
          </Text>

          <Text maxFontSizeMultiplier={1.3} style={styles.locationText}>
            {caseData?.location?.address || 'Indiranagar / Bengaluru Location Captured'}
          </Text>

          {caseData?.urgency && (
            <Text maxFontSizeMultiplier={1.3} style={styles.urgencyTag}>AI Urgency: {caseData.urgency}</Text>
          )}
        </View>

        {/* Progress Timeline */}
        <Text maxFontSizeMultiplier={1.3} style={styles.sectionTitle}>Rescue Progress</Text>
        <View style={styles.timeline}>
          {PROGRESS_STAGES.map((stage, index) => {
            const stageIdx = stageOrder.indexOf(stage.key);
            const isCompleted = currentStageIdx >= stageIdx && currentStageIdx >= 0;

            return (
              <View key={stage.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.circle, isCompleted && styles.completedCircle]}>
                    {isCompleted && <View style={styles.checkMark} />}
                  </View>
                  {index < PROGRESS_STAGES.length - 1 && (
                    <View style={[styles.line, isCompleted && styles.completedLine]} />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.stepTitle, isCompleted && styles.completedTitle]}>
                    {stage.title}
                  </Text>
                  <Text maxFontSizeMultiplier={1.3} style={styles.stepDescription}>{stage.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Assigned Rescuer Card */}
        <View style={styles.rescuerCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.rescuerLabel}>Assigned Rescuer</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.rescuerName}>
            {assignedRescuer?.organizationName ||
              assignedRescuer?.user?.name ||
              'Smart Responder Dispatched'}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.rescuerInfo}>
            {currentStatus === 'cancelled'
              ? 'This rescue was cancelled.'
              : currentStageIdx >= stageOrder.indexOf('accepted')
              ? `Current stage: ${
                  (PROGRESS_STAGES.find((s) => s.key === currentStatus) || {}).title || 'Treatment Started'
                }`
              : 'Matching best rescuer by proximity and animal capability...'}
          </Text>
        </View>

        {/* View QR Profile if completed */}
        {currentStatus === 'completed' && (
          <AppButton
            title="View Animal Digital Profile & QR Tag"
            variant="accent"
            style={styles.qrActionBtn}
            onPress={() =>
              navigation.navigate('AnimalQr', {
                caseId: caseData._id,
              })
            }
          />
        )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: rs(16),
    color: colors.muted,
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  caseLabel: {
    fontSize: rs(13),
    color: colors.soft,
    fontWeight: '600',
  },
  caseId: {
    fontFamily: fonts.display,
    fontSize: rs(29),
    color: colors.ink,
  },
  statusBadge: {
    backgroundColor: colors.forest,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  animalText: {
    fontSize: rs(17),
    color: colors.forest,
    fontWeight: '700',
    marginBottom: 6,
  },
  locationText: {
    fontSize: rs(15),
    color: colors.muted,
    marginBottom: 8,
  },
  urgencyTag: {
    fontSize: rs(14),
    color: '#B3261E',
    fontWeight: '800',
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: rs(26),
    color: colors.forestDark,
    marginBottom: 16,
  },
  timeline: {
    marginBottom: 22,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 70,
  },
  timelineLeft: {
    width: 36,
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.sageDeep,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCircle: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  checkMark: {
    width: 7,
    height: 13,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  completedLine: {
    backgroundColor: colors.forest,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 18,
  },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: rs(17),
    fontWeight: '700',
    color: colors.soft,
    marginBottom: 3,
  },
  completedTitle: {
    color: colors.forest,
  },
  stepDescription: {
    fontSize: rs(14),
    color: colors.muted,
    lineHeight: rs(20),
  },
  rescuerCard: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  rescuerLabel: {
    fontSize: rs(13),
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 6,
  },
  rescuerName: {
    fontFamily: fonts.display,
    fontSize: rs(25),
    color: colors.forest,
    marginBottom: 8,
  },
  rescuerInfo: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
  },
  qrActionBtn: {
    marginBottom: 20,
  },
});
