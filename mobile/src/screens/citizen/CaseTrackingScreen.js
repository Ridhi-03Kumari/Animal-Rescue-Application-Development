import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import api from '../../services/api';
import socketService from '../../services/socket';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import RescueMapView from '../../components/RescueMapView';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';
import {
  sanitizeCoordinate,
  getDistanceKm,
  formatFriendlyDistance,
} from '../../utils/coordinates';

// Simplified, natural, user-friendly timeline stages
const PROGRESS_STAGES = [
  {
    key: 'reported',
    title: 'Report Submitted',
    desc: 'Your rescue request has been successfully submitted.',
  },
  {
    key: 'assigned',
    title: 'Finding a Rescuer',
    desc: 'We are looking for someone nearby to help the animal.',
  },
  {
    key: 'accepted',
    title: 'Rescuer Accepted',
    desc: 'A rescuer has accepted your request and is getting ready.',
  },
  {
    key: 'on_the_way',
    title: 'On the Way',
    desc: 'The rescuer is on the way to help the animal.',
  },
  {
    key: 'reached_location',
    title: 'Reached Location',
    desc: 'The rescuer has arrived at the reported location.',
  },
  {
    key: 'animal_picked_up',
    title: 'Animal Picked Up',
    desc: 'The animal has been safely picked up by the rescuer.',
  },
  {
    key: 'at_shelter',
    title: 'At Shelter / Vet',
    desc: 'The animal has been taken to a shelter or veterinary clinic for care.',
  },
  {
    key: 'completed',
    title: 'Case Completed',
    desc: "The rescue has been completed successfully. The animal's rescue record has been saved.",
  },
];

