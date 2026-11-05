/**
 * Dynamic Expo Configuration
 * Extends app.json with environment variables such as Google Maps API keys.
 */
module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...config,
    android: {
      ...config.android,
      package: config.android?.package || 'com.animalrescue.bengaluru',
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...config.ios,
      bundleIdentifier: config.ios?.bundleIdentifier || 'com.animalrescue.bengaluru',
      config: {
        ...config.ios?.config,
        googleMapsApiKey: googleMapsApiKey,
      },
    },
  };
};

