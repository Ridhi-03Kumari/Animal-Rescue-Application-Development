import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORTS_KEY = '@animal_rescue_reports';

export const getReports = async () => {
  try {
    const data = await AsyncStorage.getItem(REPORTS_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.log('Error reading reports:', error);
    return [];
  }
};

export const saveReport = async (report) => {
  try {
    const existingReports = await getReports();

    const updatedReports = [
      report,
      ...existingReports,
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