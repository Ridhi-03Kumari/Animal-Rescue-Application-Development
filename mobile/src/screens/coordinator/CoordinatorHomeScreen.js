import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { useSession } from '../../context/SessionContext';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';
import socketService from '../../services/socket';

const POLL_MS = 10000;

export default function CoordinatorHomeScreen({ navigation }) {
  const { user, signOut } = useSession();
  const [stats, setStats] = useState(null);
  const [escalated, setEscalated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, escRes] = await Promise.all([
        api.getCoordinatorStats(),
        api.getEscalatedCases({ limit: 5, page: 1 }),
      ]);
      setStats(statsRes.stats || null);
      setEscalated(escRes.cases || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      timerRef.current = setInterval(fetchData, POLL_MS);
      return () => clearInterval(timerRef.current);
    }, [fetchData])
  );

  // Socket.IO: listen for any case event and refresh stats
  useEffect(() => {
    const socket = socketService.getSocket ? socketService.getSocket() : null;
    if (!socket) return;
    const refresh = () => fetchData();
    socket.on('case_assigned', refresh);
    socket.on('case_status_updated', refresh);
    return () => {
      socket.off('case_assigned', refresh);
      socket.off('case_status_updated', refresh);
    };
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const urgencyColor = (urgency) => {
    if (urgency === 'critical') return colors.red;
    if (urgency === 'high') return colors.orange;
    return colors.forest;
  };

  if (loading) {
    return (
      <ScreenBackground>
        <ScreenHeader eyebrow="Emergency Coordinator" title="Dashboard" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScreenHeader
        eyebrow="Emergency Coordinator"
        title="Dashboard"
        right={
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
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
          </View>
        )}

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsGrid}>
            <StatCard label="Total Cases" value={stats.totalCases} color={colors.forest} />
            <StatCard label="Escalated" value={stats.escalatedCases} color={colors.red} />
            <StatCard label="Active Rescues" value={stats.activeRescues} color={colors.orange} />
            <StatCard label="Completed" value={stats.completedRescues} color={colors.lime} textDark />
            <StatCard label="Available Rescuers" value={stats.availableRescuers} color={colors.forest} />
            <StatCard label="Total Rescuers" value={stats.totalRescuers} color={colors.sageDeep} textDark />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <AppButton
              label="Escalated Cases"
              size="md"
              variant="primary"
              onPress={() => navigation.navigate('EscalatedCases')}
              style={styles.actionBtn}
            />
            <AppButton
              label="All Active Cases"
              size="md"
              variant="secondary"
              onPress={() => navigation.navigate('ActiveCases')}
              style={styles.actionBtn}
            />
          </View>
          <AppButton
            label="Rescuer Directory"
            size="md"
            variant="secondary"
            onPress={() => navigation.navigate('CoordinatorRescuers')}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Priority Escalated Cases */}
        {escalated.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Needs Intervention ({escalated.length})</Text>
            {escalated.map((c) => (
              <TouchableOpacity
                key={c._id}
                style={styles.caseCard}
                onPress={() => navigation.navigate('CoordinatorCaseDetail', { caseId: c._id })}
                activeOpacity={0.75}
              >
                <View style={styles.caseRow}>
                  <View style={[styles.urgencyDot, { backgroundColor: urgencyColor(c.urgencyLevel) }]} />
                  <View style={styles.caseInfo}>
                    <Text style={styles.caseAnimal}>{c.animalType || 'Animal'} Emergency</Text>
                    <Text style={styles.caseLocation} numberOfLines={1}>
                      {c.location?.address || 'Location pending'}
                    </Text>
                    <Text style={styles.caseMeta}>Status: {c.status}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
            {escalated.length >= 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('EscalatedCases')}>
                <Text style={styles.viewAll}>View all escalated →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {escalated.length === 0 && !loading && (
          <View style={styles.allClearBanner}>
            <Text style={styles.allClearText}>✓ No cases need manual intervention</Text>
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function StatCard({ label, value, color, textDark }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={[styles.statValue, textDark && { color: colors.ink }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, textDark && { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  logoutText: { color: '#fff', fontSize: rs(13), fontWeight: '700' },
  errorBanner: { margin: 16, padding: 12, backgroundColor: colors.orangeSoft, borderRadius: 10, borderWidth: 1, borderColor: colors.orange },
  errorText: { color: colors.ink, fontSize: rs(14) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: { flex: 1, minWidth: '44%', borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: rs(28), fontFamily: fonts.display, color: '#fff', lineHeight: 34 },
  statLabel: { fontSize: rs(12), color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: rs(16), fontWeight: '700', color: colors.ink, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
  caseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  caseRow: { flexDirection: 'row', alignItems: 'center' },
  urgencyDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  caseInfo: { flex: 1 },
  caseAnimal: { fontSize: rs(15), fontWeight: '700', color: colors.ink },
  caseLocation: { fontSize: rs(13), color: colors.muted, marginTop: 2 },
  caseMeta: { fontSize: rs(12), color: colors.soft, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.soft },
  viewAll: { color: colors.forest, fontSize: rs(14), fontWeight: '700', textAlign: 'center', marginTop: 6 },
  allClearBanner: { margin: 16, padding: 16, backgroundColor: colors.sage, borderRadius: 12, alignItems: 'center' },
  allClearText: { color: colors.forest, fontSize: rs(15), fontWeight: '600' },
});

