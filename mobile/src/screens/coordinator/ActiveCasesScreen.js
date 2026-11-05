import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import AppButton from '../../components/AppButton';
import { colors } from '../../theme';
import { rs } from '../../responsive';

const PAGE_LIMIT = 20;
const ACTIVE_STATUSES = 'assigned,accepted,on_the_way,reached_location,animal_picked_up';

export default function ActiveCasesScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await api.getActiveCases({ page: pageNum, limit: PAGE_LIMIT, status: ACTIVE_STATUSES });
      const incoming = res.cases || res.items || [];
      setCases((prev) => (append ? [...prev, ...incoming] : incoming));
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

  const statusColor = (s) => {
    if (s === 'accepted' || s === 'on_the_way') return colors.orange;
    if (s === 'reached_location' || s === 'animal_picked_up') return colors.forest;
    return colors.muted;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CoordinatorCaseDetail', { caseId: item._id })}
      activeOpacity={0.75}
    >
      <View style={styles.cardRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.animalType || 'Animal'} Rescue</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {item.location?.address || 'Location pending'}
          </Text>
          <Text style={styles.statusLabel}>{item.status?.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        eyebrow="Coordinator"
        title="Active Rescues"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        }
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color={colors.forest} style={{ margin: 16 }} /> : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} />
          }
          contentContainerStyle={cases.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              {error ? (
                <>
                  <Text style={styles.emptyTitle}>Error</Text>
                  <Text style={styles.emptyText}>{error}</Text>
                  <AppButton label="Retry" size="sm" variant="primary" onPress={onRefresh} style={{ marginTop: 16 }} />
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>No active rescues</Text>
                  <Text style={styles.emptyText}>There are no ongoing rescues right now.</Text>
                </>
              )}
            </View>
          }
        />
      )}
      {pagination && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            {cases.length} of {pagination.total} active
          </Text>
        </View>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12 },
  empty: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#fff', fontSize: rs(16), fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: rs(15), fontWeight: '700', color: colors.ink },
  cardSub: { fontSize: rs(13), color: colors.muted, marginTop: 2 },
  statusLabel: { fontSize: rs(12), color: colors.soft, marginTop: 3, textTransform: 'capitalize' },
  chevron: { fontSize: 22, color: colors.soft },
  emptyInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: rs(20), fontWeight: '700', color: colors.ink, marginBottom: 8 },
  emptyText: { fontSize: rs(14), color: colors.muted, textAlign: 'center' },
  paginationInfo: { padding: 10, alignItems: 'center', borderTopWidth: 1, borderColor: colors.divider },
  paginationText: { fontSize: rs(12), color: colors.soft },
});

