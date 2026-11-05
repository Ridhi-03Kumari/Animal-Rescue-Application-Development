import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSession } from '../../context/SessionContext';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import AppButton from '../../components/AppButton';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

export default function CoordinatorProfileScreen({ navigation }) {
  const { user, signOut } = useSession();

  return (
    <ScreenBackground>
      <ScreenHeader
        eyebrow="Emergency Coordinator"
        title="Profile"
        left={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        }
      />
      <View style={styles.body}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.name || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user?.name || 'Coordinator'}</Text>
        <Text style={styles.role}>{user?.role?.toUpperCase() || 'COORDINATOR'}</Text>

        {user?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}
        {user?.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <AppButton
          label="Sign Out"
          size="lg"
          variant="danger"
          onPress={signOut}
          style={styles.signOutBtn}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', paddingTop: 32, paddingHorizontal: 24 },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#fff', fontSize: rs(16), fontWeight: '700' },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: rs(36), fontFamily: fonts.display },
  name: { fontSize: rs(24), fontFamily: fonts.display, color: colors.ink, marginBottom: 4 },
  role: { fontSize: rs(12), letterSpacing: 1.5, color: colors.gold, fontWeight: '700', marginBottom: 24 },
  infoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  infoLabel: { fontSize: rs(14), color: colors.soft },
  infoValue: { fontSize: rs(14), color: colors.ink, fontWeight: '600' },
  divider: { height: 24 },
  signOutBtn: { width: '100%', marginTop: 8 },
});

