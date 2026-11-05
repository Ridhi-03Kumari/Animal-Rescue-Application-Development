import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import AppButton from '../../components/AppButton';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

const PAGE_LIMIT = 20;

export default function RescuerSelectionScreen({ route, navigation }) {
  const { caseId, caseData } = route.params;
  const [rescuers, setRescuers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await api.getRescuersList({ page: pageNum, limit: PAGE_LIMIT });
      const incoming = res.rescuers || res.items || [];
      setRescuers((prev) => (append ? [...prev, ...incoming] : incoming));
      setPagination(res.pagination || null);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setLoading(true);
      fetchPage(1, false);
    }, [fetchPage])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchPage(1, false);
  }, [fetchPage]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || !pagination?.hasNextPage) return;
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchPage(next, true);
  }, [loadingMore, pagination, page, fetchPage]);

  const handleSelect = useCallback(
    (rescuer) => {
      const name =
        rescuer.organizationName || rescuer.user?.name || 'this rescuer';
      Alert.alert(
        'Confirm Assignment',
        `Assign ${name} to this case?\n\nThis will notify them immediately.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Assign',
            style: 'default',
            onPress: async () => {
              if (assigning) return;
              setAssigning(true);
              try {
                await api.manualAssignRescuer(caseId, rescuer._id);
                Alert.alert('Assigned', `${name} has been notified.`, [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              } catch (err) {
                Alert.alert('Assignment Failed', err.message);
              } finally {
                setAssigning(false);
              }
            },
          },
        ]
      );
    },
    [assigning, caseId, navigation]
  );

  const renderRescuer = ({ item }) => {
    const name = item.organizationName || item.user?.name || 'Unknown Rescuer';
    const phone = item.user?.phone || '';
    const available = item.available;
    const hasActive = Boolean(item.activeCaseId);

    return (
      <TouchableOpacity
        style={[styles.card, !available && styles.cardUnavailable]}
        onPress={() => handleSelect(item)}
        disabled={assigning}
        activeOpacity={0.75}
      >
        <View style={styles.cardRow}>
          <View style={[styles.avDot, { backgroundColor: available && !hasActive ? colors.lime : colors.red }]} />
          <View style={styles.cardBody}>
            <Text style={styles.name}>{name}</Text>
            {phone ? <Text style={styles.phone}>{phone}</Text> : null}
            <View style={styles.tagRow}>
              {available ? (
                <Tag label={hasActive ? 'On Mission' : 'Available'} color={hasActive ? colors.orange : colors.forest} />
              ) : (
                <Tag label="Unavailable" color={colors.red} />
              )}
              {item.verificationStatus === 'approved' && <Tag label="Verified" color={colors.forest} />}
              {item.animalTypes && item.animalTypes.length > 0 && (
                <Tag label={item.animalTypes.slice(0, 2).join(', ')} color={colors.muted} />
              )}
            </View>
          </View>
          <Text style={styles.assignBtn}>Assign →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenBackground>
      <ScreenHeader
        eyebrow="Manual Assignment"
        title="Select Rescuer"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        }
      />

      {assigning && (
        <View style={styles.assigningOverlay}>
          <ActivityIndicator size="large" color={colors.forest} />
          <Text style={styles.assigningText}>Assigning rescuer…</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      ) : (
        <FlatList
          data={rescuers}
          keyExtractor={(item) => item._id}
          renderItem={renderRescuer}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.forest} style={{ margin: 16 }} /> : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} />
          }
          contentContainerStyle={rescuers.length === 0 ? styles.empty : styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Select a rescuer to manually assign to this case.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              {error ? (
                <>
                  <Text style={styles.emptyTitle}>Could not load rescuers</Text>
                  <Text style={styles.emptyText}>{error}</Text>
                  <AppButton label="Retry" size="sm" variant="primary" onPress={onRefresh} style={{ marginTop: 16 }} />
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>No rescuers found</Text>
                  <Text style={styles.emptyText}>There are no registered rescuers yet.</Text>
                </>
              )}
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

function Tag({ label, color }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  empty: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#fff', fontSize: rs(16), fontWeight: '700' },
  listHeader: { padding: 4, paddingBottom: 8 },
  listHeaderText: { fontSize: rs(13), color: colors.muted },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnavailable: { opacity: 0.65 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  cardBody: { flex: 1 },
  name: { fontSize: rs(15), fontWeight: '700', color: colors.ink },
  phone: { fontSize: rs(13), color: colors.muted, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: rs(11), fontWeight: '600' },
  assignBtn: { color: colors.forest, fontWeight: '700', fontSize: rs(14) },
  assigningOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  assigningText: { marginTop: 10, fontSize: rs(15), color: colors.forest, fontWeight: '600' },
  emptyInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: rs(20), fontWeight: '700', color: colors.ink, marginBottom: 8 },
  emptyText: { fontSize: rs(14), color: colors.muted, textAlign: 'center' },
});

