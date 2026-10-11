import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { showRescuerActionError } from '../../services/rescuerErrors';
import { notify } from '../../services/notify';
import { useSession } from '../../context/SessionContext';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

export default function RescuerHomeScreen({ navigation }) {
  const { signOut } = useSession();
  const [isAvailable, setIsAvailable] = useState(true);
  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const togglingRef = useRef(false);

  // Everything on this screen comes from the server: this rescuer's alerts, their rescue in progress,
  // and whether they are Online or Busy. So what is shown is always what the server has.
  const fetchCases = useCallback(async () => {
    try {
      const [alerts, active, profile] = await Promise.all([
        api.getNearbyCases(),
        api.getActiveRescue(),
        api.getRescuerProfile(),
      ]);
      setCases(alerts.cases || []);
      setActiveCase(active.activeCase || null);
      if (profile.rescuer && !togglingRef.current) {
        setIsAvailable(Boolean(profile.rescuer.available));
      }
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load when the screen opens or comes back into view, then keep it fresh while it stays open
  useFocusEffect(
    useCallback(() => {
      fetchCases();
      const timer = setInterval(fetchCases, 8000);
      return () => clearInterval(timer);
    }, [fetchCases])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const [actingCaseId, setActingCaseId] = useState(null);

  const handleAccept = async (caseItem) => {
    setActingCaseId(caseItem._id);
    try {
      await api.acceptCase(caseItem._id);
      navigation.navigate('ActiveRescue', { caseId: caseItem._id });
    } catch (err) {
      // Only open the rescue screen when the server really accepted it
      showRescuerActionError(err, navigation, 'accept');
    } finally {
      setActingCaseId(null);
    }
  };

  const handleDecline = async (caseItem) => {
    setActingCaseId(caseItem._id);
    try {
      await api.declineCase(caseItem._id, null, 'Rescuer unavailable in area');
    } catch (err) {
      showRescuerActionError(err, navigation, 'decline');
    } finally {
      setActingCaseId(null);
      fetchCases();
    }
  };

  const toggleAvailability = async () => {
    // Someone out on a rescue is Busy until it ends; the server turns them Online again when they complete it
    if (activeCase) {
      notify('You are on a rescue', 'You stay Busy until you complete or cancel your current rescue.');
      return;
    }

    const next = !isAvailable;
    togglingRef.current = true;
    setIsAvailable(next);
    try {
      const res = await api.updateAvailability(next);
      setIsAvailable(Boolean(res.available));
    } catch (err) {
      setIsAvailable(!next); // the server did not change it, so show the real state
      notify('Could not change duty status', err.message);
    } finally {
      togglingRef.current = false;
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch ((urgency || '').toUpperCase()) {
      case 'HIGH':
        return { bg: '#FFEBEE', text: '#C62828', label: 'HIGH' };
      case 'LOW':
        return { bg: '#E8F5E9', text: '#2E7D32', label: 'LOW' };
      default:
        return { bg: '#FFF3E0', text: '#EF6C00', label: 'MEDIUM' };
    }
  };

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="Bengaluru Emergency Dispatch"
          title={
            <>
              Rescuer <Accent>Portal</Accent>
            </>
          }
          left={
            <SegmentedNav
              activeKey="alerts"
              items={[
                { key: 'alerts', label: 'Alerts', onPress: () => {} },
                { key: 'profile', label: 'Profile', onPress: () => navigation.navigate('RescuerProfile') },
                { key: 'history', label: 'History', onPress: () => navigation.navigate('RescuerHistory') },
                { key: 'signout', label: 'Sign out', onPress: signOut },
              ]}
            />
          }
        >
          {/* Duty status: tap to go online or busy */}
          <View style={styles.dutyRow}>
            <Text maxFontSizeMultiplier={1.3} style={styles.dutyLabel}>Duty status</Text>
            <SegmentedNav
              activeKey={isAvailable ? 'online' : 'busy'}
              items={[
                {
                  key: 'online',
                  label: 'Online',
                  dot: '#7BD88F',
                  onPress: () => {
                    if (!isAvailable) toggleAvailability();
                  },
                },
                {
                  key: 'busy',
                  label: 'Busy',
                  dot: '#F0736A',
                  onPress: () => {
                    if (isAvailable) toggleAvailability();
                  },
                },
              ]}
            />
          </View>
        </ScreenHeader>
      }
      scroll
      contentStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
        {/* Active Rescue Banner */}
        {activeCase && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => navigation.navigate('ActiveRescue', { caseId: activeCase._id })}
            activeOpacity={0.9}
          >
            <View style={styles.activeHeader}>
              <Text maxFontSizeMultiplier={1.3} style={styles.activeTag}>CURRENT ACTIVE RESCUE</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.activeStatus}>{activeCase.status.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            <Text maxFontSizeMultiplier={1.3} style={styles.activeTitle}>
              {activeCase.animalType.toUpperCase()} — {activeCase.location?.address || 'Bengaluru'}
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.activeResume}>Tap to resume tracking & update status →</Text>
          </TouchableOpacity>
        )}

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text maxFontSizeMultiplier={1.3} style={styles.sectionTitle}>Incoming Emergency Alerts ({cases.length})</Text>
          <AppButton title="Refresh" size="pill" variant="light" onPress={fetchCases} />
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.forest} style={{ marginTop: 24 }} />
        ) : loadError ? (
          <View style={styles.emptyCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.emptyTitle}>Could not load alerts</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : cases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.emptyTitle}>No Pending Emergencies</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.emptyText}>
              {isAvailable
                ? 'You are Online and ready. New alerts appear here by themselves.'
                : 'You are Busy, so new alerts may pause. Switch to Online when you are ready.'}
            </Text>
          </View>
        ) : (
          cases.map((c) => {
            const badge = getUrgencyBadge(c.urgency);
            const isActing = actingCaseId === c._id;
            return (
              <TouchableOpacity
                key={c._id}
                style={styles.card}
                onPress={() => navigation.navigate('RescueRequest', { caseItem: c })}
                activeOpacity={0.95}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                  <AppButton
                    title="View Details"
                    size="pill"
                    variant="primary"
                    onPress={() => navigation.navigate('RescueRequest', { caseItem: c })}
                  />
                </View>

                <Text maxFontSizeMultiplier={1.3} style={styles.animalName}>Injured {c.animalType.toUpperCase()}</Text>

                {c.description ? (
                  <Text maxFontSizeMultiplier={1.3} style={styles.description} numberOfLines={2}>
                    "{c.description}"
                  </Text>
                ) : null}

                <Text maxFontSizeMultiplier={1.3} style={styles.location}>
                  {c.location?.address || `${c.location?.latitude?.toFixed(4)}, ${c.location?.longitude?.toFixed(4)}`}
                </Text>

                <Text maxFontSizeMultiplier={1.3} style={styles.reporterInfo}>
                  Reported by {c.reporterName || 'Anonymous Citizen'}
                </Text>

                {/* Direct Quick Actions */}
                <View style={styles.actionRow}>
                  <AppButton
                    title="Decline"
                    size="md"
                    variant="danger"
                    style={[styles.actionBtn, styles.declineBtn]}
                    textStyle={styles.actionText}
                    onPress={() => handleDecline(c)}
                    disabled={isActing}
                  />

                  <AppButton
                    title="Accept Rescue"
                    size="md"
                    variant="primary"
                    style={[styles.actionBtn, styles.acceptBtn]}
                    textStyle={styles.actionText}
                    onPress={() => handleAccept(c)}
                    loading={isActing}
                  />
                </View>
              </TouchableOpacity>
            );
          })
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
  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  dutyLabel: {
    fontSize: rs(14),
    fontWeight: '600',
    color: '#C9D9CF',
  },
  activeBanner: {
    backgroundColor: colors.forest,
    borderRadius: 22,
    padding: 20,
    marginBottom: 26,
    shadowColor: colors.deep,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeTag: {
    color: colors.lime,
    fontSize: rs(13),
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeStatus: {
    backgroundColor: colors.lime,
    color: colors.deep,
    fontSize: rs(12),
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeTitle: {
    fontFamily: fonts.display,
    color: '#FFFFFF',
    fontSize: rs(24),
    lineHeight: rs(32),
    marginBottom: 8,
  },
  activeResume: {
    color: '#D6E6DC',
    fontSize: rs(15),
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: rs(26),
    lineHeight: rs(34),
    color: colors.forestDark,
    flexShrink: 1,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.ink,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: rs(15),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
    shadowColor: colors.deep,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  badgeText: {
    fontSize: rs(13),
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  animalName: {
    fontFamily: fonts.display,
    fontSize: rs(28),
    color: colors.ink,
    marginBottom: 8,
  },
  description: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
    marginBottom: 12,
    fontStyle: 'italic',
  },
  location: {
    fontSize: rs(15),
    color: colors.ink,
    fontWeight: '700',
    marginBottom: 4,
  },
  reporterInfo: {
    fontSize: rs(14),
    color: colors.soft,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 16,
  },
  actionBtn: {
    paddingHorizontal: 8,
  },
  declineBtn: {
    flex: 0.8,
  },
  acceptBtn: {
    flex: 1.2,
  },
  actionText: {
    fontSize: rs(17),
    letterSpacing: 0.2,
  },
});
