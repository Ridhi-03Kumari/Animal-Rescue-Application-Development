import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import AppButton from '../../components/AppButton';
import mockTriage from '../../services/mockTriage';
import { saveReport } from '../../services/storage';
import api from '../../services/api';

const ANIMAL_TYPES = [
  'Dog',
  'Cat',
  'Cow',
  'Bird',
  'Monkey',
  'Other',
];

export default function ReportEmergencyScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);

  const pickPhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo access to report an injured animal.'
      );
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
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow location access to report the animal location.'
      );
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});

    setLocation({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });
  };

  const [submitting, setSubmitting] = useState(false);

  const submitReport = async () => {
    if (!photo) {
      Alert.alert('Missing photo', 'Please add a photo of the animal.');
      return;
    }

    if (!animalType) {
      Alert.alert('Missing animal type', 'Please select the animal type.');
      return;
    }

    if (!location) {
      Alert.alert(
        'Missing location',
        'Please allow location access and get your current location.'
      );
      return;
    }

    setSubmitting(true);
    let caseResult = null;
    let triageResult = null;

    try {
      // 1. Submit to real backend with Gemini AI Triage & Dispatch
      const response = await api.submitReport({
        animalType,
        description,
        photoUrl: photo,
        latitude: location.latitude,
        longitude: location.longitude,
        reporterName: 'Citizen Reporter',
      });

      caseResult = response.case;
      triageResult = {
        urgency: response.case?.urgency || 'MEDIUM',
        guidance: response.guidance || 'Keep a safe distance while the responder is on the way.',
        animalType,
      };
    } catch (apiErr) {
      console.warn('Backend reporting warning (using local fallback):', apiErr.message);
      // Fallback for offline prototype testing
      triageResult = mockTriage({ animalType, description });
      caseResult = {
        _id: `AR${Date.now()}`,
        animalType,
        description,
        photoUrl: photo,
        location,
        urgency: triageResult.urgency,
        status: 'reported',
      };
    } finally {
      setSubmitting(false);
    }

    // Save locally for offline history
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

    navigation.navigate('ReportSubmitted', {
      caseData: caseResult,
      triage: triageResult,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Report an Animal</Text>

      <Text style={styles.subtitle}>
        Share the details so the right rescuer can be contacted.
      </Text>

      <Text style={styles.label}>Animal Photo</Text>

      <TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <Text style={styles.photoText}>
            Tap to choose a photo
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Animal Type</Text>

      <View style={styles.typeContainer}>
        {ANIMAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              animalType === type && styles.selectedType,
            ]}
            onPress={() => setAnimalType(type)}
          >
            <Text
              style={[
                styles.typeText,
                animalType === type && styles.selectedTypeText,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description (Optional)</Text>

      <TextInput
        style={styles.input}
        placeholder="Describe what you can see..."
        placeholderTextColor="#777777"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Location</Text>

      <TouchableOpacity
        style={[
          styles.locationButton,
          location && styles.locationReady,
        ]}
        onPress={getLocation}
      >
        <Text style={styles.locationText}>
          {location
            ? 'Location captured'
            : 'Get my current location'}
        </Text>
      </TouchableOpacity>

      {location && (
        <Text style={styles.coordinates}>
          Latitude: {location.latitude.toFixed(6)}
          {'\n'}
          Longitude: {location.longitude.toFixed(6)}
        </Text>
      )}

      <View style={styles.submitContainer}>
        <AppButton
          title="Submit Emergency Report"
          onPress={submitReport}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 10,
    marginTop: 8,
  },

  photoBox: {
    height: 190,
    borderWidth: 1,
    borderColor: '#B8C8C1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
    color: '#2F5D50',
    fontSize: 16,
    fontWeight: '600',
  },

  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },

  typeButton: {
    borderWidth: 1,
    borderColor: '#B8C8C1',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  selectedType: {
    backgroundColor: '#2F5D50',
    borderColor: '#2F5D50',
  },

  typeText: {
    color: '#2F5D50',
    fontSize: 14,
  },

  selectedTypeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#B8C8C1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 14,
    fontSize: 15,
    color: '#222222',
    marginBottom: 18,
  },

  locationButton: {
    borderWidth: 1,
    borderColor: '#2F5D50',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  locationReady: {
    backgroundColor: '#DCE9E3',
  },

  locationText: {
    color: '#2F5D50',
    fontSize: 15,
    fontWeight: '600',
  },

  coordinates: {
    marginTop: 10,
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
  },

  submitContainer: {
    marginTop: 28,
  },
});