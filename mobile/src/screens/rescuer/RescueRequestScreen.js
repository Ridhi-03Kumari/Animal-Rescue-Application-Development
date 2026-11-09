import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { showRescuerActionError } from '../../services/rescuerErrors';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

export default function RescueRequestScreen({ route, navigation }) {
  const initialCase = route.params?.caseItem || null;
  const targetCaseId = route.params?.caseId || initialCase?._id;

  const [caseItem, setCaseItem] = useState(initialCase);
  const [loadingCase, setLoadingCase] = useState(!initialCase && Boolean(targetCaseId));
  const [loadError, setLoadError] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!caseItem && targetCaseId) {
      setLoadingCase(true);
      api
        .getCaseById(targetCaseId)
        .then((res) => {
          if (res.case) {
            setCaseItem(res.case);
          } else {
            setLoadError('Case not found');
          }
        })
        .catch((err) => setLoadError(err.message || 'Could not load case details'))
        .finally(() => setLoadingCase(false));
    }
  }, [targetCaseId]);

  if (loadingCase) {
    return (
      <ScreenBackground style={styles.center}>
        <ActivityIndicator size="large" color={colors.forest} />
        <Text maxFontSizeMultiplier={1.3} style={[styles.errorText, { color: colors.slate, marginTop: 16 }]}>
          Loading rescue alert details...
        </Text>
      </ScreenBackground>
    );
  }

  if (!caseItem) {
    return (
      <ScreenBackground style={styles.center}>
        <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>
          {loadError || 'No alert details found'}
        </Text>
        <AppButton title="Return to Dashboard" size="md" onPress={() => navigation.goBack()} />
      </ScreenBackground>
    );
  }

  const getUrgencyBadge = (urgency) => {
    switch ((urgency || '').toUpperCase()) {
      case 'HIGH':
        return { bg: '#FFE3E0', text: '#B3261E', label: 'HIGH EMERGENCY' };
      case 'LOW':
        return { bg: '#DDF3E2', text: '#1F7A3E', label: 'LOW URGENCY' };
      default:
        return { bg: '#FFEBCB', text: '#B25E00', label: 'MEDIUM URGENCY' };
    }
  };

  const badge = getUrgencyBadge(caseItem.urgency);

  const handleAccept = async () => {
    setActing(true);
    try {
      await api.acceptCase(caseItem._id);
      navigation.replace('ActiveRescue', { caseId: caseItem._id });
    } catch (err) {
      // Stay on this screen unless the server really accepted the case
      showRescuerActionError(err, navigation, 'accept');
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    setActing(true);
    try {
      await api.declineCase(caseItem._id, null, 'Rescuer busy/declined');
      navigation.goBack();
    } catch (err) {
      showRescuerActionError(err, navigation, 'decline');
    } finally {
      setActing(false);
    }
  };

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow={`Case #${caseItem._id.slice(-6).toUpperCase()}`}
          title={
            <>
              Emergency: Injured <Accent>{caseItem.animalType.toUpperCase()}</Accent>
            </>
          }
          left={
            <SegmentedNav
              activeKey="nav"
              items={[{ key: 'nav', label: '← Back to Alerts', onPress: () => navigation.goBack() }]}
            />
          }
        >
          <View style={[styles.urgencyBanner, { backgroundColor: badge.bg }]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.urgencyText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </ScreenHeader>
      }
      scroll
      contentStyle={styles.content}
    >
        {/* Photo */}
        {caseItem.photoUrl ? (
          <Image
            source={{ uri: caseItem.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text maxFontSizeMultiplier={1.3} style={styles.photoText}>Photo uploaded by citizen</Text>
          </View>
        )}

        {/* Incident Information Card */}
        <View style={styles.card}>
          <Text maxFontSizeMultiplier={1.3} style={styles.sectionHeader}>Incident Details</Text>

          <View style={styles.row}>
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Animal Species</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.value}>{caseItem.animalType.toUpperCase()}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Reported Location</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.value}>
              {caseItem.location?.address ||
                `${caseItem.location?.latitude?.toFixed(4)}, ${caseItem.location?.longitude?.toFixed(4)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text maxFontSizeMultiplier={1.3} style={styles.label}>Citizen's Observation</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.notes}>
            {caseItem.description ? `"${caseItem.description}"` : 'No additional notes provided.'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Reporter Name</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.value}>{caseItem.reporterName || 'Citizen Reporter'}</Text>
          </View>

          {caseItem.reporterPhone ? (
            <View style={styles.row}>
              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Contact Phone</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.valuePhone}>{caseItem.reporterPhone}</Text>
            </View>
          ) : null}
        </View>

        {/* Smart Matching Score Card */}
        <View style={styles.matchingCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.matchingTitle}>Smart Dispatch Match</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.matchingText}>
            You were selected based on your animal handling capability ({caseItem.animalType}), online status, and proximity.
          </Text>
        </View>

        {/* Accept & Decline Buttons */}
        <View style={styles.buttonContainer}>
          <AppButton
            title="Accept Emergency Rescue"
            onPress={handleAccept}
            loading={acting}
          />

          <AppButton
            title="Decline & Pass to Next Rescuer"
            size="md"
            variant="danger"
            onPress={handleDecline}
            disabled={acting}
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: rs(17),
    color: colors.muted,
    marginBottom: 16,
  },
  urgencyBanner: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  urgencyText: {
    fontSize: rs(13),
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 20,
  },
  photoPlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    backgroundColor: colors.sage,
    borderWidth: 1.5,
    borderColor: colors.sageDeep,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoText: {
    fontSize: rs(15),
    color: colors.muted,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.forest,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginVertical: 4,
  },
  label: {
    fontSize: rs(14),
    color: colors.soft,
    fontWeight: '600',
  },
  value: {
    flexShrink: 1,
    fontSize: rs(16),
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'right',
  },
  valuePhone: {
    fontSize: rs(16),
    fontWeight: '700',
    color: '#1F7A3E',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  notes: {
    fontSize: rs(15),
    color: colors.ink,
    lineHeight: rs(22),
    fontStyle: 'italic',
    marginTop: 6,
  },
  matchingCard: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  matchingTitle: {
    fontFamily: fonts.serif,
    fontSize: rs(17),
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 6,
  },
  matchingText: {
    fontSize: rs(14),
    color: colors.muted,
    lineHeight: rs(21),
  },
  buttonContainer: {
    gap: 12,
  },
});
