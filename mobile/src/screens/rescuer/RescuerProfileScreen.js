import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { notify } from '../../services/notify';
import { useSession } from '../../context/SessionContext';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

const centered = { justifyContent: 'center', alignItems: 'center', padding: 24 };

const ANIMAL_LABELS = {
  dog: 'Dogs',
  cat: 'Cats',
  cattle: 'Cows / Cattle',
  cow: 'Cows / Cattle',
  bird: 'Birds',
  wildlife: 'Wildlife / Reptiles',
  monkey: 'Monkeys',
};

const initialsOf = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export default function RescuerProfileScreen({ navigation }) {
  const { signOut } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  // Everything here is this rescuer's real record from the server
  useFocusEffect(
    useCallback(() => {
      api
        .getRescuerProfile()
        .then((res) => {
          setProfile(res.rescuer);
          setLoadError('');
        })
        .catch((err) => setLoadError(err.message))
        .finally(() => setLoading(false));
    }, [])
  );

  const isAvailable = Boolean(profile && profile.available);
  const onRescue = Boolean(profile && profile.activeCaseId);
  const animalsHandled = (profile && profile.animalsHandled) || [];
  const completed = (profile && profile.completedCasesCount) || 0;
  const responsePercent = profile ? Math.round((profile.responseRate ?? 0) * 100) : 0;
  const avgMinutes = profile && profile.averageResponseTime ? `~${Math.round(profile.averageResponseTime)} min` : '-';

  const changeAvailability = async (next) => {
    if (onRescue) {
      notify('You are on a rescue', 'You stay Busy until you complete or cancel your current rescue.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateAvailability(next);
      setProfile((current) => ({ ...current, available: Boolean(res.available) }));
    } catch (err) {
      notify('Could not change duty status', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground variant="rescuer" style={centered}>
        <ActivityIndicator size="large" color={colors.forest} />
      </ScreenBackground>
    );
  }

  if (!profile) {
    return (
      <ScreenBackground variant="rescuer" style={centered}>
        <Text maxFontSizeMultiplier={1.3} style={styles.name}>Could not load your profile</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.org}>{loadError}</Text>
        <AppButton title="Back" size="md" onPress={() => navigation.goBack()} />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="Personal Information"
          title={
            <>
              Rescuer <Accent>Profile</Accent>
            </>
          }
          subtitle="Your details, availability and rescue record."
          left={
            <SegmentedNav
              activeKey="nav"
              items={[{ key: 'nav', label: '← Back', onPress: () => navigation.goBack() }]}
            />
          }
        />
      }
      scroll
      contentStyle={styles.content}
    >
        {/* Avatar Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text maxFontSizeMultiplier={1.3} style={styles.avatarText}>{initialsOf(profile.user?.name)}</Text>
          </View>

          <Text maxFontSizeMultiplier={1.3} style={styles.name}>{profile.user?.name || 'Rescuer'}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.org}>{profile.organizationName || 'Independent Rescuer'}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.phone}>{profile.user?.phone || ''}</Text>

          <View style={styles.verifiedBadge}>
            <Text maxFontSizeMultiplier={1.3} style={styles.verifiedText}>
              {profile.isVerified ? 'Verified Responder' : 'Verification pending'}
            </Text>
          </View>
        </View>

        {/* Availability Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCopy}>
            <Text maxFontSizeMultiplier={1.3} style={styles.statusTitle}>Duty Availability</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.statusSubtext}>
              {onRescue
                ? 'Busy: you are on a rescue right now'
                : isAvailable
                ? 'Available to receive nearby emergency dispatches'
                : 'Busy / Off duty'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            disabled={saving || onRescue}
            onValueChange={changeAvailability}
            trackColor={{ false: '#CFC8BD', true: colors.sageDeep }}
            thumbColor={isAvailable ? colors.forest : colors.soft}
          />
        </View>

        {/* Performance Stats */}
        <Text maxFontSizeMultiplier={1.3} style={styles.sectionHeader}>Rescue Performance</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text maxFontSizeMultiplier={1.3} style={styles.statNum}>{completed}</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.statLabel}>Completed Rescues</Text>
          </View>

          <View style={styles.statBox}>
            <Text maxFontSizeMultiplier={1.3} style={styles.statNum}>{responsePercent}%</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.statLabel}>Response Rate</Text>
          </View>

          <View style={styles.statBox}>
            <Text maxFontSizeMultiplier={1.3} style={styles.statNum}>{avgMinutes}</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.statLabel}>Avg Arrival</Text>
          </View>
        </View>

        {/* Species Capability */}
        <Text maxFontSizeMultiplier={1.3} style={styles.sectionHeader}>Animals Handled</Text>
        <View style={styles.chipContainer}>
          {animalsHandled.map((animal) => (
            <View key={animal} style={styles.chip}>
              <Text maxFontSizeMultiplier={1.3} style={styles.chipText}>{ANIMAL_LABELS[animal] || animal}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <AppButton
            title="View Completed Rescue History"
            onPress={() => navigation.navigate('RescuerHistory')}
          />

          <AppButton
            title="Sign out"
            variant="accent"
            onPress={signOut}
          />
        </View>
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 26,
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: colors.orangeSoft,
    backgroundColor: colors.forest,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: fonts.display,
    color: '#FFFFFF',
    fontSize: rs(38),
  },
  name: {
    fontFamily: fonts.display,
    fontSize: rs(31),
    color: colors.ink,
    marginBottom: 4,
  },
  org: {
    fontSize: rs(16),
    lineHeight: rs(23),
    color: colors.muted,
    marginBottom: 8,
    textAlign: 'center',
  },
  phone: {
    fontSize: rs(17),
    color: colors.forest,
    fontWeight: '700',
    marginBottom: 14,
  },
  verifiedBadge: {
    backgroundColor: colors.forest,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: rs(14),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 26,
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: fonts.display,
    fontSize: rs(23),
    color: colors.ink,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: rs(14),
    lineHeight: rs(20),
    color: colors.muted,
  },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: rs(26),
    color: colors.forestDark,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 26,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statNum: {
    fontFamily: fonts.display,
    fontSize: rs(29),
    color: colors.forest,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: rs(13),
    lineHeight: rs(18),
    color: colors.muted,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  chip: {
    backgroundColor: colors.orangeSoft,
    borderWidth: 1.5,
    borderColor: colors.orange,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  chipText: {
    color: colors.deep,
    fontSize: rs(15),
    fontWeight: '700',
  },
  actionContainer: {
    gap: 12,
  },
});
