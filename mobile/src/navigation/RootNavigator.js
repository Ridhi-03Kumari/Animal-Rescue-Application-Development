import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Shared
import WelcomeScreen from '../screens/shared/WelcomeScreen';

// Citizen Screens
import CitizenHomeScreen from '../screens/citizen/CitizenHomeScreen';
import ReportEmergencyScreen from '../screens/citizen/ReportEmergencyScreen';
import ReportSubmittedScreen from '../screens/citizen/ReportSubmittedScreen';
import CaseTrackingScreen from '../screens/citizen/CaseTrackingScreen';
import MyReportsScreen from '../screens/citizen/MyReportsScreen';
import EmergencyContactsScreen from '../screens/citizen/EmergencyContactsScreen';

// Rescuer Screens
import RescuerHomeScreen from '../screens/rescuer/RescuerHomeScreen';
import RescueRequestScreen from '../screens/rescuer/RescueRequestScreen';
import ActiveRescueScreen from '../screens/rescuer/ActiveRescueScreen';
import AnimalQrScreen from '../screens/rescuer/AnimalQrScreen';
import RescuerProfileScreen from '../screens/rescuer/RescuerProfileScreen';
import RescuerHistoryScreen from '../screens/rescuer/RescuerHistoryScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Entry Role Selection */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* Citizen Flow */}
        <Stack.Screen name="CitizenHome" component={CitizenHomeScreen} />
        <Stack.Screen name="ReportEmergency" component={ReportEmergencyScreen} />
        <Stack.Screen name="ReportSubmitted" component={ReportSubmittedScreen} />
        <Stack.Screen name="CaseTracking" component={CaseTrackingScreen} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />

        {/* Rescuer Flow */}
        <Stack.Screen name="RescuerHome" component={RescuerHomeScreen} />
        <Stack.Screen name="RescueRequest" component={RescueRequestScreen} />
        <Stack.Screen name="ActiveRescue" component={ActiveRescueScreen} />
        <Stack.Screen name="AnimalQr" component={AnimalQrScreen} />
        <Stack.Screen name="RescuerProfile" component={RescuerProfileScreen} />
        <Stack.Screen name="RescuerHistory" component={RescuerHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}