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
  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const pickPhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      notify('Permission needed', 'Please allow photo access to report an injured animal.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

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

    try {
      const response = await api.submitReport({
        animalType,
        description,
        photoUrl: photo,
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
        photo,
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

        <TouchableOpacity style={styles.photoBox} onPress={pickPhoto} activeOpacity={0.9}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <Text maxFontSizeMultiplier={1.3} style={styles.photoText}>
              Tap to choose a photo
            </Text>
          )}
        </TouchableOpacity>

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

  photoBox: {
    height: 200,
    borderWidth: 1.5,
    borderColor: colors.sageDeep,
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: colors.sage,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  photoText: {
    color: colors.forest,
    fontSize: rs(17),
    fontWeight: '700',
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
