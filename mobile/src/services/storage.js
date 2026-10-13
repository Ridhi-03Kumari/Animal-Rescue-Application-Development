import AsyncStorage from '@react-native-async-storage/async-storage';
import { collapseDuplicateReports } from './dedupe';

const REPORTS_KEY = '@animal_rescue_reports';
const ADOPTIONS_KEY = '@animal_rescue_adoption_requests';

export const getReports = async () => {
  try {
    const data = await AsyncStorage.getItem(REPORTS_KEY);

    if (!data) {
      return [];
    }

    // Older copies of the same report (saved before duplicates were blocked) are shown once
    return collapseDuplicateReports(JSON.parse(data));
  } catch (error) {
    console.log('Error reading reports:', error);
    return [];
  }
};

export const saveReport = async (report) => {
  try {
    const existingReports = await getReports();

    // A repeated report comes back with the same case id: keep one copy, not two
    const updatedReports = [
      report,
      ...existingReports.filter((saved) => saved.id !== report.id),
    ];

    await AsyncStorage.setItem(
      REPORTS_KEY,
      JSON.stringify(updatedReports)
    );

    return true;
  } catch (error) {
    console.log('Error saving report:', error);
    return false;
  }
};

export const clearReports = async () => {
  try {
    await AsyncStorage.removeItem(REPORTS_KEY);
    return true;
  } catch (error) {
    console.log('Error clearing reports:', error);
    return false;
  }
};

export const getAdoptionRequests = async () => {
  try {
    const data = await AsyncStorage.getItem(ADOPTIONS_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.log('Error reading adoption requests:', error);
    return [];
  }
};

export const saveAdoptionRequest = async (request) => {
  try {
    const existingRequests = await getAdoptionRequests();

    await AsyncStorage.setItem(
      ADOPTIONS_KEY,
      JSON.stringify([request, ...existingRequests])
    );

    return true;
  } catch (error) {
    console.log('Error saving adoption request:', error);
    return false;
  }
};
