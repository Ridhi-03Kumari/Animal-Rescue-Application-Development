import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { getCurrentCoordinates, reverseGeocode } from '../../services/location';
import { saveReport } from '../../services/storage';
import { notify } from '../../services/notify';
import { useSession } from '../../context/SessionContext';
import api from '../../services/api';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

// A unique key for one report form (see requestIdRef below)
const newRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;

const ANIMAL_TYPES = [
  'Dog',
  'Cat',
  'Cow',
  'Bird',
  'Monkey',
  'Other',
];

export default function ReportEmergencyScreen({ navigation }) {
  const { user } = useSession();
  const [photo, setPhoto] = useState(null);
  const [photoAsset, setPhotoAsset] = useState(null);
  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const takePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Camera access is needed to take a photo. You can allow it in your phone settings.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhoto(asset.uri);
        setPhotoAsset(asset);
      }
    } catch (err) {
      console.log('Camera error:', err.message);
      Alert.alert(
        'Camera Error',
        'Could not open camera. Please try choosing from your gallery instead.'
      );
    }
  };

  const choosePhotoFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo Access Needed',
          'Photo access is needed to choose an image from your gallery. You can allow it in your phone settings.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhoto(asset.uri);
        setPhotoAsset(asset);
      }
    } catch (err) {
      console.log('Gallery error:', err.message);
      Alert.alert(
        'Gallery Error',
        'Could not open photo gallery. Please try again or take a photo with your camera.'
      );
    }
  };

  const pickPhoto = choosePhotoFromGallery;

  const getLocation = async () => {
    setLocationError('');
    setLocating(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError(
          'Location access is turned off. Allow it in your phone or browser settings so responders can find the animal.'
        );
        return;
      }

      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setLocationError('Your phone\'s location (GPS) is switched off. Turn it on and try again.');
        return;
      }

      const coords = await getCurrentCoordinates();
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setLocation({ ...coords, address });
    } catch (e) {
      console.log('Could not get location:', e.message);
      setLocationError('We could not get your location. Check that location is on, then try again.');
    } finally {
      setLocating(false);
    }
  };

  // Only used when the person chooses it after location fails (e.g. testing on a desktop browser)
  const useCentralBengaluru = () => {
    setLocationError('');
    setLocation({ latitude: 12.9716, longitude: 77.5946, address: 'Central Bengaluru (approximate)' });
  };

  const [submitting, setSubmitting] = useState(false);

  // One key per report form. It travels with the report, so if the same form is sent twice (a double tap,
  // or a retry after a slow connection) the server returns the first case instead of creating another.
  const requestIdRef = useRef(newRequestId());
  // A ref reacts instantly, unlike state, so a second tap in the same moment is ignored too
  const sendingRef = useRef(false);

  const proceedWithReportSubmission = async (photoUrlToSend) => {
    sendingRef.current = true;
    setSubmitting(true);

    try {
      const response = await api.submitReport({
        animalType,
        description,
        photoUrl: photoUrlToSend || null,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        reporterName: user?.name || 'Citizen Reporter',
        reporterPhone: user?.phone || '',
        clientRequestId: requestIdRef.current,
      });

      const caseResult = response.case;
      const triageResult = {
        urgency: caseResult?.urgency || 'MEDIUM',
        guidance: response.guidance || 'Keep a safe distance while the responder is on the way.',
        animalType,
      };

      // Keep a copy on this phone (this is how a guest finds their reports again)
      await saveReport({
        id: caseResult._id,
        animalType,
        description,
        photo: photoUrlToSend || photo,
        location,
        urgency: triageResult.urgency,
        guidance: triageResult.guidance,
        status: 'In Progress',
        createdAt: new Date().toISOString(),
      });

      // Next time this screen is used it is a new report, so it gets a new key
      requestIdRef.current = newRequestId();

      // replace (not navigate) so Back does not return to this filled-in form
      navigation.replace('ReportSubmitted', {
        caseData: caseResult,
        triage: triageResult,
      });
    } catch (apiErr) {
      // Do NOT pretend the report was sent: in an emergency the person must know it did not go through.
      // The key is kept, so tapping Submit again is safe even if the first try actually arrived.
      console.log('Report not sent:', apiErr.message);
      notify('Report not sent', `${apiErr.message}\n\nPlease check your connection and tap Submit again.`);
    } finally {
      sendingRef.current = false;
      setSubmitting(false);
    }
  };

  const submitReport = async () => {
    if (sendingRef.current) return;

    if (!photo) {
      notify('Missing photo', 'Please add a photo of the animal.');
      return;
    }

    if (!animalType) {
      notify('Missing animal type', 'Please select the animal type.');
      return;
    }

    if (!location) {
      notify('Missing location', 'Please allow location access and get your current location.');
      return;
    }

    sendingRef.current = true;
    setSubmitting(true);

    let uploadedPhotoUrl = null;

    // Upload local image to backend/Cloudinary before submitting report
    if (photo && (photo.startsWith('file://') || photo.startsWith('blob:') || photo.startsWith('content://') || photo.startsWith('ph://'))) {
      try {
        uploadedPhotoUrl = await api.uploadPhoto(photoAsset || photo);
      } catch (uploadErr) {
        console.log('Photo upload failed:', uploadErr.message);
        sendingRef.current = false;
        setSubmitting(false);

        const promptTitle = 'Photo Upload Failed';
        const promptMsg = `${uploadErr.message || 'Could not upload the animal photo.'}\n\nWould you like to retry or continue without the photo so responders are alerted immediately?`;

        if (Platform.OS === 'web') {
          const retry = typeof window !== 'undefined'
            ? window.confirm(`${promptTitle}\n\n${promptMsg}\n\nClick OK to retry upload, or Cancel to continue without photo.`)
            : false;
          if (retry) {
            submitReport();
          } else {
            proceedWithReportSubmission(null);
          }
        } else {
          Alert.alert(
            promptTitle,
            promptMsg,
            [
              {
                text: 'Retry Upload',
                onPress: () => submitReport(),
              },
              {
                text: 'Continue Without Photo',
                style: 'destructive',
                onPress: () => proceedWithReportSubmission(null),
              },
            ],
            { cancelable: false }
          );
        }
        return;
      }
    } else {
      // Already an HTTPS URL
      uploadedPhotoUrl = photo;
    }

    await proceedWithReportSubmission(uploadedPhotoUrl);
  };

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="Emergency Report"
          title={
            <>
              Report an <Accent>Animal</Accent>
            </>
          }
          subtitle="Share the details so the right rescuer can be contacted."
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
        <Text maxFontSizeMultiplier={1.3} style={styles.label}>Animal Photo</Text>

        {photo ? (
          /* High-End Photo Preview Card */
          <View style={styles.previewCard}>
            <Image source={{ uri: photo }} style={styles.previewImage} resizeMode="cover" />

            {/* Top Right Status Badge */}
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>✓ Photo Attached</Text>
            </View>

            {/* Bottom Floating Actions Bar */}
            <View style={styles.previewActionsBar}>
              <TouchableOpacity
                style={styles.previewActionBtn}
                onPress={takePhotoWithCamera}
                activeOpacity={0.85}
              >
                <Text style={styles.previewActionIcon}>📷</Text>
                <Text style={styles.previewActionText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.previewActionBtn}
                onPress={choosePhotoFromGallery}
                activeOpacity={0.85}
              >
                <Text style={styles.previewActionIcon}>🖼️</Text>
                <Text style={styles.previewActionText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewActionBtn, styles.removeBtn]}
                onPress={() => {
                  setPhoto(null);
                  setPhotoAsset(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.previewActionIcon}>✕</Text>
                <Text style={[styles.previewActionText, { color: colors.red }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Dual Direct-Action Cards (Interactive, Clean, Zero-Fluff) */
          <View style={styles.photoChoiceGrid}>
            {/* 1. Live Camera Direct Action */}
            <TouchableOpacity
              style={[styles.choiceCard, styles.cameraChoiceCard]}
              onPress={takePhotoWithCamera}
              activeOpacity={0.88}
            >
              <View style={styles.cameraIconCircle}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.cameraChoiceTitle}>
                Take Photo
              </Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.cameraChoiceSubtitle}>
                Open live camera
              </Text>
            </TouchableOpacity>

            {/* 2. Gallery Direct Action */}
            <TouchableOpacity
              style={[styles.choiceCard, styles.galleryChoiceCard]}
              onPress={choosePhotoFromGallery}
              activeOpacity={0.88}
            >
              <View style={styles.galleryIconCircle}>
                <Text style={styles.galleryIconText}>🖼️</Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.galleryChoiceTitle}>
                From Gallery
              </Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.galleryChoiceSubtitle}>
                Choose existing photo
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text maxFontSizeMultiplier={1.3} style={styles.label}>Animal Type</Text>

        <View style={styles.typeContainer}>
          {ANIMAL_TYPES.map((type) => (
            <AppButton
              key={type}
              title={type}
              size="pill"
              variant={animalType === type ? 'primary' : 'light'}
              style={styles.typeButton}
              onPress={() => setAnimalType(type)}
            />
          ))}
        </View>

        <Text maxFontSizeMultiplier={1.3} style={styles.label}>Description (Optional)</Text>

        <TextInput maxFontSizeMultiplier={1.3}
          style={styles.input}
          placeholder="Describe what you can see..."
          placeholderTextColor={colors.soft}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text maxFontSizeMultiplier={1.3} style={styles.label}>Location</Text>

        <AppButton
          title={location ? 'Location captured' : 'Get my current location'}
          size="md"
          variant={location ? 'success' : 'accent'}
          loading={locating}
          onPress={getLocation}
        />

        {location ? (
          <View style={styles.locationCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.locationLabel}>Your current location</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.locationAddress}>
              {location.address ||
                'Location captured. We could not find a street name here, but responders will still receive your exact position.'}
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.locationHint}>
              Not where the animal is? Tap the button above to refresh.
            </Text>
          </View>
        ) : null}

        {locationError ? (
          <View style={styles.locationErrorBox}>
            <Text maxFontSizeMultiplier={1.3} style={styles.locationErrorText}>{locationError}</Text>
            <AppButton
              title="Use central Bengaluru instead"
              size="sm"
              variant="outline"
              style={styles.locationFallbackBtn}
              onPress={useCentralBengaluru}
            />
          </View>
        ) : null}

        <View style={styles.submitContainer}>
          <AppButton
            title={submitting ? 'Sending report...' : 'Submit Emergency Report'}
            onPress={submitReport}
            loading={submitting}
            disabled={submitting}
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

  label: {
    fontFamily: fonts.display,
    fontSize: rs(23),
    color: colors.forestDark,
    marginBottom: 10,
    marginTop: 10,
  },

  // Dual Choice Direct Actions
  photoChoiceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  choiceCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  cameraChoiceCard: {
    backgroundColor: colors.forest,
    borderWidth: 1.5,
    borderColor: colors.forestDark,
  },
  galleryChoiceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cameraIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cameraIconText: {
    fontSize: rs(22),
  },
  galleryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  galleryIconText: {
    fontSize: rs(22),
  },
  cameraChoiceTitle: {
    fontFamily: fonts.display,
    fontSize: rs(18),
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 3,
    textAlign: 'center',
  },
  cameraChoiceSubtitle: {
    fontSize: rs(12),
    color: colors.sage,
    fontWeight: '500',
    textAlign: 'center',
  },
  galleryChoiceTitle: {
    fontFamily: fonts.display,
    fontSize: rs(18),
    color: colors.forestDark,
    letterSpacing: 0.3,
    marginBottom: 3,
    textAlign: 'center',
  },
  galleryChoiceSubtitle: {
    fontSize: rs(12),
    color: colors.muted,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Preview Card
  previewCard: {
    height: 240,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: colors.forest,
    marginBottom: 20,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(14, 75, 67, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: rs(12),
    fontWeight: '700',
  },
  previewActionsBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  previewActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  removeBtn: {
    backgroundColor: 'rgba(255, 245, 245, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 75, 66, 0.3)',
  },
  previewActionIcon: {
    fontSize: rs(13),
    marginRight: 4,
  },
  previewActionText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: colors.ink,
  },

  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },

  typeButton: {
    minWidth: 80,
  },

  input: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    fontSize: rs(16),
    color: colors.ink,
    marginBottom: 18,
  },

  locationCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.sage,
    borderLeftWidth: 4,
    borderLeftColor: colors.forest,
  },

  locationLabel: {
    fontSize: rs(13),
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 6,
  },

  locationAddress: {
    fontSize: rs(17),
    lineHeight: rs(24),
    fontWeight: '700',
    color: colors.forestDark,
  },

  locationHint: {
    fontSize: rs(13),
    lineHeight: rs(18),
    color: colors.muted,
    marginTop: 8,
  },

  locationErrorBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFE3E0',
  },

  locationErrorText: {
    fontSize: rs(14),
    lineHeight: rs(20),
    fontWeight: '600',
    color: '#B3261E',
    marginBottom: 10,
  },

  locationFallbackBtn: {
    alignSelf: 'flex-start',
  },

  submitContainer: {
    marginTop: 28,
  },
});
