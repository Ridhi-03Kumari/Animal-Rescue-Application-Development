import React from 'react';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CormorantSC_700Bold } from '@expo-google-fonts/cormorant-sc';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import RootNavigator from './src/navigation/RootNavigator';
import { SessionProvider } from './src/context/SessionContext';
import { colors } from './src/theme';

// Development only: when the phone briefly loses the link to the Expo dev server (PC changed Wi-Fi,
// server restarted) React Native pops a yellow "Cannot connect to Expo CLI" banner. It only affects
// live reloading, not the app, so keep it off the screen.
LogBox.ignoreLogs(['Cannot connect to Expo CLI']);

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ CormorantSC_700Bold, Caveat_600SemiBold });

  // Wait for the heading and handwriting fonts so text never flashes in the wrong face.
  // If a font fails to load, carry on with the system fonts instead of blocking the app.
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
