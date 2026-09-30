import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const HERO_BG = require('../../../assets/rescue_hero_bg.jpg');

export default function CitizenHomeScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Check stored user profile
      const stored = await AsyncStorage.getItem('user_profile');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }

      // Fetch recent reports
      const res = await api.getAllCases();
      if (res.cases) {
        setRecentCases(res.cases.slice(0, 3));
      }
    } catch (err) {
      console.log('Error loading citizen home:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#E8F5E9', text: '#2E7D32', label: 'COMPLETED' };
      case 'accepted':
      case 'on_the_way':
      case 'reached_location':
        return { bg: '#E3F2FD', text: '#1565C0', label: 'IN PROGRESS' };
      default:
        return { bg: '#FFF3E0', text: '#EF6C00', label: 'PENDING DISPATCH' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Universal Navigation Bar */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.portalSwitchChip}
          onPress={() => navigation.navigate('RescuerHome')}
        >
          <Text style={styles.portalSwitchText}>⇄ Switch to Rescuer Portal</Text>
        </TouchableOpacity>

        <View style={styles.topNavRight}>
          <TouchableOpacity
            style={styles.iconChip}
            onPress={() => navigation.navigate('Auth', { role: 'citizen' })}
          >
            <Text style={styles.iconChipText}>
              {currentUser ? `👤 ${currentUser.name.split(' ')[0]}` : '🔐 Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconChip}
            onPress={() => navigation.navigate('Welcome')}
          >
            <Text style={styles.iconChipText}>⌂ Roles</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.greeting}>
        {currentUser ? `Hello, ${currentUser.name}!` : 'Hello, Citizen!'}
      </Text>

      <Text style={styles.title}>
        How can we help today?
      </Text>

      {/* Main Emergency Call to Action with Animal Image Background */}
      <View style={styles.emergencyCardWrapper}>
        <ImageBackground
          source={HERO_BG}
          style={styles.emergencyCardBg}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View style={styles.emergencyOverlay}>
            <Text style={styles.emergencyTitle}>Report an Injured Animal</Text>

            <Text style={styles.emergencyText}>
              Share a photo and GPS location. Our AI triage immediately matches a suitable Bengaluru responder.
            </Text>

            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => navigation.navigate('ReportEmergency')}
              activeOpacity={0.85}
            >
              <Text style={styles.reportButtonText}>🚨 Report Emergency Now</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      <Text style={styles.sectionTitle}>
        Quick Access
      </Text>

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('MyReports')}
        >
          <Text style={styles.quickEmoji}>📋</Text>
          <Text style={styles.quickTitle}>My Reports</Text>
          <Text style={styles.quickText}>
            View submitted rescue reports & live status.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('EmergencyContacts')}
        >
          <Text style={styles.quickEmoji}>📞</Text>
          <Text style={styles.quickTitle}>Emergency Contacts</Text>
          <Text style={styles.quickText}>
            BBMP, CUPA, CARE, & Wildlife rescue Helplines.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Live Reports Section */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Rescue Reports</Text>
        <TouchableOpacity onPress={loadData}>
          <Text style={styles.refreshLink}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="small" color="#2F5D50" style={{ marginVertical: 16 }} />
      ) : recentCases.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptyText}>
            When you report an injured animal, you can track responder arrival in real-time here.
          </Text>
        </View>
      ) : (
        recentCases.map((item) => {
          const badge = getStatusBadge(item.status);
          return (
            <TouchableOpacity
              key={item._id}
              style={styles.caseCard}
              onPress={() => navigation.navigate('CaseTracking', { caseId: item._id })}
            >
              <View style={styles.caseTop}>
                <Text style={styles.caseAnimal}>
                  Injured {item.animalType.toUpperCase()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              <Text style={styles.caseLocation} numberOfLines={1}>
                📍 {item.location?.address || 'Bengaluru Location'}
              </Text>

              {item.description ? (
                <Text style={styles.caseDesc} numberOfLines={1}>
                  "{item.description}"
                </Text>
              ) : null}

              <Text style={styles.trackLink}>Live Track Rescue →</Text>
            </TouchableOpacity>
          );
        })
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
    padding: 20,
    paddingTop: 36,
    paddingBottom: 40,
    maxWidth: 620,
    width: '100%',
    alignSelf: 'center',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  portalSwitchChip: {
    backgroundColor: '#EAF2EF',
    borderWidth: 1.5,
    borderColor: '#2F5D50',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  portalSwitchText: {
    color: '#2F5D50',
    fontSize: 12,
    fontWeight: '700',
  },
  topNavRight: {
    flexDirection: 'row',
    gap: 6,
  },
  iconChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  iconChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  greeting: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 20,
  },
  emergencyCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 26,
    shadowColor: '#1E4D3E',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emergencyCardBg: {
    width: '100%',
  },
  emergencyOverlay: {
    backgroundColor: 'rgba(15, 45, 35, 0.76)',
    padding: 22,
    borderRadius: 16,
  },
  emergencyTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 13,
    color: '#EAF2EF',
    lineHeight: 20,
    marginBottom: 16,
  },
  reportButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  reportButtonText: {
    color: '#2F5D50',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 16,
  },
  quickEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 4,
  },
  quickText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 17,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F5D50',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 18,
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DED9',
    padding: 14,
    marginBottom: 12,
  },
  caseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  caseAnimal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  caseLocation: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  caseDesc: {
    fontSize: 12,
    color: '#444444',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  trackLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F5D50',
  },
});