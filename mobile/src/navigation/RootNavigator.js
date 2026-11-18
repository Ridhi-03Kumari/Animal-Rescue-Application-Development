import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '../context/SessionContext';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../services/notifications';
import { colors } from '../theme';

export const navigationRef = createNavigationContainerRef();

// Shared
import WelcomeScreen from '../screens/shared/WelcomeScreen';
import AuthScreen from '../screens/shared/AuthScreen';
import ForgotPasswordScreen from '../screens/shared/ForgotPasswordScreen';

// Citizen Screens
import CitizenHomeScreen from '../screens/citizen/CitizenHomeScreen';
import ReportEmergencyScreen from '../screens/citizen/ReportEmergencyScreen';
import ReportSubmittedScreen from '../screens/citizen/ReportSubmittedScreen';
import CaseTrackingScreen from '../screens/citizen/CaseTrackingScreen';
import MyReportsScreen from '../screens/citizen/MyReportsScreen';
import EmergencyContactsScreen from '../screens/citizen/EmergencyContactsScreen';
import AdoptionScreen from '../screens/citizen/AdoptionScreen';

// Rescuer Screens
import RescuerHomeScreen from '../screens/rescuer/RescuerHomeScreen';
import RescueRequestScreen from '../screens/rescuer/RescueRequestScreen';
import ActiveRescueScreen from '../screens/rescuer/ActiveRescueScreen';
import AnimalQrScreen from '../screens/rescuer/AnimalQrScreen';
import RescuerProfileScreen from '../screens/rescuer/RescuerProfileScreen';
import RescuerHistoryScreen from '../screens/rescuer/RescuerHistoryScreen';

// Coordinator Screens
import CoordinatorHomeScreen from '../screens/coordinator/CoordinatorHomeScreen';
import EscalatedCasesScreen from '../screens/coordinator/EscalatedCasesScreen';
import ActiveCasesScreen from '../screens/coordinator/ActiveCasesScreen';
import CoordinatorCaseDetailScreen from '../screens/coordinator/CoordinatorCaseDetailScreen';
import RescuerSelectionScreen from '../screens/coordinator/RescuerSelectionScreen';
import CoordinatorRescuersScreen from '../screens/coordinator/CoordinatorRescuersScreen';
import CoordinatorProfileScreen from '../screens/coordinator/CoordinatorProfileScreen';

const Stack = createNativeStackNavigator();

// Screens only exist for the side the user belongs to, so a citizen can never open a rescuer screen
// (and the other way round). Signing in or out swaps the whole set and starts at its first screen.
const coordinatorScreens = [
  <Stack.Screen key="CoordinatorHome" name="CoordinatorHome" component={CoordinatorHomeScreen} />,
  <Stack.Screen key="EscalatedCases" name="EscalatedCases" component={EscalatedCasesScreen} />,
  <Stack.Screen key="ActiveCases" name="ActiveCases" component={ActiveCasesScreen} />,
  <Stack.Screen key="CoordinatorCaseDetail" name="CoordinatorCaseDetail" component={CoordinatorCaseDetailScreen} />,
  <Stack.Screen key="RescuerSelection" name="RescuerSelection" component={RescuerSelectionScreen} />,
  <Stack.Screen key="CoordinatorRescuers" name="CoordinatorRescuers" component={CoordinatorRescuersScreen} />,
  <Stack.Screen key="CoordinatorProfile" name="CoordinatorProfile" component={CoordinatorProfileScreen} />,
];

const citizenScreens = [
  <Stack.Screen key="CitizenHome" name="CitizenHome" component={CitizenHomeScreen} />,
  <Stack.Screen key="ReportEmergency" name="ReportEmergency" component={ReportEmergencyScreen} />,
  <Stack.Screen key="ReportSubmitted" name="ReportSubmitted" component={ReportSubmittedScreen} />,
  <Stack.Screen key="CaseTracking" name="CaseTracking" component={CaseTrackingScreen} />,
  <Stack.Screen key="MyReports" name="MyReports" component={MyReportsScreen} />,
  <Stack.Screen key="EmergencyContacts" name="EmergencyContacts" component={EmergencyContactsScreen} />,
  <Stack.Screen key="Adoption" name="Adoption" component={AdoptionScreen} />,
  <Stack.Screen key="AnimalQr" name="AnimalQr" component={AnimalQrScreen} />,
];

const rescuerScreens = [
  <Stack.Screen key="RescuerHome" name="RescuerHome" component={RescuerHomeScreen} />,
  <Stack.Screen key="RescueRequest" name="RescueRequest" component={RescueRequestScreen} />,
  <Stack.Screen key="ActiveRescue" name="ActiveRescue" component={ActiveRescueScreen} />,
  <Stack.Screen key="AnimalQr" name="AnimalQr" component={AnimalQrScreen} />,
  <Stack.Screen key="RescuerProfile" name="RescuerProfile" component={RescuerProfileScreen} />,
  <Stack.Screen key="RescuerHistory" name="RescuerHistory" component={RescuerHistoryScreen} />,
];

export default function RootNavigator() {
  const { user, ready } = useSession();

  // Register push notifications when authenticated as a rescuer
  useEffect(() => {
    if (user && user.role === 'rescuer') {
      registerForPushNotificationsAsync();
      const unsubscribe = setupNotificationListeners(navigationRef);
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [user?.role]);

  // Wait until the saved login (if any) has been read, so the right side opens first
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Not signed in: the start page, the login page, and the citizen side (a guest may report an animal)
          [
            <Stack.Screen key="Welcome" name="Welcome" component={WelcomeScreen} />,
            <Stack.Screen key="Auth" name="Auth" component={AuthScreen} />,
            <Stack.Screen key="ForgotPassword" name="ForgotPassword" component={ForgotPasswordScreen} />,
            ...citizenScreens,
          ]
        ) : user.role === 'rescuer' ? (
          rescuerScreens
        ) : user.role === 'coordinator' || user.role === 'admin' ? (
          coordinatorScreens
        ) : (
          citizenScreens
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
