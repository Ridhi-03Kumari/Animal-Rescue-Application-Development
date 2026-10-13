import { Alert, Platform } from 'react-native';

/**
 * Shows a short message to the user.
 * Alert.alert does nothing in a web browser, so the browser's own dialog is used there.
 */
export function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
