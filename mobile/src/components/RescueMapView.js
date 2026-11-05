import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { colors, fonts } from '../theme';
import { rs } from '../responsive';
import {
  isValidCoordinate,
  sanitizeCoordinate,
  calculateRegion,
  getDistanceKm,
  formatFriendlyDistance,
  formatDistance,
  DEFAULT_BENGALURU_COORDINATES,
} from '../utils/coordinates';

// Dynamically import react-native-maps to support web / environments without native map binaries
let MapView = null;
let Marker = null;
let PROVIDER_GOOGLE = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (e) {
  // Gracefully fallback on environments without react-native-maps binaries
}

// Safely detect Expo Go environment (Expo Go lacks native AndroidManifest Google Maps API key)
let isExpoGo = false;
try {
  const Constants = require('expo-constants').default || require('expo-constants');
  isExpoGo =
    Constants?.appOwnership === 'expo' ||
    Constants?.executionEnvironment === 'storeClient';
} catch (e) {
  isExpoGo = false;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const hasGoogleMapsKey = Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.trim());

/**
 * Interactive Rescue Map View
 * Displays Case Emergency Location and Live Responder Movement with camera controls and fallback resilience.
 */
function RescueMapView({
  caseLocation,
  responderLocation,
  isLiveConnected = true,
  caseStatus = 'reported',
  animalType = 'Animal',
  rescuerName = '',
  isRescuer = false,
  style,
}) {
  const mapRef = useRef(null);
  const userPannedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Sanitized coordinates (internal logic preserved)
  const validCaseCoord = sanitizeCoordinate(caseLocation);
  const validResponderCoord = sanitizeCoordinate(responderLocation);

  // Compute distance between responder and case
  const distanceKm =
    validCaseCoord && validResponderCoord
      ? getDistanceKm(
          validResponderCoord.latitude,
          validResponderCoord.longitude,
          validCaseCoord.latitude,
          validCaseCoord.longitude
        )
      : null;

  // Active tracking statuses
  const isConcluded = ['completed', 'cancelled'].includes(caseStatus);
  const isArrived =
    ['reached_location', 'animal_picked_up', 'at_shelter', 'completed'].includes(caseStatus) ||
    (distanceKm !== null && distanceKm <= 0.03);
  const isTrackingActive =
    !isConcluded && ['accepted', 'on_the_way', 'reached_location', 'animal_picked_up'].includes(caseStatus);

  const friendlyDistance = formatFriendlyDistance(distanceKm, isArrived);

  // Initial target region
  const initialRegion =
    calculateRegion(validCaseCoord, validResponderCoord) || {
      ...DEFAULT_BENGALURU_COORDINATES,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

  /**
   * Smoothly fits the camera to show both the emergency marker and responder marker
   */
  const fitCameraToMarkers = useCallback(
    (animated = true) => {
      if (!mapRef.current) return;

      const coordsToFit = [];
      if (validCaseCoord) coordsToFit.push(validCaseCoord);
      if (validResponderCoord) coordsToFit.push(validResponderCoord);

      if (coordsToFit.length === 2) {
        try {
          mapRef.current.fitToCoordinates(coordsToFit, {
            edgePadding: { top: 70, right: 60, bottom: 70, left: 60 },
            animated,
          });
        } catch (e) {
          const region = calculateRegion(validCaseCoord, validResponderCoord);
          if (region) mapRef.current.animateToRegion(region, animated ? 600 : 0);
        }
      } else if (coordsToFit.length === 1) {
        const single = coordsToFit[0];
        mapRef.current.animateToRegion(
          {
            latitude: single.latitude,
            longitude: single.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          animated ? 600 : 0
        );
      }
    },
    [validCaseCoord, validResponderCoord]
  );

  // Fit camera when map becomes ready
  useEffect(() => {
    if (mapReady) {
      fitCameraToMarkers(false);
    }
  }, [mapReady, fitCameraToMarkers]);

  // Handle incoming responder location updates
  useEffect(() => {
    if (!validResponderCoord || !mapReady) return;

    if (!userPannedRef.current) {
      fitCameraToMarkers(true);
    }
  }, [validResponderCoord?.latitude, validResponderCoord?.longitude, mapReady, fitCameraToMarkers]);

  const handleRecenter = () => {
    userPannedRef.current = false;
    fitCameraToMarkers(true);
  };

  /**
   * Section 8: Clearly separated Google Maps actions
   */
  // Open strictly Animal's Location in external Google Maps
  const openAnimalLocationInMaps = () => {
    if (!validCaseCoord) return;
    const label = encodeURIComponent(`Animal's Reported Location (${animalType})`);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${validCaseCoord.latitude},${validCaseCoord.longitude}`,
      android: `geo:0,0?q=${validCaseCoord.latitude},${validCaseCoord.longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${validCaseCoord.latitude},${validCaseCoord.longitude}`,
    });
    Linking.openURL(url).catch((err) => console.log('Could not open animal map:', err));
  };

  // Open strictly Rescuer's Location in external Google Maps
  const openRescuerLocationInMaps = () => {
    if (!validResponderCoord) return;
    const label = encodeURIComponent(
      isRescuer ? 'My Rescuer Location' : `Rescuer Location: ${rescuerName || 'Responder'}`
    );
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${validResponderCoord.latitude},${validResponderCoord.longitude}`,
      android: `geo:0,0?q=${validResponderCoord.latitude},${validResponderCoord.longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${validResponderCoord.latitude},${validResponderCoord.longitude}`,
    });
    Linking.openURL(url).catch((err) => console.log('Could not open rescuer map:', err));
  };

  // Alias for backward compatibility
  const openExternalMaps = () => {
    if (validCaseCoord) {
      openAnimalLocationInMaps();
    } else if (validResponderCoord) {
      openRescuerLocationInMaps();
    }
  };

  // ---------------------------------------------------------------------------
  // Empty / Unavailable State
  // ---------------------------------------------------------------------------
  if (!validCaseCoord && !validResponderCoord) {
    return (
      <View style={[styles.container, styles.emptyContainer, style]}>
        <Text style={styles.emptyIcon}>📍</Text>
        <Text style={styles.emptyTitle}>Location Unavailable</Text>
        <Text style={styles.emptySubtitle}>
          Geographical coordinates have not yet been captured for this rescue case.
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Web / Error / Native Fallback Card (Resilient Citizen View)
  // ---------------------------------------------------------------------------
  const isNativeMapSupported =
    Platform.OS !== 'web' &&
    MapView !== null &&
    !mapError &&
    hasGoogleMapsKey &&
    !(Platform.OS === 'android' && isExpoGo);

  if (!isNativeMapSupported) {
    const rescuerHumanLocation =
      responderLocation?.address || 'Your rescuer is currently near the reported location.';

    return (
      <View style={[styles.container, styles.fallbackContainer, style]}>
        {/* Header bar: Simple, non-technical status indicator */}
        <View style={styles.fallbackHeader}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConcluded ? colors.ink : isLiveConnected ? '#4CAF50' : '#FF9800' },
              ]}
            />
            <Text style={styles.fallbackStatusText}>
              {isConcluded
                ? 'Rescue Completed'
                : isLiveConnected
                ? 'Live Tracking'
                : 'Updating Location'}
            </Text>
          </View>
          {friendlyDistance ? (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>📍 {friendlyDistance}</Text>
            </View>
          ) : null}
        </View>

        {/* 1. Animal's Reported Location Section */}
        <View style={styles.locationSectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionEmoji}>📍</Text>
            <View style={styles.sectionHeaderTexts}>
              <Text style={styles.sectionTitle}>Animal's Location</Text>
              <Text style={styles.addressText}>
                {caseLocation?.address || 'Reported Location, Bengaluru'}
              </Text>
              <Text style={styles.locationHelpText}>This is where the animal was reported.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={openAnimalLocationInMaps}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnSecondaryText}>
              🗺️ Open Animal's Location in Google Maps
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Rescuer's Current Location Section */}
        {validResponderCoord ? (
          <View style={[styles.locationSectionCard, styles.rescuerSectionCard]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionEmoji}>🚑</Text>
              <View style={styles.sectionHeaderTexts}>
                <Text style={styles.sectionTitle}>
                  {isRescuer ? 'Your Current Location' : "Rescuer's Current Location"}
                </Text>
                <Text style={styles.addressText}>
                  {isArrived
                    ? "The rescuer is now at the animal's reported location."
                    : rescuerHumanLocation}
                </Text>
                <View style={styles.liveTrackingRow}>
                  <Text style={styles.liveTrackingDot}>●</Text>
                  <Text style={styles.liveTrackingText}>
                    The rescuer's location updates automatically every few seconds.
                  </Text>
                </View>
                {friendlyDistance ? (
                  <Text style={styles.friendlyDistanceHighlight}>
                    📍 {friendlyDistance}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={openRescuerLocationInMaps}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnPrimaryText}>
                🧭 Open Rescuer's Location in Google Maps
              </Text>
            </TouchableOpacity>
          </View>
        ) : !isConcluded ? (
          <View style={[styles.locationSectionCard, styles.unassignedSectionCard]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionEmoji}>🔍</Text>
              <View style={styles.sectionHeaderTexts}>
                <Text style={styles.sectionTitle}>
                  {caseStatus === 'assigned' ? 'Rescuer Assigned' : 'Finding a Rescuer'}
                </Text>
                <Text style={styles.waitingMainText}>
                  {caseStatus === 'assigned'
                    ? 'Your rescuer has been assigned. Their location will appear when available.'
                    : 'We are looking for someone nearby to help the animal.'}
                </Text>
                <Text style={styles.waitingSubText}>
                  The rescuer's live location is not available yet.
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Native Interactive Google Maps View
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        onMapReady={() => setMapReady(true)}
        onError={() => setMapError(true)}
        onTouchStart={() => {
          userPannedRef.current = true;
        }}
        onPanDrag={() => {
          userPannedRef.current = true;
        }}
      >
        {/* Fixed Animal Emergency Location Marker */}
        {validCaseCoord && (
          <Marker
            coordinate={validCaseCoord}
            title="🐕 Animal's Reported Location"
            description={caseLocation?.address || 'This is where the animal was reported.'}
            anchor={{ x: 0.5, y: 1.0 }}
          >
            <View style={styles.emergencyPin}>
              <Text style={styles.emergencyPinIcon}>🐾</Text>
              <View style={styles.pinArrow} />
            </View>
          </Marker>
        )}

        {/* Live Responder Marker */}
        {validResponderCoord && (
          <Marker
            coordinate={validResponderCoord}
            title="🚑 Rescuer's Live Location"
            description={
              isArrived
                ? "The rescuer is now at the animal's reported location."
                : (friendlyDistance || 'Rescuer on the way')
            }
            anchor={{ x: 0.5, y: 1.0 }}
          >
            <View style={styles.responderPin}>
              <Text style={styles.responderPinIcon}>🚑</Text>
              <View style={[styles.pinArrow, { borderTopColor: colors.forest }]} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Overlay: Simple Status & Distance Pill */}
      <View style={styles.topOverlay}>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConcluded ? colors.ink : isLiveConnected ? '#4CAF50' : '#FF9800' },
            ]}
          />
          <Text style={styles.statusPillText}>
            {isConcluded
              ? 'Rescue Completed'
              : isLiveConnected
              ? 'Live Tracking'
              : 'Updating Location'}
          </Text>
        </View>

        {friendlyDistance ? (
          <View style={styles.distancePill}>
            <Text style={styles.distancePillText}>📍 {friendlyDistance}</Text>
          </View>
        ) : !isConcluded ? (
          <View style={styles.waitingPill}>
            <Text style={styles.waitingPillText}>🔍 Finding a Rescuer...</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Floating Controls with Clear Action Identity */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.floatingBtn} onPress={handleRecenter}>
          <Text style={styles.floatingBtnIcon}>🎯</Text>
          <Text style={styles.floatingBtnText}>Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.floatingBtn} onPress={openAnimalLocationInMaps}>
          <Text style={styles.floatingBtnIcon}>🐕</Text>
          <Text style={styles.floatingBtnText}>Animal</Text>
        </TouchableOpacity>

        {validResponderCoord && (
          <TouchableOpacity
            style={[styles.floatingBtn, styles.mapsExternalBtn]}
            onPress={openRescuerLocationInMaps}
          >
            <Text style={styles.floatingBtnIcon}>🚑</Text>
            <Text style={[styles.floatingBtnText, { color: '#FFFFFF' }]}>Rescuer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Overlay */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.forest} />
          <Text style={styles.loadingOverlayText}>Initializing Map...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    position: 'relative',
  },
  map: {
    height: 280,
    width: '100%',
  },
  // ---------------------------------------------------------------------------
  // Empty State Styles
  // ---------------------------------------------------------------------------
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAFAF7',
  },
  emptyIcon: {
    fontSize: rs(36),
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: rs(20),
    color: colors.ink,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: rs(13),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: rs(18),
  },
  // ---------------------------------------------------------------------------
  // Resilient Fallback Card Styles (Simplified Citizen View)
  // ---------------------------------------------------------------------------
  fallbackContainer: {
    padding: 16,
    backgroundColor: '#FBFDF9',
  },
  fallbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  fallbackStatusText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: 0.2,
  },
  distanceBadge: {
    backgroundColor: colors.sage,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  distanceText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: colors.forest,
  },
  // Location Section Cards
  locationSectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  rescuerSectionCard: {
    borderColor: 'rgba(14, 75, 67, 0.22)',
    backgroundColor: '#F7FAF7',
  },
  unassignedSectionCard: {
    backgroundColor: '#FAFAF7',
    borderStyle: 'dashed',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionEmoji: {
    fontSize: rs(20),
    marginRight: 10,
    marginTop: 2,
  },
  sectionHeaderTexts: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: rs(12),
    fontWeight: '700',
    color: colors.soft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  addressText: {
    fontSize: rs(14),
    fontWeight: '700',
    color: colors.ink,
    lineHeight: rs(20),
  },
  locationHelpText: {
    fontSize: rs(12),
    color: colors.muted,
    marginTop: 2,
  },
  liveTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  liveTrackingDot: {
    color: '#4CAF50',
    fontSize: rs(10),
    marginRight: 6,
  },
  liveTrackingText: {
    fontSize: rs(12),
    color: colors.forest,
    fontWeight: '600',
  },
  friendlyDistanceHighlight: {
    fontSize: rs(13),
    fontWeight: '700',
    color: colors.forest,
    marginTop: 6,
  },
  waitingMainText: {
    fontSize: rs(13),
    fontWeight: '700',
    color: colors.forest,
    lineHeight: rs(18),
  },
  waitingSubText: {
    fontSize: rs(12),
    color: colors.muted,
    marginTop: 3,
  },
  // Buttons
  actionBtnSecondary: {
    backgroundColor: '#EBF3EF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14, 75, 67, 0.15)',
  },
  actionBtnSecondaryText: {
    color: colors.forest,
    fontSize: rs(13),
    fontWeight: '700',
  },
  actionBtnPrimary: {
    backgroundColor: colors.forest,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '700',
  },
  // ---------------------------------------------------------------------------
  // Custom Pins
  // ---------------------------------------------------------------------------
  emergencyPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D94B42',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  emergencyPinIcon: {
    fontSize: rs(16),
  },
  responderPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forest,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  responderPinIcon: {
    fontSize: rs(18),
  },
  pinArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#D94B42',
    position: 'absolute',
    bottom: -6,
  },
  // ---------------------------------------------------------------------------
  // Native Overlays & Floating Controls
  // ---------------------------------------------------------------------------
  topOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  statusPillText: {
    fontSize: rs(11),
    fontWeight: '700',
    color: colors.ink,
  },
  distancePill: {
    backgroundColor: 'rgba(14, 75, 67, 0.94)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  distancePillText: {
    fontSize: rs(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waitingPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  waitingPillText: {
    fontSize: rs(11),
    fontWeight: '600',
    color: colors.forest,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mapsExternalBtn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  floatingBtnIcon: {
    fontSize: rs(12),
    marginRight: 4,
  },
  floatingBtnText: {
    fontSize: rs(12),
    fontWeight: '700',
    color: colors.ink,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    fontSize: rs(12),
    color: colors.muted,
    marginTop: 6,
    fontWeight: '600',
  },
});

export default memo(RescueMapView);
