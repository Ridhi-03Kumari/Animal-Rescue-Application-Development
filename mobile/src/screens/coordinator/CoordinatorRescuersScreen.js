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

export default function CoordinatorRescuersScreen({ navigation }) {
  const [rescuers, setRescuers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const renderRescuer = ({ item }) => {
    const name = item.organizationName || item.user?.name || 'Unknown Rescuer';
    const phone = item.user?.phone || '';
    const available = item.available;
    const hasActive = Boolean(item.activeCaseId);
    const verified = item.verificationStatus === 'approved';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.avDot, { backgroundColor: available && !hasActive ? colors.lime : available ? colors.orange : colors.red }]} />
          <View style={styles.cardBody}>
            <Text style={styles.name}>{name}</Text>
            {phone ? <Text style={styles.phone}>{phone}</Text> : null}
            <View style={styles.tagRow}>
              <Tag
                label={available ? (hasActive ? 'On Mission' : 'Available') : 'Offline'}
                color={available ? (hasActive ? colors.orange : colors.forest) : colors.red}
              />
              {verified ? (
                <Tag label="Verified" color={colors.forest} />
              ) : (
                <Tag label={item.verificationStatus || 'pending'} color={colors.soft} />
              )}
            </View>
            {item.animalTypes && item.animalTypes.length > 0 && (
              <Text style={styles.animalTypes}>Handles: {item.animalTypes.join(', ')}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenBackground>
      <ScreenHeader
        eyebrow="Coordinator"
        title="Rescuer Directory"
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
                  <Text style={styles.emptyTitle}>No rescuers</Text>
                  <Text style={styles.emptyText}>No rescuers are registered yet.</Text>
                </>
              )}
            </View>
          }
        />
      )}
      {pagination && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            {rescuers.length} of {pagination.total} rescuers
          </Text>
        </View>
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
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12, marginTop: 4 },
  cardBody: { flex: 1 },
  name: { fontSize: rs(15), fontWeight: '700', color: colors.ink },
  phone: { fontSize: rs(13), color: colors.muted, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: rs(11), fontWeight: '600' },
  animalTypes: { fontSize: rs(12), color: colors.soft, marginTop: 6 },
  emptyInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: rs(20), fontWeight: '700', color: colors.ink, marginBottom: 8 },
  emptyText: { fontSize: rs(14), color: colors.muted, textAlign: 'center' },
  paginationInfo: { padding: 10, alignItems: 'center', borderTopWidth: 1, borderColor: colors.divider },
  paginationText: { fontSize: rs(12), color: colors.soft },
});

