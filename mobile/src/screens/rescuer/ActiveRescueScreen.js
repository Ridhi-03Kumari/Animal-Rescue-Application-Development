import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { notify } from '../../services/notify';
import { showRescuerActionError } from '../../services/rescuerErrors';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

const STATUS_STEPS = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'On the Way' },
  { key: 'reached_location', label: 'Reached' },
  { key: 'animal_picked_up', label: 'Picked Up' },
  { key: 'at_shelter', label: 'At Shelter / Vet' },
  { key: 'completed', label: 'Completed' },
];

export default function ActiveRescueScreen({ route, navigation }) {
  const { caseId } = route.params || {};
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [treatment, setTreatment] = useState('');

  // `quiet` = a background refresh: no spinner, and notes the rescuer is typing are not overwritten
  const loadCase = useCallback(
    async (quiet = false) => {
      try {
        if (!quiet) setLoading(true);
        const res = await api.getCaseById(caseId);
        setCaseData(res.case);
        if (res.case?.medicalNotes) setMedicalNotes((current) => current || res.case.medicalNotes);
        if (res.case?.treatment) setTreatment((current) => current || res.case.treatment);
      } catch (err) {
        if (!quiet) notify('Error', 'Unable to load case details: ' + err.message);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [caseId]
  );

  // Load when the screen opens, then keep the real status fresh while it is open
  useFocusEffect(
    useCallback(() => {
      if (!caseId) return undefined;
      loadCase(false);
      const timer = setInterval(() => loadCase(true), 6000);
      return () => clearInterval(timer);
    }, [caseId, loadCase])
  );

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const res = await api.updateCaseStatus(caseId, {
        status: newStatus,
        note: `Rescuer updated status to ${newStatus.replace(/_/g, ' ')}`,
        medicalNotes,
        treatment,
      });

      setCaseData(res.case);

      if (newStatus === 'completed') {
        navigation.navigate('AnimalQr', {
          caseId,
          animal: res.animal,
        });
      }
    } catch (err) {
      notify('Update Failed', err.message);
      loadCase(true); // show what the server really has
    } finally {
      setUpdating(false);
    }
  };

  // Taking a case that is still only "assigned" goes through Accept, never through the progress buttons
  const acceptHere = async () => {
    try {
      setUpdating(true);
      await api.acceptCase(caseId);
      await loadCase(true);
    } catch (err) {
      showRescuerActionError(err, navigation, 'accept');
    } finally {
      setUpdating(false);
    }
  };

  const callReporter = () => {
    const phone = caseData?.reporterPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        notify('Call Error', 'Unable to initiate call from this device');
      });
    } else {
      notify('No Phone', 'Reporter did not provide a phone number');
    }
  };

  if (loading) {
    return (
      <ScreenBackground variant="rescuer" style={styles.center}>
        <ActivityIndicator size="large" color={colors.forest} />
        <Text maxFontSizeMultiplier={1.3} style={styles.loadingText}>Loading Rescue Case...</Text>
      </ScreenBackground>
    );
  }

  if (!caseData) {
    return (
      <ScreenBackground variant="rescuer" style={styles.center}>
        <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>Rescue case not found</Text>
        <AppButton title="Go Back" size="md" onPress={() => navigation.goBack()} />
      </ScreenBackground>
    );
  }

  // "Treatment started" is shown as the At Shelter / Vet step
  const shownStatus = caseData.status === 'treatment_started' ? 'at_shelter' : caseData.status;
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === shownStatus);
  const isAccepted = currentIdx >= 0; // false while the case is only reported / assigned (or cancelled)
  const canAccept = ['assigned', 'reported'].includes(caseData.status);
  const isOpen = isAccepted && caseData.status !== 'completed';

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow={`Case #${caseData._id.slice(-6).toUpperCase()}`}
          title={
            <>
              Emergency: Injured <Accent>{caseData.animalType.toUpperCase()}</Accent>
            </>
          }
          left={
            <SegmentedNav
              activeKey="nav"
              items={[{ key: 'nav', label: '← All Alerts', onPress: () => navigation.navigate('RescuerHome') }]}
            />
          }
          right={
            <View style={styles.topStatus}>
              <Text maxFontSizeMultiplier={1.3} style={styles.topStatusText}>
                {caseData.status.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          }
        />
      }
      scroll
      contentStyle={styles.content}
    >
        {/* Animal Photo */}
        {caseData.photoUrl ? (
          <Image source={{ uri: caseData.photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : null}

        {/* Caller & Location Card */}
        <View style={styles.infoCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.sectionHeader}>Caller & Location</Text>

          <View style={styles.row}>
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Reporter</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.value}>{caseData.reporterName || 'Anonymous'}</Text>
          </View>

          {caseData.reporterPhone ? (
            <AppButton
              title={`Call Reporter: ${caseData.reporterPhone}`}
              size="sm"
              variant="accent"
              style={styles.phoneRow}
              onPress={callReporter}
            />
          ) : null}

          <View style={styles.divider} />

          <Text maxFontSizeMultiplier={1.3} style={styles.label}>Location</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.address}>
            {caseData.location?.address ||
              `${caseData.location?.latitude?.toFixed(5)}, ${caseData.location?.longitude?.toFixed(5)}`}
          </Text>

          {caseData.description ? (
            <>
              <View style={styles.divider} />
              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Citizen Report Notes</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.descText}>"{caseData.description}"</Text>
            </>
          ) : null}
        </View>

        {/* Not accepted yet: accept first, then the progress buttons appear */}
        {canAccept && (
          <View style={styles.infoCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.sectionHeader}>Accept this rescue</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.descText}>
              You have not accepted this case yet. Accept it to start the rescue and update its progress.
            </Text>
            <AppButton
              title="Accept Rescue"
              style={styles.phoneRow}
              onPress={acceptHere}
              loading={updating}
            />
          </View>
        )}

        {caseData.status === 'cancelled' && (
          <View style={styles.infoCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.sectionHeader}>This rescue was cancelled</Text>
          </View>
        )}

        {/* Status Progress Stepper */}
        <Text maxFontSizeMultiplier={1.3} style={styles.sectionTitle}>Rescue Progress</Text>
        <View style={styles.stepperContainer}>
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={[styles.stepCircle, isDone && styles.stepCircleDone]}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.stepNumber, isDone && styles.stepNumberDone]}>{idx + 1}</Text>
                </View>

                <View style={styles.stepInfo}>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.stepLabel, isDone && styles.stepLabelDone]}>{step.label}</Text>
                  {isCurrent && <Text maxFontSizeMultiplier={1.3} style={styles.currentBadge}>Current State</Text>}
                </View>

                {isAccepted && idx === currentIdx + 1 && caseData.status !== 'completed' && (
                  <AppButton
                    title={step.key === 'completed' ? 'Complete' : 'Advance →'}
                    size="sm"
                    onPress={() => updateStatus(step.key)}
                    disabled={updating}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Post-Rescue Medical Notes */}
        <View style={styles.medicalCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.sectionHeader}>Medical Notes & Treatment</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.subtext}>Recorded into animal's permanent QR health profile</Text>

          <TextInput maxFontSizeMultiplier={1.3}
            style={styles.input}
            placeholder="Medical observations (e.g. laceration cleaned, bone splinted)..."
            placeholderTextColor={colors.soft}
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            multiline
            numberOfLines={3}
          />

          <TextInput maxFontSizeMultiplier={1.3}
            style={styles.input}
            placeholder="Treatment administered / Vet Clinic Name..."
            placeholderTextColor={colors.soft}
            value={treatment}
            onChangeText={setTreatment}
          />
        </View>

        {/* Direct Complete Button */}
        {isOpen && (
          <AppButton
            title="Complete Rescue & Generate QR Profile"
            variant="success"
            style={styles.bigBtn}
            onPress={() => updateStatus('completed')}
            loading={updating}
          />
        )}

        {caseData.status === 'completed' && (
          <AppButton
            title="View Animal Digital Profile & QR Tag"
            style={styles.bigBtn}
            onPress={() => navigation.navigate('AnimalQr', { caseId })}
          />
        )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 56,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: rs(16),
  },
  errorText: {
    fontSize: rs(17),
    color: '#B3261E',
    marginBottom: 16,
  },
  topStatus: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topStatusText: {
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 18,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 26,
  },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.forest,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: rs(26),
    color: colors.forestDark,
    marginBottom: 14,
  },
  subtext: {
    fontSize: rs(14),
    color: colors.muted,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: rs(14),
    color: colors.soft,
    fontWeight: '600',
  },
  value: {
    fontSize: rs(16),
    fontWeight: '700',
    color: colors.ink,
  },
  phoneRow: {
    marginTop: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  address: {
    fontSize: rs(15),
    color: colors.ink,
    fontWeight: '700',
    marginTop: 4,
  },
  addressDetails: {
    fontSize: rs(15),
    color: colors.muted,
    marginTop: 4,
  },
  descText: {
    fontSize: rs(15),
    color: colors.ink,
    fontStyle: 'italic',
    lineHeight: rs(22),
    marginTop: 6,
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 26,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepCircleDone: {
    backgroundColor: colors.forest,
  },
  stepNumber: {
    fontFamily: fonts.serif,
    fontSize: rs(16),
    fontWeight: '700',
    color: colors.soft,
  },
  stepNumberDone: {
    color: '#FFFFFF',
  },
  stepInfo: {
    flex: 1,
  },
  stepLabel: {
    fontSize: rs(16),
    color: colors.soft,
  },
  stepLabelDone: {
    color: colors.ink,
    fontWeight: '700',
  },
  currentBadge: {
    fontSize: rs(13),
    color: colors.gold,
    fontWeight: '800',
    marginTop: 2,
  },
  medicalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: rs(16),
    marginBottom: 12,
    backgroundColor: colors.cream,
    color: colors.ink,
  },
  bigBtn: {
    marginBottom: 20,
  },
});
