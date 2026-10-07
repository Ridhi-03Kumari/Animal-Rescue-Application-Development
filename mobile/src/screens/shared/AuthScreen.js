import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import api from '../../services/api';
import { useSession } from '../../context/SessionContext';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs, isSmallPhone } from '../../responsive';

const ANIMAL_OPTIONS = [
  { id: 'dog', label: 'Dogs' },
  { id: 'cat', label: 'Cats' },
  { id: 'cattle', label: 'Cattle / Cows' },
  { id: 'bird', label: 'Birds' },
  { id: 'wildlife', label: 'Wildlife / Reptiles' },
];

export default function AuthScreen({ navigation, route }) {
  const initialRole = route.params?.role || 'citizen';
  const { signIn } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(initialRole);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [selectedAnimals, setSelectedAnimals] = useState(['dog', 'cat']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const toggleAnimal = (id) => {
    if (selectedAnimals.includes(id)) {
      if (selectedAnimals.length === 1) return; // Keep at least one
      setSelectedAnimals(selectedAnimals.filter((a) => a !== id));
    } else {
      setSelectedAnimals([...selectedAnimals, id]);
    }
  };

  // The demo accounts depend on the server's mode: the built-in demo store (no database) has Ananya and
  // Rajesh, while a real MongoDB database has the accounts created by `npm run seed`.
  const DEMO_ACCOUNTS = {
    demo: {
      citizen: { phone: '9876543210', password: 'password123', name: 'Ananya Sharma' },
      rescuer: {
        phone: '9845012345',
        password: 'password123',
        name: 'Rajesh Kumar',
        organizationName: 'Bengaluru Animal Rescue Squad',
      },
    },
    mongodb: {
      citizen: { phone: '9888888888', password: 'rescuer123', name: 'Aarav Patel' },
      rescuer: {
        phone: '9876543210',
        password: 'rescuer123',
        name: 'Rahul',
        organizationName: 'Compassion Animal Rescue',
      },
    },
  };

  const handleDemoFill = async (type) => {
    setErrorMsg('');
    let mode = 'demo';
    try {
      const health = await api.checkHealth();
      if (health.database === 'mongodb') mode = 'mongodb';
    } catch (e) {
      // server not reachable: fall back to the demo-mode accounts
    }

    const account = DEMO_ACCOUNTS[mode][type];
    setRole(type);
    setPhone(account.phone);
    setPassword(account.password);
    setName(account.name);
    if (type === 'rescuer') setOrganizationName(account.organizationName);
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!phone || !password) {
      setErrorMsg('Please enter both phone number and password.');
      return;
    }

    if (!isLogin && !name) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await api.login(phone, password);
      } else {
        res = await api.register({
          name,
          phone,
          password,
          role,
          organizationName: role === 'rescuer' ? organizationName : undefined,
          animalsHandled: role === 'rescuer' ? selectedAnimals : undefined,
        });
      }

      if (!res.token || !res.user) {
        throw new Error('Unexpected reply from the server. Please try again.');
      }
      if (!['citizen', 'rescuer'].includes(res.user.role)) {
        throw new Error('This type of account is not available in the mobile app.');
      }
      // Signing in through the wrong door: a citizen account cannot open the rescuer side, or the reverse
      if (isLogin && res.user.role !== role) {
        const right = res.user.role === 'rescuer' ? 'Rescuer' : 'Citizen';
        throw new Error(`This is a ${res.user.role} account. Choose "${right}" above and sign in again.`);
      }

      // Saves the login and switches the app to this role's side
      await signIn(res.token, res.user);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          size="lg"
          eyebrow="Bengaluru Rescue Network"
          title={
            <>
              {isLogin ? 'Welcome ' : 'Join the '}
              <Accent>{isLogin ? 'back' : 'rescue'}</Accent>
            </>
          }
          subtitle="Connect citizens with swift animal responders across Bengaluru"
        />
      }
      scroll
      contentStyle={styles.content}
    >
          {/* Centered Auth Card */}
          <View style={styles.card}>
        {/* Sign In vs Sign Up Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => {
              setIsLogin(true);
              setErrorMsg('');
            }}
          >
            <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.tabText, isLogin && styles.activeTabText]}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => {
              setIsLogin(false);
              setErrorMsg('');
            }}
          >
            <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.tabText, !isLogin && styles.activeTabText]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Role Selector */}
        <Text maxFontSizeMultiplier={1.3} style={styles.sectionLabel}>Select Your Role:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'citizen' && styles.roleCardActive]}
            onPress={() => setRole('citizen')}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.roleTitle, role === 'citizen' && styles.roleTitleActive]}>
              Citizen
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={[styles.roleSub, role === 'citizen' && styles.roleSubActive]}>Report & track injured animals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === 'rescuer' && styles.roleCardActive]}
            onPress={() => setRole('rescuer')}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.roleTitle, role === 'rescuer' && styles.roleTitleActive]}>
              Rescuer
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={[styles.roleSub, role === 'rescuer' && styles.roleSubActive]}>Respond to dispatch alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Messages */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.successBox}>
            <Text maxFontSizeMultiplier={1.3} style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Input Fields */}
        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Full Name</Text>
            <TextInput maxFontSizeMultiplier={1.3}
              style={styles.input}
              placeholder="e.g. Dr. Priya Sharma"
              placeholderTextColor={colors.soft}
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text maxFontSizeMultiplier={1.3} style={styles.label}>Phone Number</Text>
          <TextInput maxFontSizeMultiplier={1.3}
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.soft}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text maxFontSizeMultiplier={1.3} style={styles.label}>Password</Text>
          <TextInput maxFontSizeMultiplier={1.3}
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={colors.soft}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Additional Rescuer-Specific Capabilities (Shown on Sign Up) */}
        {!isLogin && role === 'rescuer' && (
          <View style={styles.rescuerSpecs}>
            <View style={styles.inputGroup}>
              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Organization / NGO Name (Optional)</Text>
              <TextInput maxFontSizeMultiplier={1.3}
                style={styles.input}
                placeholder="e.g. CUPA, CARE, Independent"
                placeholderTextColor={colors.soft}
                value={organizationName}
                onChangeText={setOrganizationName}
              />
            </View>

            <Text maxFontSizeMultiplier={1.3} style={styles.label}>Animals You Can Rescue / Handle:</Text>
            <View style={styles.chipsRow}>
              {ANIMAL_OPTIONS.map((item) => {
                const selected = selectedAnimals.includes(item.id);
                return (
                  <AppButton
                    key={item.id}
                    title={item.label}
                    size="pill"
                    variant={selected ? 'primary' : 'light'}
                    onPress={() => toggleAnimal(item.id)}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <AppButton
          title={isLogin ? `Sign In as ${role === 'rescuer' ? 'Rescuer' : 'Citizen'}` : `Create ${role === 'rescuer' ? 'Rescuer' : 'Citizen'} Account`}
          style={styles.submitBtn}
          onPress={handleSubmit}
          loading={loading}
        />

        {/* Quick Demo Pre-fill Links */}
        <View style={styles.demoBox}>
          <Text maxFontSizeMultiplier={1.3} style={styles.demoLabel}>Demo Quick Logins:</Text>
          <View style={styles.demoButtonsRow}>
            <AppButton
              title="Fill Demo Citizen"
              size="sm"
              variant="light"
              style={styles.demoBtn}
              textStyle={styles.demoBtnText}
              onPress={() => handleDemoFill('citizen')}
            />

            <AppButton
              title="Fill Demo Rescuer"
              size="sm"
              variant="light"
              style={styles.demoBtn}
              textStyle={styles.demoBtnText}
              onPress={() => handleDemoFill('rescuer')}
            />
          </View>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 56,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.deep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFE9E0',
    borderRadius: 28,
    padding: 5,
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCD5CA',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: {
    fontFamily: fonts.serif,
    fontSize: isSmallPhone ? 13 : rs(16),
    fontWeight: '700',
    color: colors.muted,
  },
  activeTabText: {
    color: colors.ink,
  },
  sectionLabel: {
    fontSize: rs(14),
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  roleCard: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  roleCardActive: {
    borderColor: colors.forest,
    backgroundColor: colors.forest,
  },
  roleTitle: {
    fontFamily: fonts.serif,
    fontSize: rs(18),
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  roleTitleActive: {
    color: '#FFFFFF',
  },
  roleSub: {
    fontSize: rs(13),
    color: colors.soft,
    textAlign: 'center',
    lineHeight: rs(18),
  },
  roleSubActive: {
    color: '#CFE0D6',
  },
  errorBox: {
    backgroundColor: '#FFE3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#B3261E',
    fontSize: rs(14),
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#DDF3E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  successText: {
    color: '#1F7A3E',
    fontSize: rs(14),
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: rs(14),
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: rs(16),
    color: colors.ink,
    backgroundColor: colors.cream,
  },
  rescuerSpecs: {
    marginTop: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 18,
  },
  demoBox: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoLabel: {
    fontFamily: fonts.serif,
    fontSize: rs(15),
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 12,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    paddingHorizontal: 6,
  },
  demoBtnText: {
    fontSize: rs(13),
  },
});
