import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { getReports } from '../../services/storage';
import { collapseDuplicateReports } from '../../services/dedupe';
import { useSession } from '../../context/SessionContext';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

const PET_DOG = require('../../../assets/pet_dog.jpg');
const PET_DUO = require('../../../assets/pet_duo.jpg');

export default function CitizenHomeScreen({ navigation }) {
  const { user: currentUser, signOut } = useSession();
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Only this person's own reports: a signed-in citizen's from the server, a guest's from this phone
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const res = await api.getMyReports();
        setRecentCases(collapseDuplicateReports(res.cases || []).slice(0, 3));
      } else {
        const saved = (await getReports()).slice(0, 3);
        const latest = await Promise.all(
          saved.map(async (r) => {
            try {
              return (await api.getCaseById(r.id)).case; // live status from the server
            } catch (e) {
              return { _id: r.id, animalType: r.animalType, description: r.description, location: r.location, status: 'reported' };
            }
          })
        );
        setRecentCases(latest);
      }
    } catch (err) {
      console.log('Error loading citizen home:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  // Reload every time this screen comes back into view (e.g. after sending a report)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Shows the real stage of the rescue, not just "in progress"
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#E8F5E9', text: '#2E7D32', label: 'COMPLETED' };
      case 'cancelled':
        return { bg: '#ECEFF1', text: '#546E7A', label: 'CANCELLED' };
      case 'accepted':
        return { bg: '#E3F2FD', text: '#1565C0', label: 'RESCUER ACCEPTED' };
      case 'on_the_way':
        return { bg: '#E3F2FD', text: '#1565C0', label: 'ON THE WAY' };
      case 'reached_location':
        return { bg: '#E3F2FD', text: '#1565C0', label: 'REACHED' };
      case 'animal_picked_up':
        return { bg: '#E3F2FD', text: '#1565C0', label: 'PICKED UP' };
      case 'at_shelter':
        return { bg: '#E3F2FD', text: '#1565C0', label: 'AT SHELTER / VET' };
      case 'treatment_started':
        return { bg: '#E3F2FD', text: '#1565C0', label: 'IN TREATMENT' };
      default:
        return { bg: '#FFF3E0', text: '#EF6C00', label: 'FINDING A RESCUER' };
    }
  };

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          size="lg"
          eyebrow={currentUser ? `Hello, ${currentUser.name}` : 'Hello, Citizen'}
          title={
            <>
              How can we <Accent>help</Accent> today?
            </>
          }
          left={
            <SegmentedNav
              activeKey="home"
              items={[
                { key: 'home', label: 'Home', onPress: () => {} },
                currentUser
                  ? { key: 'signout', label: 'Sign out', onPress: signOut }
                  : { key: 'signin', label: 'Sign In', onPress: () => navigation.navigate('Auth', { role: 'citizen' }) },
              ]}
            />
          }
        />
      }
      scroll
      contentStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
        {/* Main Emergency Call to Action */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyTop}>
            <View style={styles.emergencyCopy}>
              <Text maxFontSizeMultiplier={1.3} style={styles.emergencyTitle}>Report an Injured Animal</Text>

              <Text maxFontSizeMultiplier={1.3} style={styles.emergencyText}>
                Share a photo and GPS location. Our AI triage immediately matches a suitable Bengaluru responder.
              </Text>
            </View>

            <Image source={PET_DOG} style={styles.emergencyPhoto} />
          </View>

          <AppButton
            title="Report Emergency Now"
            variant="accent"
            onPress={() => navigation.navigate('ReportEmergency')}
          />
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.sectionTitle}>Quick Access</Text>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('MyReports')}
            activeOpacity={0.9}
          >
            <Text maxFontSizeMultiplier={1.3} style={styles.quickTitle}>My Reports</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.quickText}>
              View submitted rescue reports & live status.
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.quickLink}>Open →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('EmergencyContacts')}
            activeOpacity={0.9}
          >
            <Text maxFontSizeMultiplier={1.3} style={styles.quickTitle}>Emergency Contacts</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.quickText}>
              BBMP, CUPA, CARE, & Wildlife rescue Helplines.
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.quickLink}>Open →</Text>
          </TouchableOpacity>
        </View>

        {/* Adoption promo */}
        <TouchableOpacity
          style={styles.adoptCard}
          onPress={() => navigation.navigate('Adoption')}
          activeOpacity={0.9}
        >
          <Image source={PET_DUO} style={styles.adoptPhoto} />
          <View style={styles.adoptCopy}>
            <Text maxFontSizeMultiplier={1.3} style={styles.adoptTitle}>Adopt a Pet</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.adoptText}>
              Give a rescued dog, cat or bird a loving home.
            </Text>
            <AppButton
              title="Meet the Animals"
              size="sm"
              style={styles.adoptButton}
              onPress={() => navigation.navigate('Adoption')}
            />
          </View>
        </TouchableOpacity>

        {/* Recent Live Reports Section */}
        <View style={styles.recentHeader}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.sectionTitle, styles.recentTitle]}>Your Recent Reports</Text>
          <AppButton title="Refresh" size="pill" variant="light" onPress={loadData} />
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={colors.forest} style={{ marginVertical: 16 }} />
        ) : recentCases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.emptyTitle}>No reports yet</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.emptyText}>
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
                activeOpacity={0.9}
              >
                <View style={styles.caseTop}>
                  <Text maxFontSizeMultiplier={1.3} style={styles.caseAnimal}>
                    Injured {item.animalType.toUpperCase()}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <Text maxFontSizeMultiplier={1.3} style={styles.caseLocation} numberOfLines={1}>
                  {item.location?.address || 'Bengaluru Location'}
                </Text>

                {item.description ? (
                  <Text maxFontSizeMultiplier={1.3} style={styles.caseDesc} numberOfLines={1}>
                    "{item.description}"
                  </Text>
                ) : null}

                <AppButton
                  title="Live Track Rescue →"
                  size="sm"
                  style={styles.trackBtn}
                  onPress={() => navigation.navigate('CaseTracking', { caseId: item._id })}
                />
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
  emergencyCard: {
    backgroundColor: colors.forest,
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    shadowColor: colors.deep,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  emergencyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  emergencyCopy: {
    flex: 1,
  },
  emergencyPhoto: {
    width: rs(100),
    height: rs(156),
    borderRadius: rs(50),
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: colors.sage,
  },
  emergencyTitle: {
    fontFamily: fonts.display,
    fontSize: rs(29),
    lineHeight: rs(36),
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emergencyText: {
    fontSize: rs(15),
    color: '#D3E2D9',
    lineHeight: rs(22),
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: rs(26),
    color: colors.forestDark,
    marginBottom: 14,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
  },
  quickTitle: {
    fontFamily: fonts.display,
    fontSize: rs(23),
    lineHeight: rs(30),
    color: colors.forest,
    marginBottom: 6,
  },
  quickText: {
    fontSize: rs(14),
    color: colors.muted,
    lineHeight: rs(20),
    marginBottom: 12,
  },
  quickLink: {
    fontSize: rs(15),
    fontWeight: '800',
    color: colors.orange,
    marginTop: 'auto',
  },
  adoptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.orangeSoft,
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: 24,
    padding: 16,
    marginBottom: 28,
  },
  // Arch-shaped window; the photo is a square crop so the dog's whole head and the kitten both fit
  adoptPhoto: {
    width: rs(108),
    height: rs(112),
    borderTopLeftRadius: rs(54),
    borderTopRightRadius: rs(54),
    borderBottomLeftRadius: rs(22),
    borderBottomRightRadius: rs(22),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: colors.sage,
  },
  adoptCopy: {
    flex: 1,
  },
  adoptTitle: {
    fontFamily: fonts.display,
    fontSize: rs(29),
    color: colors.forestDark,
    marginBottom: 6,
  },
  adoptText: {
    fontSize: rs(15),
    lineHeight: rs(22),
    color: colors.muted,
    marginBottom: 14,
  },
  adoptButton: {
    alignSelf: 'flex-start',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  recentTitle: {
    marginBottom: 0,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
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
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  caseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  caseAnimal: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.ink,
    flexShrink: 1,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    fontSize: rs(12),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  caseLocation: {
    fontSize: rs(15),
    color: colors.ink,
    fontWeight: '600',
    marginBottom: 6,
  },
  caseDesc: {
    fontSize: rs(15),
    color: colors.muted,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  trackBtn: {
    alignSelf: 'flex-start',
  },
});
