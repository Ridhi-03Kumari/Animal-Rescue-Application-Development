import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/shared/WelcomeScreen';
import ReportEmergencyScreen from '../screens/citizen/ReportEmergencyScreen';
import ReportSubmittedScreen from '../screens/citizen/ReportSubmittedScreen';
import CitizenHomeScreen from '../screens/citizen/CitizenHomeScreen';
import MyReportsScreen from '../screens/citizen/MyReportsScreen';
import EmergencyContactsScreen from '../screens/citizen/EmergencyContactsScreen';
import CaseTrackingScreen from '../screens/citizen/CaseTrackingScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />
        <Stack.Screen
          name="ReportEmergency"
          component={ReportEmergencyScreen}
        />
        <Stack.Screen
          name="ReportSubmitted"
          component={ReportSubmittedScreen}
        /> 
        <Stack.Screen
          name="CaseTracking"
          component={CaseTrackingScreen}
        />
        <Stack.Screen
          name="CitizenHome"
          component={CitizenHomeScreen}
        />
        <Stack.Screen
          name="MyReports"
          component={MyReportsScreen}
        />
        <Stack.Screen
          name="EmergencyContacts"
          component={EmergencyContactsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}