export default function CaseTrackingScreen({ route, navigation }) {
  const { caseId } = route.params || {};
  const [caseData, setCaseData] = useState(null);
  const [rescuerLocation, setRescuerLocation] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollingTimerRef = useRef(null);

  const fetchCaseDetails = async (quiet = false) => {
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
        if (!quiet) setLoading(false);
        setRefreshing(false);
      }
      return;
    }

    try {
      if (!quiet) setLoading(true);
      const res = await api.getCaseById(caseId);
      setCaseData(res.case);
      if (res.case?.assignedRescuer?.location?.latitude && res.case?.assignedRescuer?.location?.longitude) {
        setRescuerLocation((prev) => prev || res.case.assignedRescuer.location);
      }
    } catch (err) {
      console.log('Could not load case:', err.message);
    } finally {
      if (!quiet) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails(false);

    const activeId = caseId || caseData?._id;
    if (!activeId) return;

    let unsubscribeSocket = null;

    const startFallbackPolling = () => {
      if (!pollingTimerRef.current) {
        pollingTimerRef.current = setInterval(() => fetchCaseDetails(true), 6000);
      }
    };

    const stopFallbackPolling = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };

    // Realtime Case Update Handler
    const handleCaseUpdate = (data) => {
      if (data && String(data.caseId) === String(activeId)) {
        setCaseData((prev) => {
          if (!prev) return data.case || null;
          const newStatus = data.status || prev.status;
          let updatedTimeline = prev.timeline || [];
          if (data.case?.timeline) {
            updatedTimeline = data.case.timeline;
          } else if (data.status && data.status !== prev.status) {
            updatedTimeline = [
              ...updatedTimeline,
              { status: data.status, timestamp: new Date(), note: data.note || '' },
            ];
          }
          return {
            ...prev,
            status: newStatus,
            assignedRescuer: data.case?.assignedRescuer || prev.assignedRescuer,
            timeline: updatedTimeline,
            ...(data.case || {}),
          };
        });
      }
    };

    // Realtime Rescuer Location Handler
    const handleLocationUpdate = (loc) => {
      if (loc && String(loc.caseId) === String(activeId)) {
        setRescuerLocation(loc);
      }
    };

    // Subscribe to Socket.IO case room
    socketService
      .joinCase(activeId, handleCaseUpdate, handleLocationUpdate)
      .then((cleanup) => {
        unsubscribeSocket = cleanup;
      })
      .catch((err) => {
        console.warn('Socket join error:', err.message);
        startFallbackPolling();
      });

    // Monitor connection state for fallback polling
    const unsubConnection = socketService.onConnectionChange((connected) => {
      setIsLiveConnected(connected);
      if (connected) {
        stopFallbackPolling();
      } else {
        startFallbackPolling();
      }
    });

    return () => {
      stopFallbackPolling();
      unsubConnection();
      if (unsubscribeSocket) unsubscribeSocket();
    };
  }, [caseId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCaseDetails(true);
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
  const assignedRescuer = caseData?.assignedRescuer;

  // Map backend status to timeline index
  const getStageIndex = (status) => {
    if (status === 'treatment_started') return 6; // At Shelter / Vet
    const idx = PROGRESS_STAGES.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };
  const currentStageIdx = getStageIndex(currentStatus);

  // Compute live distance for consistency between card, map & timeline
  const validCaseCoord = sanitizeCoordinate(caseData?.location);
  const validResponderCoord = sanitizeCoordinate(rescuerLocation);
  const distanceKm =
    validCaseCoord && validResponderCoord
      ? getDistanceKm(
          validResponderCoord.latitude,
          validResponderCoord.longitude,
          validCaseCoord.latitude,
          validCaseCoord.longitude
        )
      : null;

  const isArrived =
    ['reached_location', 'animal_picked_up', 'at_shelter', 'completed'].includes(currentStatus) ||
    (distanceKm !== null && distanceKm <= 0.03);

  const friendlyDistance = formatFriendlyDistance(distanceKm, isArrived);

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
          {caseData?.location?.address || 'Reported Location, Bengaluru'}
        </Text>

        {caseData?.urgency && (
          <Text maxFontSizeMultiplier={1.3} style={styles.urgencyTag}>AI Urgency: {caseData.urgency}</Text>
        )}
      </View>

      {/* Live Map & Location Tracking View */}
      <RescueMapView
        caseLocation={caseData?.location}
        responderLocation={rescuerLocation}
        isLiveConnected={isLiveConnected}
        caseStatus={currentStatus}
        animalType={caseData?.animalType || 'Animal'}
        rescuerName={
          assignedRescuer?.organizationName ||
          assignedRescuer?.user?.name ||
          'Assigned Responder'
        }
      />

      {/* Progress Timeline */}
      <Text maxFontSizeMultiplier={1.3} style={styles.sectionTitle}>Rescue Progress</Text>
      <View style={styles.timeline}>
        {PROGRESS_STAGES.map((stage, index) => {
          const isPast = currentStageIdx > index;
          const isCurrent = currentStageIdx === index && currentStatus !== 'cancelled';
          const isCompleted = isPast;

          return (
            <View key={stage.key} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.completedCircle,
                    isCurrent && styles.currentCircle,
                  ]}
                >
                  {isCompleted && <View style={styles.checkMark} />}
                  {isCurrent && <View style={styles.currentDot} />}
                </View>
                {index < PROGRESS_STAGES.length - 1 && (
                  <View style={[styles.line, (isCompleted || isCurrent) && styles.completedLine]} />
                )}
              </View>

              <View style={styles.timelineContent}>
                <View style={styles.stepTitleRow}>
                  <Text
                    maxFontSizeMultiplier={1.3}
                    style={[
                      styles.stepTitle,
                      (isCompleted || isCurrent) && styles.completedTitle,
                      isCurrent && styles.activeStepTitle,
                    ]}
                  >
                    {stage.title}
                  </Text>
                  {isCurrent && (
                    <View style={styles.activeStageBadge}>
                      <Text style={styles.activeStageBadgeText}>Current Stage</Text>
                    </View>
                  )}
                </View>
                <Text maxFontSizeMultiplier={1.3} style={styles.stepDescription}>{stage.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Section 5: Assigned Rescuer Card */}
      <View style={styles.rescuerCard}>
        <Text maxFontSizeMultiplier={1.3} style={styles.rescuerLabel}>YOUR RESCUER</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.rescuerName}>
          {assignedRescuer?.organizationName ||
            assignedRescuer?.user?.name ||
            (currentStatus === 'reported' ? 'Finding a Rescuer' : 'Rescuer Assigned')}
        </Text>

        {/* Dynamic Rescuer Status */}
        {currentStatus === 'reported' || !assignedRescuer ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              We are looking for someone nearby to help the animal.
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              As soon as a responder accepts, their details and location will appear here.
            </Text>
          </View>
        ) : currentStatus === 'assigned' ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: Rescuer Assigned
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              Your rescuer has been assigned. Their location will appear when available.
            </Text>
          </View>
        ) : currentStatus === 'accepted' ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: Rescuer Preparing
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              A rescuer has accepted your request and is getting ready.
            </Text>
          </View>
        ) : currentStatus === 'on_the_way' ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: Your rescuer is on the way.
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              The rescuer's current location is being updated live.
            </Text>
            {friendlyDistance ? (
              <View style={styles.rescuerDistanceBadge}>
                <Text style={styles.rescuerDistanceBadgeText}>📍 {friendlyDistance}</Text>
              </View>
            ) : null}
          </View>
        ) : currentStatus === 'reached_location' ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: Your rescuer has arrived!
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              The rescuer is now at the animal's reported location.
            </Text>
          </View>
        ) : currentStatus === 'animal_picked_up' ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: Animal Picked Up
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              The animal has been safely picked up by the rescuer.
            </Text>
          </View>
        ) : currentStatus === 'at_shelter' || currentStatus === 'treatment_started' ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: At Shelter / Veterinary Clinic
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              The animal has been taken to a shelter or veterinary clinic for care.
            </Text>
          </View>
        ) : currentStatus === 'completed' ? (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: Rescue Completed
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusDesc}>
              The rescue has been completed successfully. The animal's rescue record has been saved.
            </Text>
          </View>
        ) : (
          <View style={styles.rescuerStatusBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.rescuerStatusTitle}>
              Status: {currentStatus.replace(/_/g, ' ')}
            </Text>
          </View>
        )}

        {/* Rescuer phone if available */}
        {(assignedRescuer?.phone || assignedRescuer?.user?.phone) && (
          <TouchableOpacity
            style={styles.callRescuerBtn}
            onPress={() => {
              const phone = assignedRescuer?.phone || assignedRescuer?.user?.phone;
              Linking.openURL(`tel:${phone}`).catch((e) => console.log('Could not launch dialer:', e));
            }}
          >
            <Text style={styles.callRescuerBtnText}>
              📞 Call Rescuer: {assignedRescuer?.phone || assignedRescuer?.user?.phone}
            </Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 24,
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
    marginBottom: 24,
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
  currentCircle: {
    borderColor: colors.forest,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.forest,
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
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
    gap: 8,
  },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: rs(17),
    fontWeight: '700',
    color: colors.soft,
  },
  completedTitle: {
    color: colors.forest,
  },
  activeStepTitle: {
    color: colors.forest,
    fontWeight: '800',
  },
  activeStageBadge: {
    backgroundColor: colors.sage,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeStageBadgeText: {
    fontSize: rs(11),
    fontWeight: '700',
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
    fontSize: rs(12),
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 6,
  },
  rescuerName: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.forest,
    marginBottom: 10,
  },
  rescuerStatusBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  rescuerStatusTitle: {
    fontSize: rs(14),
    fontWeight: '700',
    color: colors.forest,
    lineHeight: rs(20),
  },
  rescuerStatusDesc: {
    fontSize: rs(13),
    color: colors.muted,
    marginTop: 4,
    lineHeight: rs(18),
  },
  rescuerDistanceBadge: {
    backgroundColor: colors.forest,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  rescuerDistanceBadgeText: {
    color: '#FFFFFF',
    fontSize: rs(12),
    fontWeight: '700',
  },
  callRescuerBtn: {
    backgroundColor: colors.forest,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  callRescuerBtnText: {
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '700',
  },
  qrActionBtn: {
    marginBottom: 20,
  },
});
