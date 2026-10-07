import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../../components/AppButton';
import ScreenBackground from '../../components/ScreenBackground';
import ScreenHeader from '../../components/ScreenHeader';
import SegmentedNav from '../../components/SegmentedNav';
import { Accent } from '../../components/Heading';
import { Paw } from '../../components/Doodles';
import { ADOPTABLE_PETS } from '../../data/adoptablePets';
import { getAdoptionRequests, saveAdoptionRequest } from '../../services/storage';
import { colors, fonts } from '../../theme';
import { rs } from '../../responsive';

const PHOTOS = {
  dog: require('../../../assets/pet_dog.jpg'),
  kitten: require('../../../assets/pet_kitten.jpg'),
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'dog', label: 'Dogs' },
  { id: 'cat', label: 'Cats' },
  { id: 'bird', label: 'Birds' },
];

const EMPTY_FORM = { name: '', phone: '', area: '', reason: '' };

export default function AdoptionScreen({ navigation }) {
  const [filter, setFilter] = useState('all');
  const [requests, setRequests] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAdoptionRequests().then(setRequests);
  }, []);

  const pets = ADOPTABLE_PETS.filter((p) => filter === 'all' || p.type === filter);
  const requestedIds = requests.map((r) => r.petId);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openForm = async (pet) => {
    setErrorMsg('');
    setSuccessMsg('');
    // Pre-fill name and phone if the citizen is signed in
    let prefill = EMPTY_FORM;
    try {
      const stored = await AsyncStorage.getItem('user_profile');
      if (stored) {
        const user = JSON.parse(stored);
        prefill = { ...EMPTY_FORM, name: user.name || '', phone: user.phone || '' };
      }
    } catch (e) {}
    setForm(prefill);
    setSelectedPet(pet);
  };

  const closeForm = () => {
    setSelectedPet(null);
    setErrorMsg('');
  };

  const submitRequest = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setErrorMsg('Please enter your name and phone number.');
      return;
    }

    if (form.phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);
    const request = {
      id: `ADOPT${Date.now()}`,
      petId: selectedPet.id,
      petName: selectedPet.name,
      petType: selectedPet.type,
      name: form.name.trim(),
      phone: form.phone.trim(),
      area: form.area.trim(),
      reason: form.reason.trim(),
      status: 'Pending review',
      createdAt: new Date().toISOString(),
    };

    const saved = await saveAdoptionRequest(request);
    setSubmitting(false);

    if (!saved) {
      setErrorMsg('Could not save your request. Please try again.');
      return;
    }

    setRequests((prev) => [request, ...prev]);
    setSuccessMsg(`Request sent for ${selectedPet.name}. A rescue volunteer will contact you on ${request.phone}.`);
    closeForm();
  };

  return (
    <ScreenBackground
      header={
        <ScreenHeader
          eyebrow="Give them a home"
          title={
            <>
              Adopt a <Accent>Pet</Accent>
            </>
          }
          subtitle="Rescued animals from Bengaluru looking for a loving family."
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
      {successMsg ? (
        <View style={styles.successBox}>
          <Text maxFontSizeMultiplier={1.3} style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Species filter */}
      <SegmentedNav
        tone="dark"
        style={styles.filterRow}
        activeKey={filter}
        items={FILTERS.map((item) => ({
          key: item.id,
          label: item.label,
          onPress: () => setFilter(item.id),
        }))}
      />

      {pets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text maxFontSizeMultiplier={1.3} style={styles.emptyTitle}>No animals in this group yet</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.emptyText}>Check back soon, new rescues are added regularly.</Text>
        </View>
      ) : (
        pets.map((pet) => {
          const requested = requestedIds.includes(pet.id);
          return (
            <View key={pet.id} style={styles.card}>
              <View style={styles.cardTop}>
                {PHOTOS[pet.photo] ? (
                  <Image source={PHOTOS[pet.photo]} style={styles.petPhoto} />
                ) : (
                  <View style={styles.petAvatar}>
                    <Paw size={rs(52)} color="rgba(14, 75, 67, 0.55)" />
                    <Text maxFontSizeMultiplier={1.3} style={styles.petAvatarLabel}>Photo soon</Text>
                  </View>
                )}

                <View style={styles.petInfo}>
                  <Text maxFontSizeMultiplier={1.3} style={styles.petName}>{pet.name}</Text>
                  <Text maxFontSizeMultiplier={1.3} style={styles.petBreed}>{pet.breed}</Text>
                  <Text maxFontSizeMultiplier={1.3} style={styles.petMeta}>
                    {pet.age}  ·  {pet.gender}  ·  {pet.size}
                  </Text>

                  <View style={styles.tagRow}>
                    {pet.vaccinated ? (
                      <Text maxFontSizeMultiplier={1.3} style={[styles.tag, styles.tagGood]}>Vaccinated</Text>
                    ) : null}
                    {pet.sterilised ? (
                      <Text maxFontSizeMultiplier={1.3} style={[styles.tag, styles.tagGood]}>Sterilised</Text>
                    ) : null}
                    {pet.temperament.map((t) => (
                      <Text maxFontSizeMultiplier={1.3} key={t} style={styles.tag}>
                        {t}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              <Text maxFontSizeMultiplier={1.3} style={styles.story}>{pet.story}</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.rescuedFrom}>Rescued from {pet.rescuedFrom}, Bengaluru</Text>

              <AppButton
                title={requested ? 'Request Sent' : `Apply to Adopt ${pet.name}`}
                size="md"
                variant={requested ? 'soft' : 'primary'}
                disabled={requested}
                onPress={() => openForm(pet)}
              />
            </View>
          );
        })
      )}

      {/* The citizen's own requests */}
      {requests.length > 0 ? (
        <>
          <Text maxFontSizeMultiplier={1.3} style={styles.sectionTitle}>My Adoption Requests</Text>
          {requests.map((r) => (
            <View key={r.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <Text maxFontSizeMultiplier={1.3} style={styles.requestPet}>{r.petName}</Text>
                <Text maxFontSizeMultiplier={1.3} style={styles.requestStatus}>{r.status.toUpperCase()}</Text>
              </View>
              <Text maxFontSizeMultiplier={1.3} style={styles.requestMeta}>
                Sent as {r.name}  ·  {new Date(r.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {/* Application form */}
      <Modal visible={!!selectedPet} transparent animationType="slide" onRequestClose={closeForm}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text maxFontSizeMultiplier={1.3} style={styles.sheetEyebrow}>Adoption Request</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.sheetTitle}>Adopt {selectedPet ? selectedPet.name : ''}</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.sheetText}>
                Tell us a little about you. A rescue volunteer will contact you to arrange a meeting.
              </Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Full Name</Text>
              <TextInput maxFontSizeMultiplier={1.3}
                style={styles.input}
                placeholder="e.g. Ananya Sharma"
                placeholderTextColor={colors.soft}
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
              />

              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Phone Number</Text>
              <TextInput maxFontSizeMultiplier={1.3}
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.soft}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => updateField('phone', v)}
              />

              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Area in Bengaluru</Text>
              <TextInput maxFontSizeMultiplier={1.3}
                style={styles.input}
                placeholder="e.g. Indiranagar"
                placeholderTextColor={colors.soft}
                value={form.area}
                onChangeText={(v) => updateField('area', v)}
              />

              <Text maxFontSizeMultiplier={1.3} style={styles.label}>Why would you like to adopt?</Text>
              <TextInput maxFontSizeMultiplier={1.3}
                style={[styles.input, styles.inputMultiline]}
                placeholder="Share a little about your home and family..."
                placeholderTextColor={colors.soft}
                value={form.reason}
                onChangeText={(v) => updateField('reason', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <AppButton
                title="Send Adoption Request"
                variant="accent"
                loading={submitting}
                style={styles.sheetSubmit}
                onPress={submitRequest}
              />
              <AppButton title="Cancel" size="md" variant="outline" onPress={closeForm} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  successBox: {
    backgroundColor: colors.sage,
    borderLeftWidth: 4,
    borderLeftColor: colors.forest,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  successText: {
    fontSize: rs(15),
    lineHeight: rs(22),
    color: colors.forestDark,
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.ink,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: rs(15),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: rs(22),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
    shadowColor: colors.deep,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  petPhoto: {
    width: rs(96),
    height: rs(144),
    borderRadius: rs(48),
    borderWidth: 3,
    borderColor: colors.orangeSoft,
    backgroundColor: colors.sage,
  },
  petAvatar: {
    width: rs(96),
    height: rs(144),
    borderRadius: rs(48),
    borderWidth: 3,
    borderColor: colors.orangeSoft,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  petAvatarLabel: {
    fontFamily: fonts.script,
    fontSize: rs(17),
    color: colors.forest,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontFamily: fonts.display,
    fontSize: rs(30),
    color: colors.ink,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: rs(15),
    fontWeight: '600',
    color: colors.forest,
    marginBottom: 2,
  },
  petMeta: {
    fontSize: rs(14),
    color: colors.soft,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: rs(12),
    fontWeight: '700',
    color: colors.muted,
    backgroundColor: colors.divider,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tagGood: {
    backgroundColor: colors.lime,
    color: colors.deep,
  },
  story: {
    fontSize: rs(15),
    lineHeight: rs(22),
    color: colors.muted,
    marginBottom: 8,
  },
  rescuedFrom: {
    fontSize: rs(13),
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: rs(26),
    color: colors.forestDark,
    marginTop: 10,
    marginBottom: 14,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  requestPet: {
    fontFamily: fonts.display,
    fontSize: rs(24),
    color: colors.ink,
  },
  requestStatus: {
    fontSize: rs(12),
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.gold,
    backgroundColor: colors.orangeSoft,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  requestMeta: {
    fontSize: rs(14),
    color: colors.soft,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 44, 39, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 28,
  },
  sheetEyebrow: {
    fontFamily: fonts.serif,
    fontSize: rs(13),
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 6,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: rs(34),
    color: colors.forestDark,
    marginBottom: 8,
  },
  sheetText: {
    fontSize: rs(15),
    lineHeight: rs(22),
    color: colors.muted,
    marginBottom: 18,
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
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  inputMultiline: {
    minHeight: 110,
  },
  sheetSubmit: {
    marginTop: 4,
    marginBottom: 12,
  },
});
