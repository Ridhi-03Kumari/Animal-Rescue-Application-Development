import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import api from '../../services/api';
import { useSession } from '../../context/SessionContext';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

export default function AnimalQrScreen({ route, navigation }) {
  const { caseId, animal: initialAnimal } = route.params || {};
  const { user } = useSession();
  const isRescuer = user?.role === 'rescuer'; // citizens open this screen too, from their finished case
  const [animal, setAnimal] = useState(initialAnimal || null);
  const [loading, setLoading] = useState(!initialAnimal && !!caseId);
  const [loadError, setLoadError] = useState('');
  const [qrImageError, setQrImageError] = useState('');

  const loadAnimal = () => {
    if (!caseId) return;
    setLoading(true);
    setLoadError('');
    api
      .getAnimalByCaseId(caseId)
      .then((res) => setAnimal(res.animal))
      .catch((err) => {
        console.log('Could not load animal:', err.message);
        // 400 / 404 = this case has no animal record (it is not completed yet, or it is only a sample)
        setLoadError(
          err.status === 400 || err.status === 404
            ? 'There is no animal record for this case yet.'
            : err.message
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!initialAnimal) loadAnimal();
  }, [caseId, initialAnimal]);

  const shareRecord = async () => {
    if (!animal) return;
    try {
      await Share.share({
        message: `Animal Rescue Record: ${animal.animalType.toUpperCase()}\nStatus: ${animal.status}\nRescue Date: ${new Date(
          animal.rescueDate
        ).toLocaleDateString()}\nMedical Notes: ${animal.medicalNotes || 'Healthy'}\nRecord URL: ${animal.qrCodeUrl}`,
      });
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  if (loading) {
    return (
      <ScreenBackground variant="rescuer" style={styles.center}>
        <ActivityIndicator size="large" color={colors.forest} />
        <Text maxFontSizeMultiplier={1.3} style={styles.loadingText}>Generating Digital Animal Profile...</Text>
      </ScreenBackground>
    );
  }

  if (!animal) {
    return (
      <ScreenBackground variant="rescuer" style={styles.center}>
        <Text maxFontSizeMultiplier={1.3} style={styles.title}>QR not available</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.subtext}>
          {loadError || 'There is no animal record for this case yet.'}
          {'\n'}A collar QR is created when the rescuer marks a case as Completed.
        </Text>
        {caseId ? <AppButton title="Try again" onPress={loadAnimal} style={styles.shareBtn} /> : null}
        <AppButton title="Back" variant="light" onPress={() => navigation.goBack()} />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="QR Health Profile"
          title={
            <>
              Animal Digital Health <Accent>Record</Accent>
            </>
          }
          subtitle="Permanent QR-linked rescue & medical profile"
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
        {/* QR Code Collar Tag Card */}
        <View style={styles.qrCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.qrBadge}>SCAN COLLAR / TAG</Text>

          {animal.qrCodeData && !qrImageError ? (
            <Image
              source={{ uri: animal.qrCodeData }}
              style={styles.qrImage}
              resizeMode="contain"
              onError={(e) => setQrImageError((e && e.nativeEvent && e.nativeEvent.error) || 'unknown error')}
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text maxFontSizeMultiplier={1.3} style={styles.qrPlaceholderText}>
                {qrImageError ? 'QR image could not be shown' : 'QR image not available'}
              </Text>
              {qrImageError ? (
                <Text maxFontSizeMultiplier={1.3} style={styles.qrErrorDetail}>{String(qrImageError).slice(0, 80)}</Text>
              ) : null}
            </View>
          )}

          <Text maxFontSizeMultiplier={1.3} style={styles.animalType}>Rescued {animal.animalType.toUpperCase()}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.animalId}>ID: {animal._id}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.statusBadge}>Status: {animal.status.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.sectionTitle}>Medical & Rescue History</Text>

          <View style={styles.row}>
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Rescue Date</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.value}>{new Date(animal.rescueDate).toLocaleDateString()}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Found Location</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.value}>
              {animal.foundLocation?.address ||
                `${animal.foundLocation?.latitude?.toFixed(4)}, ${animal.foundLocation?.longitude?.toFixed(4)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text maxFontSizeMultiplier={1.3} style={styles.label}>Medical Notes</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.descText}>
            {animal.medicalNotes || 'No trauma complications observed upon admission.'}
          </Text>

          <View style={styles.divider} />

          <Text maxFontSizeMultiplier={1.3} style={styles.label}>Treatment & Shelter</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.descText}>
            {animal.treatment || 'Sheltered for observation & veterinary recovery.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <AppButton
          title="Share Digital Record"
          variant="accent"
          style={styles.shareBtn}
          onPress={shareRecord}
        />

        <AppButton
          title={isRescuer ? 'Return to Rescuer Dashboard' : 'Back to Home'}
          onPress={() => navigation.navigate(isRescuer ? 'RescuerHome' : 'CitizenHome')}
        />
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
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: rs(16),
    color: colors.muted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: rs(34),
    color: colors.forest,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: rs(16),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: rs(23),
    marginBottom: 22,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.deep,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qrBadge: {
    backgroundColor: colors.forest,
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 18,
    letterSpacing: 1,
    overflow: 'hidden',
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.sage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 16,
  },
  qrPlaceholderText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: rs(15),
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  qrErrorDetail: {
    color: colors.soft,
    fontSize: rs(12),
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 6,
  },
  animalType: {
    fontFamily: fonts.display,
    fontSize: rs(29),
    color: colors.ink,
    marginBottom: 4,
  },
  animalId: {
    fontSize: rs(14),
    color: colors.soft,
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: colors.lime,
    color: colors.deep,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    fontSize: rs(13),
    fontWeight: '800',
    overflow: 'hidden',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.forest,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 6,
  },
  label: {
    fontSize: rs(14),
    color: colors.soft,
    fontWeight: '600',
  },
  value: {
    flexShrink: 1,
    fontSize: rs(15),
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  descText: {
    fontSize: rs(15),
    color: colors.ink,
    lineHeight: rs(22),
    marginTop: 6,
  },
  shareBtn: {
    marginBottom: 12,
  },
});
