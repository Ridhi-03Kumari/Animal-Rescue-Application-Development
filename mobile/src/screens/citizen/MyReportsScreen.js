import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { getReports } from '../../services/storage';
import { collapseDuplicateReports } from '../../services/dedupe';
import { useSession } from '../../context/SessionContext';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

const readableStatus = (status) => String(status || 'reported').replace(/_/g, ' ');

export default function MyReportsScreen({ navigation }) {
  const { user } = useSession();
  const [reports, setReports] = useState([]);

  // Signed in: the reports come from the server, so their status is always current.
  // Guest: only the reports saved on this phone.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (user) {
          try {
            const res = await api.getMyReports();
            setReports(
              collapseDuplicateReports(
                (res.cases || []).map((c) => ({
                  id: c._id,
                  animalType: c.animalType,
                  description: c.description,
                  location: c.location,
                  urgency: c.urgency,
                  status: readableStatus(c.status),
                  createdAt: c.createdAt,
                }))
              )
            );
            return;
          } catch (e) {
            // server not reachable: fall back to the copy kept on this phone
          }
        }
        setReports(await getReports());
      })();
    }, [user])
  );

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="Your Activity"
          title={
            <>
              My <Accent>Reports</Accent>
            </>
          }
          subtitle="View the animal rescue reports you have submitted."
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
        {reports.length === 0 ? (
          <View style={styles.reportCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.animalType}>
              No reports yet
            </Text>

            <Text maxFontSizeMultiplier={1.3} style={styles.details}>
              Your submitted rescue reports will appear here.
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('CaseTracking', { caseId: report.id })}
            >
              <View style={styles.headerRow}>
                <Text maxFontSizeMultiplier={1.3} style={styles.caseId}>
                  Case #{report.id.slice(-6)}
                </Text>

                <View style={styles.statusBadge}>
                  <Text maxFontSizeMultiplier={1.3} style={styles.statusText}>
                    {report.status}
                  </Text>
                </View>
              </View>

              <Text maxFontSizeMultiplier={1.3} style={styles.animalType}>
                {report.animalType}
              </Text>

              {report.location && report.location.address ? (
                <Text maxFontSizeMultiplier={1.3} style={styles.details}>
                  {report.location.address}
                </Text>
              ) : null}

              <Text maxFontSizeMultiplier={1.3} style={styles.details}>
                {report.description ||
                  'No description provided.'}
              </Text>

              <Text maxFontSizeMultiplier={1.3} style={styles.date}>
                {new Date(
                  report.createdAt
                ).toLocaleDateString()}
              </Text>

              <Text maxFontSizeMultiplier={1.3} style={styles.urgencyLine}>
                AI Urgency: {report.urgency}
              </Text>
            </TouchableOpacity>
          ))
        )}
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

  reportCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  caseId: {
    fontSize: rs(15),
    fontWeight: '700',
    color: colors.soft,
  },

  statusBadge: {
    backgroundColor: colors.forest,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '800',
  },

  animalType: {
    fontFamily: fonts.display,
    fontSize: rs(26),
    color: colors.forest,
    marginBottom: 8,
  },

  details: {
    fontSize: rs(15),
    color: colors.muted,
    lineHeight: rs(22),
    marginBottom: 10,
  },

  date: {
    fontSize: rs(14),
    color: colors.soft,
    marginBottom: 8,
  },

  urgencyLine: {
    fontSize: rs(15),
    fontWeight: '700',
    color: colors.ink,
  },
});
