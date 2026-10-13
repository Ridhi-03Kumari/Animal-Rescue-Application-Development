import { notify } from './notify';

/**
 * Tells a rescuer why accepting / declining a case did not work.
 * Only signed-in rescuers can reach these screens. If the saved login has expired the app signs them out
 * by itself (see SessionContext), so here we only need to explain what happened.
 */
export function showRescuerActionError(err, navigation, action = 'accept') {
  const message =
    err && err.status === 401
      ? 'Your login has expired. Please log in again.'
      : (err && err.message) || 'Something went wrong. Please try again.';

  notify(`Could not ${action} the case`, message);
}
