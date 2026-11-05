import React, { useState, useCallback, useRef } from 'react';
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

const PAGE_LIMIT = 15;

export default function EscalatedCasesScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await api.getEscalatedCases({ page: pageNum, limit: PAGE_LIMIT });
      const incoming = res.cases || [];
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

  const urgencyColor = (u) => {
    if (u === 'critical') return colors.red;
    if (u === 'high') return colors.orange;
    return colors.forest;
  };

  const renderCase = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CoordinatorCaseDetail', { caseId: item._id })}
      activeOpacity={0.75}
    >
      <View style={styles.cardRow}>
        <View style={[styles.urgencyBar, { backgroundColor: urgencyColor(item.urgencyLevel) }]} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.animalType || 'Animal'} Emergency</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {item.location?.address || 'Location pending'}
          </Text>
          <View style={styles.badgeRow}>
            <Badge label={item.status} color={colors.forest} />
            {item.urgencyLevel && <Badge label={item.urgencyLevel} color={urgencyColor(item.urgencyLevel)} />}
            {item.escalationHistory && item.escalationHistory.length > 0 && (
              <Badge label={`${item.escalationHistory.length} escalation(s)`} color={colors.orange} />
            )}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color={colors.forest} style={{ margin: 16 }} />;
  };

  return (
    <ScreenBackground>
      <ScreenHeader
        eyebrow="Coordinator"
        title="Escalated Cases"
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
          renderItem={renderCase}
          ListFooterComponent={renderFooter}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} />
          }
          contentContainerStyle={cases.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              {error ? (
                <>
                  <Text style={styles.emptyTitle}>Error loading cases</Text>
                  <Text style={styles.emptyText}>{error}</Text>
                  <AppButton label="Retry" size="sm" variant="primary" onPress={onRefresh} style={{ marginTop: 16 }} />
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>✓ No escalated cases</Text>
                  <Text style={styles.emptyText}>All cases are being handled normally.</Text>
                </>
              )}
            </View>
          }
        />
      )}

      {pagination && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Showing {cases.length} of {pagination.total} cases
          </Text>
        </View>
      )}
    </ScreenBackground>
  );
}

function Badge({ label, color }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
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
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'stretch' },
  urgencyBar: { width: 6, minHeight: 70 },
  cardBody: { flex: 1, padding: 14 },
  cardTitle: { fontSize: rs(15), fontWeight: '700', color: colors.ink },
  cardSub: { fontSize: rs(13), color: colors.muted, marginTop: 3 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: rs(11), fontWeight: '600' },
  chevron: { fontSize: 22, color: colors.soft, alignSelf: 'center', paddingRight: 10 },
  emptyInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: rs(20), fontWeight: '700', color: colors.ink, marginBottom: 8 },
  emptyText: { fontSize: rs(14), color: colors.muted, textAlign: 'center' },
  paginationInfo: { padding: 10, alignItems: 'center', borderTopWidth: 1, borderColor: colors.divider },
  paginationText: { fontSize: rs(12), color: colors.soft },
});

