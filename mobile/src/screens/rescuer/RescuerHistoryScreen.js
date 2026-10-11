import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

export default function RescuerHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api
      .getAllCases({ status: 'completed' })
      .then((res) => setHistory(res.cases || []))
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="Archive"
          title={
            <>
              Rescue Case <Accent>History</Accent>
            </>
          }
          subtitle="All completed animal emergency rescues and medical records."
          left={
            <SegmentedNav
              activeKey="nav"
              items={[{ key: 'nav', label: '← Back', onPress: () => navigation.goBack() }]}
            />
          }
        />
      }
      scroll
      contentStyle={styles.content}
    >
        {loading ? (
          <ActivityIndicator size="large" color={colors.forest} style={{ marginTop: 24 }} />
        ) : errorMsg ? (
          <View style={styles.card}>
            <Text maxFontSizeMultiplier={1.3} style={styles.animalType}>Could not load history</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.location}>{errorMsg}</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.card}>
            <Text maxFontSizeMultiplier={1.3} style={styles.animalType}>No completed rescues yet</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.location}>
              When a rescue is marked Completed, it appears here with the animal's collar QR.
            </Text>
          </View>
        ) : null}

        {history.map((item) => (
          <View key={item._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text maxFontSizeMultiplier={1.3} style={styles.animalType}>Rescued {item.animalType.toUpperCase()}</Text>
              <View style={styles.badge}>
                <Text maxFontSizeMultiplier={1.3} style={styles.badgeText}>COMPLETED</Text>
              </View>
            </View>

            <Text maxFontSizeMultiplier={1.3} style={styles.date}>
              Rescue Date: {new Date(item.createdAt).toLocaleDateString()}
            </Text>

            <Text maxFontSizeMultiplier={1.3} style={styles.location}>
              {item.location?.address || 'Bengaluru Location'}
            </Text>

            {item.medicalNotes ? (
              <View style={styles.medicalBox}>
                <Text maxFontSizeMultiplier={1.3} style={styles.medicalTitle}>Medical Notes</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.medicalText}>{item.medicalNotes}</Text>
              </View>
            ) : null}

            <AppButton
              title="View Collar QR Health Profile"
              size="md"
              onPress={() => navigation.navigate('AnimalQr', { caseId: item._id })}
            />
          </View>
        ))}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 18,
    shadowColor: colors.deep,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  animalType: {
    fontFamily: fonts.display,
    fontSize: rs(25),
    color: colors.ink,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: colors.forest,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: rs(12),
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  date: {
    fontSize: rs(14),
    color: colors.soft,
    marginBottom: 6,
  },
  location: {
    fontSize: rs(15),
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 12,
  },
  medicalBox: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
    marginBottom: 16,
  },
  medicalTitle: {
    fontSize: rs(13),
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 4,
  },
  medicalText: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
  },
});
