import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUnauthorizedHandler } from '../services/api';

const TOKEN_KEY = 'user_token';
const PROFILE_KEY = 'user_profile';
// Only these two kinds of account use the mobile app. Coordinators work from the control room.
const APP_ROLES = ['citizen', 'rescuer'];

const SessionContext = createContext({
  user: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
});

/**
 * Remembers who is signed in (or that nobody is, a guest).
 * The navigator reads this to decide which screens exist: a guest or citizen gets the citizen side,
 * a rescuer gets the rescuer side, and nobody gets both.
 */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // On app start, restore the login saved on this phone
  useEffect(() => {
    (async () => {
      try {
        const [token, rawProfile] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(PROFILE_KEY),
        ]);
        const profile = rawProfile ? JSON.parse(rawProfile) : null;
        if (token && profile && APP_ROLES.includes(profile.role)) {
          setUser(profile);
        } else if (token || rawProfile) {
          await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY]); // half-saved or unsupported login
        }
      } catch (e) {
        // unreadable storage: carry on as a guest
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const signIn = useCallback(async (token, profile) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [PROFILE_KEY, JSON.stringify(profile)],
    ]);
    setUser(profile);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY]);
    } catch (e) {
      // ignore: the screen still switches to the guest side below
    }
    setUser(null);
  }, []);

  // If the server says the saved login has expired, sign out automatically
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
