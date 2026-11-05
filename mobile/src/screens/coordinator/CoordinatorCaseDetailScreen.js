import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { joinCase, leaveCase } from '../../services/socket';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import AppButton from '../../components/AppButton';
import RescueMapView from '../../components/RescueMapView';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

export default function CoordinatorCaseDetailScreen({ route, navigation }) {
  const { caseId } = route.params;
  const [caseData, setCaseData] = useState(null);
  const [responderLocation, setResponderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const socketCleanupRef = useRef(null);

  const fetchCase = useCallback(async () => {
    try {
      const res = await api.getCaseById(caseId);
      setCaseData(res.case || res);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId]);

  useFocusEffect(
    useCallback(() => {
      fetchCase();
      // Join socket room for realtime updates
      joinCase(
        caseId,
        (data) => {
          // Case update
          if (data && data.case) setCaseData(data.case);
          else if (data && data.status) fetchCase();
        },
        (locData) => {
          if (locData && locData.latitude) {
            setResponderLocation({ latitude: locData.latitude, longitude: locData.longitude });
          }
        }
      ).then((cleanup) => {
        socketCleanupRef.current = cleanup;
      });

      return () => {
        if (socketCleanupRef.current) {
          socketCleanupRef.current();
          socketCleanupRef.current = null;
        }
      };
    }, [caseId, fetchCase])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCase();
  }, [fetchCase]);

  const handleAssign = useCallback(() => {
    navigation.navigate('RescuerSelection', { caseId, caseData });
  }, [navigation, caseId, caseData]);

  const urgencyColor = (u) => {
    if (u === 'critical') return colors.red;
    if (u === 'high') return colors.orange;
    return colors.forest;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  };

  const caseLocation = caseData?.location?.coordinates
    ? { latitude: caseData.location.coordinates[1], longitude: caseData.location.coordinates[0] }
    : null;

  const canAssign =
    caseData &&
    ['reported', 'assigned'].includes(caseData.status);

  if (loading) {
    return (
      <ScreenBackground>
        <ScreenHeader eyebrow="Coordinator" title="Case Detail" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScreenHeader
        eyebrow="Coordinator"
        title="Case Detail"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} />}
      >
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton label="Retry" size="sm" variant="primary" onPress={onRefresh} style={{ marginTop: 10 }} />
          </View>
        )}

        {caseData && (
          <>
            {/* Header Card */}
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <StatusBadge label={caseData.status} />
                {caseData.urgencyLevel && (
                  <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor(caseData.urgencyLevel) }]}>
                    <Text style={styles.urgencyBadgeText}>{caseData.urgencyLevel?.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{caseData.animalType || 'Animal'} Emergency</Text>
              <Text style={styles.cardSub}>{caseData.description || 'No description'}</Text>

              <View style={styles.infoRow}>
                <InfoItem label="Reported" value={formatDate(caseData.createdAt)} />
                <InfoItem label="Updated" value={formatDate(caseData.updatedAt)} />
              </View>
              {caseData.location?.address && (
                <InfoItem label="Location" value={caseData.location.address} />
              )}
              {caseData.citizen && (
                <InfoItem
                  label="Reported by"
                  value={caseData.citizen.name || caseData.citizen.phone || 'Citizen'}
                />
              )}
            </View>

            {/* Map */}
            {caseLocation && (
              <View style={styles.mapContainer}>
                <RescueMapView
                  caseLocation={caseLocation}
                  responderLocation={responderLocation}
                />
              </View>
            )}

            {/* Assigned Rescuer */}
            {caseData.assignedRescuer && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Assigned Rescuer</Text>
                <Text style={styles.rescuerName}>
                  {caseData.assignedRescuer.organizationName ||
                    caseData.assignedRescuer.user?.name ||
                    'Rescuer'}
                </Text>
                {caseData.assignedRescuer.user?.phone && (
                  <Text style={styles.rescuerPhone}>{caseData.assignedRescuer.user.phone}</Text>
                )}
              </View>
            )}

            {/* Timeline */}
            {caseData.timeline && caseData.timeline.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                {[...caseData.timeline].reverse().map((entry, i) => (
                  <View key={i} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineStatus}>{entry.status?.replace(/_/g, ' ')}</Text>
                      {entry.note && <Text style={styles.timelineNote}>{entry.note}</Text>}
                      <Text style={styles.timelineTime}>{formatDate(entry.timestamp)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Manual Assign */}
            {canAssign && (
              <View style={styles.assignSection}>
                <AppButton
                  label="Assign Rescuer Manually"
                  size="lg"
                  variant="primary"
                  onPress={handleAssign}
                />
              </View>
            )}

            {!canAssign && caseData && (
              <View style={styles.infoNote}>
                <Text style={styles.infoNoteText}>
                  Case status "{caseData.status}" does not require manual assignment.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function StatusBadge({ label }) {
  return (
    <View style={styles.statusBadge}>
      <Text style={styles.statusBadgeText}>{label?.replace(/_/g, ' ')}</Text>
    </View>
  );
}

function InfoItem({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#fff', fontSize: rs(16), fontWeight: '700' },
  errorBanner: { margin: 16, padding: 14, backgroundColor: colors.orangeSoft, borderRadius: 12, borderWidth: 1, borderColor: colors.orange },
  errorText: { color: colors.ink, fontSize: rs(14) },
  card: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statusBadge: { backgroundColor: colors.sage, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText: { color: colors.forest, fontSize: rs(12), fontWeight: '700', textTransform: 'capitalize' },
  urgencyBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  urgencyBadgeText: { color: '#fff', fontSize: rs(11), fontWeight: '800' },
  cardTitle: { fontSize: rs(20), fontFamily: fonts.display, color: colors.ink, marginBottom: 4 },
  cardSub: { fontSize: rs(14), color: colors.muted, lineHeight: 20 },
  infoRow: { flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' },
  infoItem: { marginTop: 10 },
  infoLabel: { fontSize: rs(11), color: colors.soft, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: rs(14), color: colors.ink, marginTop: 2 },
  mapContainer: { marginHorizontal: 14, marginTop: 14, borderRadius: 14, overflow: 'hidden', height: 220 },
  sectionTitle: { fontSize: rs(14), fontWeight: '700', color: colors.ink, marginBottom: 10 },
  rescuerName: { fontSize: rs(16), fontWeight: '700', color: colors.forest },
  rescuerPhone: { fontSize: rs(14), color: colors.muted, marginTop: 3 },
  timelineItem: { flexDirection: 'row', marginBottom: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest, marginTop: 4, marginRight: 12 },
  timelineBody: { flex: 1 },
  timelineStatus: { fontSize: rs(14), fontWeight: '700', color: colors.ink, textTransform: 'capitalize' },
  timelineNote: { fontSize: rs(13), color: colors.muted, marginTop: 2 },
  timelineTime: { fontSize: rs(12), color: colors.soft, marginTop: 2 },
  assignSection: { marginHorizontal: 14, marginTop: 20 },
  infoNote: { marginHorizontal: 14, marginTop: 12, padding: 12, backgroundColor: colors.sage, borderRadius: 10 },
  infoNoteText: { color: colors.muted, fontSize: rs(13), textAlign: 'center' },
});

