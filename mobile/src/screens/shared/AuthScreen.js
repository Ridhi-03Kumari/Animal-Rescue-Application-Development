import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const HERO_BG = require('../../../assets/rescue_hero_bg.jpg');

const ANIMAL_OPTIONS = [
  { id: 'dog', label: '🐕 Dogs' },
  { id: 'cat', label: '🐈 Cats' },
  { id: 'cattle', label: '🐄 Cattle / Cows' },
  { id: 'bird', label: '🕊️ Birds' },
  { id: 'wildlife', label: '🐍 Wildlife / Reptiles' },
];

export default function AuthScreen({ navigation, route }) {
  const initialRole = route.params?.role || 'citizen';
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

  const handleDemoFill = (type) => {
    setErrorMsg('');
    if (type === 'citizen') {
      setRole('citizen');
      setPhone('9876543210');
      setPassword('password123');
      setName('Ananya Sharma');
    } else {
      setRole('rescuer');
      setPhone('9845012345');
      setPassword('password123');
      setName('Rajesh Kumar');
      setOrganizationName('Bengaluru Animal Rescue Squad');
    }
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

      if (res.token) {
        await AsyncStorage.setItem('user_token', res.token);
      }
      if (res.user) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(res.user));
      }

      const activeRole = res.user?.role || role;
      setSuccessMsg(isLogin ? 'Login successful!' : 'Account created successfully!');

      setTimeout(() => {
        if (activeRole === 'rescuer') {
          navigation.replace('RescuerHome');
        } else {
          navigation.replace('CitizenHome');
        }
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    if (role === 'rescuer') {
      navigation.replace('RescuerHome');
    } else {
      navigation.replace('CitizenHome');
    }
  };

  return (
    <ImageBackground source={HERO_BG} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Header */}
          <View style={styles.header}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>🐾 BENGALURU RESCUE NETWORK</Text>
            </View>
            <Text style={styles.title}>Animal Emergency Rescue</Text>
            <Text style={styles.subtitle}>
              Connect citizens with swift animal responders across Bengaluru
            </Text>
          </View>

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
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => {
              setIsLogin(false);
              setErrorMsg('');
            }}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Role Selector */}
        <Text style={styles.sectionLabel}>Select Your Role:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'citizen' && styles.roleCardActive]}
            onPress={() => setRole('citizen')}
          >
            <Text style={styles.roleEmoji}>👤</Text>
            <Text style={[styles.roleTitle, role === 'citizen' && styles.roleTitleActive]}>
              Citizen
            </Text>
            <Text style={styles.roleSub}>Report & track injured animals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === 'rescuer' && styles.roleCardActive]}
            onPress={() => setRole('rescuer')}
          >
            <Text style={styles.roleEmoji}>🚑</Text>
            <Text style={[styles.roleTitle, role === 'rescuer' && styles.roleTitleActive]}>
              Rescuer
            </Text>
            <Text style={styles.roleSub}>Respond to dispatch alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Messages */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ {successMsg}</Text>
          </View>
        ) : null}

        {/* Input Fields */}
        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Dr. Priya Sharma"
              placeholderTextColor="#999999"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#999999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Additional Rescuer-Specific Capabilities (Shown on Sign Up) */}
        {!isLogin && role === 'rescuer' && (
          <View style={styles.rescuerSpecs}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization / NGO Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CUPA, CARE, Independent"
                placeholderTextColor="#999999"
                value={organizationName}
                onChangeText={setOrganizationName}
              />
            </View>

            <Text style={styles.label}>Animals You Can Rescue / Handle:</Text>
            <View style={styles.chipsRow}>
              {ANIMAL_OPTIONS.map((item) => {
                const selected = selectedAnimals.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => toggleAnimal(item.id)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isLogin ? `Sign In as ${role === 'rescuer' ? 'Rescuer' : 'Citizen'}` : `Create ${role === 'rescuer' ? 'Rescuer' : 'Citizen'} Account`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Quick Demo Pre-fill Links */}
        <View style={styles.demoBox}>
          <Text style={styles.demoLabel}>Demo Quick Logins:</Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleDemoFill('citizen')}
            >
              <Text style={styles.demoBtnText}>👤 Fill Demo Citizen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleDemoFill('rescuer')}
            >
              <Text style={styles.demoBtnText}>🚑 Fill Demo Rescuer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skip / Guest Link */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleGuestContinue}
        >
          <Text style={styles.guestText}>
            Reporting in a hurry? <Text style={styles.guestUnderline}>Continue as Guest →</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
</ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 26, 20, 0.55)',
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 36,
    paddingBottom: 50,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    maxWidth: 450,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E4D3E',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#E0EAE5',
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 17,
  },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F2',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#2F5D50',
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
  },
  roleCardActive: {
    borderColor: '#2F5D50',
    backgroundColor: '#EAF2EF',
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444444',
    marginBottom: 2,
  },
  roleTitleActive: {
    color: '#2F5D50',
  },
  roleSub: {
    fontSize: 11,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 14,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5DED9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#222222',
    backgroundColor: '#FAFAF7',
  },
  rescuerSpecs: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D5DED9',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#2F5D50',
    borderColor: '#2F5D50',
  },
  chipText: {
    fontSize: 12,
    color: '#444444',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#2F5D50',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoBox: {
    backgroundColor: '#F5F9F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE9E3',
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F5D50',
    marginBottom: 8,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B8D1C7',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F5D50',
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  guestText: {
    fontSize: 13,
    color: '#666666',
  },
  guestUnderline: {
    color: '#2F5D50',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
