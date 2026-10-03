import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Page = 'home' | 'results' | 'profile' | 'request' | 'signup';
type LocationState = 'idle' | 'requesting' | 'denied' | 'checked';
type Provider = {
  id: string;
  name: string;
  area: string;
  distance: string;
  eta: string;
  availability: string;
  mark: string;
  zones: string[];
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  error?: string;
  help?: string;
};

const SAMPLE_PROVIDERS: Provider[] = [
  {
    id: 'sample-08',
    name: 'Puncture Helper 08',
    area: 'Central demo zone',
    distance: '1.8 km',
    eta: '8–14 min',
    availability: 'Available in demo',
    mark: '08',
    zones: ['central'],
  },
  {
    id: 'sample-14',
    name: 'Puncture Helper 14',
    area: 'Central demo zone',
    distance: '3.2 km',
    eta: '15–22 min',
    availability: 'Next sample slot',
    mark: '14',
    zones: ['central', 'east'],
  },
];

const C = {
  ink: '#111827',
  inkSoft: '#263247',
  blue: '#3855F6',
  blueDeep: '#233AC5',
  lime: '#D5F34A',
  paper: '#F2F4F8',
  white: '#FFFFFF',
  line: '#DDE2EB',
  muted: '#4F5B70',
  muted2: '#657187',
  softBlue: '#E9EDFF',
  pale: '#F8F9FC',
  alert: '#8C2F24',
  alertBg: '#FFF0EC',
  success: '#205B45',
  successBg: '#E8F6EF',
};

function providersFor(area: string): Provider[] {
  const value = area.trim().toLowerCase();
  let matching: Provider[] = [];
  if (value.includes('central') || value.includes('midtown')) {
    matching = SAMPLE_PROVIDERS.filter((provider) => provider.zones.includes('central'));
  } else if (value.includes('east')) {
    matching = SAMPLE_PROVIDERS.filter((provider) => provider.zones.includes('east'));
  }
  return matching.map((provider) => ({ ...provider, area: area.trim() }));
}

function BrandMark() {
  return (
    <View style={styles.brandMark} accessible={false}>
      <View style={styles.brandWheel} />
      <View style={styles.brandHub} />
      <View style={styles.brandSlash} />
    </View>
  );
}

function Header({ onHome }: { onHome: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Patchlane home"
        onPress={onHome}
        style={styles.brandLockup}
      >
        <BrandMark />
        <View>
          <Text style={styles.brandName}>PATCHLANE</Text>
          <Text style={styles.brandTagline}>PUNCTURE HELP</Text>
        </View>
      </Pressable>
      <View style={styles.demoBadge}><View style={styles.demoDot} /><Text style={styles.demoBadgeText}>DEMO</Text></View>
    </View>
  );
}

function Eyebrow({ children, color = 'blue' }: { children: string; color?: 'blue' | 'muted' | 'lime' }) {
  return <Text style={[styles.eyebrow, color === 'muted' && styles.eyebrowMuted, color === 'lime' && styles.eyebrowLime]}>{children}</Text>;
}

function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'dark';
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'dark' && styles.buttonDark,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[
        styles.buttonText,
        variant === 'primary' && styles.buttonTextPrimary,
        variant === 'secondary' && styles.buttonTextSecondary,
        variant === 'dark' && styles.buttonTextDark,
      ]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, error, help }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted2}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={keyboardType === 'phone-pad' ? 'none' : 'words'}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Notice({ children, tone = 'info' }: { children: string; tone?: 'info' | 'alert' | 'success' }) {
  return (
    <View accessibilityRole={tone === 'alert' ? 'alert' : 'text'} style={[
      styles.notice,
      tone === 'alert' && styles.noticeAlert,
      tone === 'success' && styles.noticeSuccess,
    ]}>
      <View style={[styles.noticeDot, tone === 'alert' && styles.noticeDotAlert, tone === 'success' && styles.noticeDotSuccess]} />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

function ProviderCard({ provider, onOpen }: { provider: Provider; onOpen: () => void }) {
  return (
    <View style={styles.providerCard}>
      <View style={styles.providerTop}>
        <View style={styles.providerMark}><Text style={styles.providerMarkText}>{provider.mark}</Text></View>
        <View style={styles.providerNameWrap}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.providerArea}>{provider.area}</Text>
        </View>
      </View>
      <View style={styles.providerFacts}>
        <View style={styles.providerFact}>
          <Text style={styles.factLabel}>DISTANCE · SAMPLE</Text>
          <Text style={styles.factValue}>{provider.distance}</Text>
        </View>
        <View style={styles.factDivider} />
        <View style={styles.providerFact}>
          <Text style={styles.factLabel}>ETA · SAMPLE</Text>
          <Text style={styles.factValue}>{provider.eta}</Text>
        </View>
      </View>
      <View style={styles.providerBottom}>
        <Text style={styles.availabilityText}>{provider.availability}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${provider.name}`} onPress={onOpen} style={styles.viewProfileButton}>
          <Text style={styles.viewProfileText}>View profile</Text>
          <Text style={styles.viewProfileArrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualArea, setManualArea] = useState('');
  const [activeArea, setActiveArea] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider>(SAMPLE_PROVIDERS[0]);
  const [callPreview, setCallPreview] = useState('');
  const [requestStatus, setRequestStatus] = useState<'waiting' | 'cancelled'>('waiting');
  const [displayName, setDisplayName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [coverageArea, setCoverageArea] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [listingPreview, setListingPreview] = useState(false);

  const providers = useMemo(() => providersFor(activeArea), [activeArea]);

  const goHome = () => {
    setPage('home');
    setCallPreview('');
    setNotice('');
  };

  const showResults = (area: string) => {
    const trimmed = area.trim();
    if (!trimmed) {
      setNotice('Enter an area or landmark to see fictional sample mechanics.');
      setManualOpen(true);
      return;
    }
    setActiveArea(trimmed);
    setNotice('');
    setPage('results');
  };

  const requestOneTimeLocation = async () => {
    setNotice('');
    setLocationState('requesting');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationState('denied');
        setManualOpen(true);
        setNotice('Location was not allowed. Enter an area instead; no location is needed for this demo.');
        return;
      }
      // This single foreground fix is deliberately not read, stored, logged or sent anywhere.
      await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      setLocationState('checked');
      setActiveArea('Central demo zone');
      setPage('results');
    } catch {
      setLocationState('denied');
      setManualOpen(true);
      setNotice('Location could not be checked. Enter an area instead; no location is needed for this demo.');
    }
  };

  const chooseProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setCallPreview('');
    setPage('profile');
  };

  const validateSignup = () => {
    const next: Record<string, string> = {};
    if (displayName.trim().length < 2) next.name = 'Enter at least two characters.';
    if (contactNumber.replace(/\D/g, '').length < 10) next.phone = 'Enter 10 fictional digits for this preview.';
    if (coverageArea.trim().length < 2) next.area = 'Enter a sample area.';
    setSignupErrors(next);
    setListingPreview(Object.keys(next).length === 0);
  };

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.homeHero}>
        <Eyebrow>MOTORCYCLE PUNCTURE HELP</Eyebrow>
        <Text style={styles.homeTitle}>Flat tyre?{ '\n' }Find a mechanic.</Text>
        <Text style={styles.homeSubtitle}>Get puncture help nearby.</Text>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationIcon}><View style={styles.locationRing} /><View style={styles.locationPoint} /></View>
        <View style={styles.locationCopy}>
          <Text style={styles.locationTitle}>One-time location check</Text>
          <Text style={styles.locationBody}>Only after you tap: your device checks once. The fix is discarded, never saved or sent.</Text>
        </View>
      </View>

      <Button
        label={locationState === 'requesting' ? 'Checking location…' : 'Find puncture help'}
        accessibilityLabel="Find puncture help using one-time location consent"
        onPress={requestOneTimeLocation}
        disabled={locationState === 'requesting'}
      />
      <Pressable accessibilityRole="button" onPress={() => { setManualOpen((open) => !open); setNotice(''); }} style={styles.manualLink}>
        <Text style={styles.manualLinkText}>{manualOpen ? 'Close area entry' : 'Enter an area or landmark instead'}</Text>
        <Text style={styles.manualLinkArrow}>{manualOpen ? '−' : '＋'}</Text>
      </Pressable>

      {notice ? <Notice tone={locationState === 'denied' ? 'alert' : 'info'}>{notice}</Notice> : null}
      {manualOpen ? (
        <View style={styles.manualPanel}>
          <Field
            label="Area or landmark"
            value={manualArea}
            onChangeText={(value) => { setManualArea(value); setNotice(''); }}
            placeholder="Central demo zone"
          />
          <Text style={styles.fieldHelp}>Use a fictional sample area to continue.</Text>
          <Button label="Show sample mechanics" variant="secondary" onPress={() => showResults(manualArea)} />
        </View>
      ) : null}

      <View style={styles.homeBottom}>
        <Text style={styles.demoFootnote}>Sample listings and estimates are fictional, not live.</Text>
        <Pressable accessibilityRole="button" onPress={() => { setPage('signup'); setSignupErrors({}); setListingPreview(false); }} style={styles.signupLink}>
          <Text style={styles.signupLinkText}>Mechanic? Create a sample listing</Text>
          <Text style={styles.signupArrow}>›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderResults = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" onPress={goHome} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>BACK</Text>
      </Pressable>
      <View style={styles.resultsHeading}>
        <Eyebrow color="muted">SAMPLE AREA</Eyebrow>
        <Text style={styles.screenTitle}>Nearby mechanics</Text>
        <Text style={styles.areaName} numberOfLines={1}>{activeArea}</Text>
      </View>
      <Notice>Fictional listings only. Distances, availability and ETAs are not real or location-matched.</Notice>
      {providers.length > 0 ? (
        <View style={styles.resultsList}>
          {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} onOpen={() => chooseProvider(provider)} />)}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyMark}><View style={styles.emptyMarkRing} /><View style={styles.emptyMarkSlash} /></View>
          <Eyebrow color="muted">DEMO SEARCH</Eyebrow>
          <Text style={styles.emptyTitle}>No sample mechanics here.</Text>
          <Text style={styles.emptyBody}>This fictional demo has no listing for “{activeArea}”. This does not describe real-world coverage.</Text>
          <Button label="Change area" variant="dark" onPress={() => { setManualArea(activeArea); setManualOpen(true); setPage('home'); }} />
        </View>
      )}
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" onPress={() => setPage('results')} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>NEARBY MECHANICS</Text>
      </Pressable>
      <View style={styles.profileHero}>
        <View style={styles.profileMark}><Text style={styles.profileMarkText}>{selectedProvider.mark}</Text></View>
        <Eyebrow color="lime">SAMPLE MECHANIC</Eyebrow>
        <Text style={styles.profileName}>{selectedProvider.name}</Text>
        <Text style={styles.profileArea}>{selectedProvider.area}</Text>
      </View>
      <View style={styles.profileAvailability}>
        <View style={styles.availabilityDot} />
        <View style={styles.availabilityCopy}>
          <Text style={styles.availabilityLabel}>AVAILABILITY · FICTIONAL</Text>
          <Text style={styles.availabilityValue}>{selectedProvider.availability}</Text>
        </View>
      </View>
      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatLabel}>DISTANCE · SAMPLE</Text>
          <Text style={styles.profileStatValue}>{selectedProvider.distance}</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={styles.profileStatLabel}>ARRIVAL · SAMPLE</Text>
          <Text style={styles.profileStatValue}>{selectedProvider.eta}</Text>
        </View>
      </View>
      <View style={styles.punctureOnlyCard}>
        <Text style={styles.punctureIcon}>+</Text>
        <View style={styles.punctureCopy}>
          <Text style={styles.punctureTitle}>Motorcycle puncture help</Text>
          <Text style={styles.punctureSub}>Single-purpose sample listing</Text>
        </View>
      </View>
      {callPreview ? <Notice tone="success">{callPreview}</Notice> : null}
      <View style={styles.profileActions}>
        <Button label="Request puncture help" onPress={() => { setRequestStatus('waiting'); setPage('request'); }} />
        <Button label="Call mechanic · demo" variant="secondary" onPress={() => setCallPreview('Call preview only. No number was dialled and no contact was made.')} />
      </View>
      <Text style={styles.profileDisclaimer}>No real mechanic is available through this demo.</Text>
    </ScrollView>
  );

  const renderRequest = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Pressable accessibilityRole="button" onPress={() => setPage('profile')} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>MECHANIC PROFILE</Text>
      </Pressable>
      <View style={styles.requestHeading}>
        <Eyebrow color="blue">REQUEST PREVIEW · DEMO ONLY</Eyebrow>
        <Text style={styles.screenTitle}>No request was sent.</Text>
        <Text style={styles.requestSubtitle}>This short status is simulated on this screen.</Text>
      </View>
      <View style={styles.requestCard}>
        <View style={styles.requestStatusRow}>
          <View style={[styles.requestStatusDot, requestStatus === 'cancelled' && styles.requestStatusDotOff]} />
          <View style={styles.requestStatusCopy}>
            <Text style={styles.requestStatusLabel}>SAMPLE STATUS</Text>
            <Text style={styles.requestStatusValue}>{requestStatus === 'waiting' ? 'Waiting for a reply · simulated' : 'Cancelled · preview only'}</Text>
          </View>
        </View>
        <View style={styles.requestDivider} />
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>PUNCTURE HELP</Text><Text style={styles.summaryValue}>Motorcycle</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>MECHANIC</Text><Text style={styles.summaryValue}>{selectedProvider.name}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>SAMPLE AREA</Text><Text style={styles.summaryValue}>{activeArea}</Text></View>
      </View>
      <Notice tone={requestStatus === 'cancelled' ? 'success' : 'info'}>
        {requestStatus === 'waiting'
          ? 'Nothing was shared. No call, message, booking or location was sent.'
          : 'Preview cancelled locally. Nothing was sent or shared.'}
      </Notice>
      {requestStatus === 'waiting' ? (
        <Button label="Cancel request preview" variant="dark" onPress={() => setRequestStatus('cancelled')} />
      ) : (
        <Button label="Back to nearby mechanics" onPress={() => setPage('results')} />
      )}
      <Text style={styles.requestDisclaimer}>All names, areas, statuses and estimates in this demo are fictional.</Text>
    </ScrollView>
  );

  const renderSignup = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" onPress={goHome} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>BACK TO RIDER HELP</Text>
      </Pressable>
      <View style={styles.signupHeading}>
        <Eyebrow color="blue">MECHANIC LISTING · DEMO</Eyebrow>
        <Text style={styles.screenTitle}>Create a sample listing</Text>
        <Text style={styles.signupIntro}>One shared listing form for puncture mechanics.</Text>
      </View>
      <Notice tone="alert">Use fictional details only. This preview is not saved, registered or sent.</Notice>
      <View style={styles.signupForm}>
        <Field
          label="Name riders will see"
          value={displayName}
          onChangeText={(value) => { setDisplayName(value); setListingPreview(false); }}
          placeholder="Sample Mechanic 08"
          error={signupErrors.name}
        />
        <Field
          label="Contact number · fictional"
          value={contactNumber}
          onChangeText={(value) => { setContactNumber(value); setListingPreview(false); }}
          placeholder="000 000 0000"
          keyboardType="phone-pad"
          error={signupErrors.phone}
        />
        <Field
          label="Sample coverage area"
          value={coverageArea}
          onChangeText={(value) => { setCoverageArea(value); setListingPreview(false); }}
          placeholder="Central demo zone"
          error={signupErrors.area}
        />
        <Button label="Preview sample listing" onPress={validateSignup} />
      </View>
      {listingPreview ? (
        <View style={styles.listingPreview}>
          <Eyebrow color="blue">PREVIEW ONLY</Eyebrow>
          <Text style={styles.listingPreviewName}>{displayName}</Text>
          <Text style={styles.listingPreviewArea}>{coverageArea}</Text>
          <Text style={styles.listingPreviewNote}>No listing created. Your sample contact number was not sent or saved.</Text>
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <View style={styles.appBackground}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <Header onHome={goHome} />
        <KeyboardAvoidingView style={styles.pageContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {page === 'home' ? renderHome() : null}
          {page === 'results' ? renderResults() : null}
          {page === 'profile' ? renderProfile() : null}
          {page === 'request' ? renderRequest() : null}
          {page === 'signup' ? renderSignup() : null}
        </KeyboardAvoidingView>
        <View style={styles.footer}><Text style={styles.footerText}>FICTIONAL DATA · NO LIVE SERVICE</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appBackground: { flex: 1, alignItems: 'center', backgroundColor: '#E8ECF2' },
  appShell: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: C.paper, overflow: 'hidden' },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line },
  brandLockup: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandWheel: { position: 'absolute', width: 21, height: 21, borderWidth: 3, borderColor: C.white, borderRadius: 12, left: 6, top: 7 },
  brandHub: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: C.lime, left: 14, top: 15 },
  brandSlash: { position: 'absolute', width: 18, height: 4, borderRadius: 2, backgroundColor: C.lime, transform: [{ rotate: '-42deg' }], right: 0, top: 17 },
  brandName: { color: C.ink, fontSize: 15, fontWeight: '900', letterSpacing: 1.15 },
  brandTagline: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 2 },
  demoBadge: { minHeight: 30, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 7 },
  demoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.lime },
  demoBadgeText: { color: C.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  pageContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 14 },
  homeHero: { paddingTop: 4, paddingBottom: 6, gap: 8 },
  eyebrow: { color: C.blueDeep, fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1.25 },
  eyebrowMuted: { color: C.muted, letterSpacing: 1.05 },
  eyebrowLime: { color: C.lime, letterSpacing: 1.05 },
  homeTitle: { color: C.ink, fontSize: 37, lineHeight: 41, fontWeight: '900', letterSpacing: -1.15 },
  homeSubtitle: { color: C.inkSoft, fontSize: 17, lineHeight: 23, fontWeight: '600' },
  locationCard: { minHeight: 106, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 15 },
  locationIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.softBlue, alignItems: 'center', justifyContent: 'center' },
  locationRing: { width: 18, height: 18, borderWidth: 2, borderColor: C.blueDeep, borderRadius: 10 },
  locationPoint: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: C.blueDeep },
  locationCopy: { flex: 1, gap: 4 },
  locationTitle: { color: C.ink, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  locationBody: { color: C.muted, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  button: { minHeight: 56, borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  buttonPrimary: { backgroundColor: C.blue },
  buttonSecondary: { backgroundColor: C.white, borderColor: C.line },
  buttonDark: { backgroundColor: C.ink },
  buttonDisabled: { opacity: 0.58 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  buttonText: { fontSize: 16, lineHeight: 21, fontWeight: '800', textAlign: 'center' },
  buttonTextPrimary: { color: C.white },
  buttonTextSecondary: { color: C.ink },
  buttonTextDark: { color: C.white },
  manualLink: { minHeight: 48, marginTop: -5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  manualLinkText: { color: C.blueDeep, fontSize: 14, fontWeight: '800' },
  manualLinkArrow: { color: C.blueDeep, fontSize: 17, lineHeight: 20, fontWeight: '700' },
  notice: { minHeight: 50, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 12, backgroundColor: C.softBlue, borderWidth: 1, borderColor: '#D8DFFD' },
  noticeAlert: { backgroundColor: C.alertBg, borderColor: '#F2CFC7' },
  noticeSuccess: { backgroundColor: C.successBg, borderColor: '#CDE9DA' },
  noticeDot: { width: 8, height: 8, marginTop: 4, borderRadius: 4, backgroundColor: C.blueDeep },
  noticeDotAlert: { backgroundColor: C.alert },
  noticeDotSuccess: { backgroundColor: C.success },
  noticeText: { flex: 1, color: C.inkSoft, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  manualPanel: { padding: 14, gap: 10, borderWidth: 1, borderColor: C.line, borderRadius: 14, backgroundColor: C.white },
  fieldWrap: { gap: 6 },
  fieldLabel: { color: C.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  input: { minHeight: 54, paddingHorizontal: 13, color: C.ink, fontSize: 16, borderWidth: 1, borderColor: '#BAC3D1', borderRadius: 11, backgroundColor: C.white },
  inputError: { borderColor: C.alert },
  fieldHelp: { color: C.muted, fontSize: 11, lineHeight: 16 },
  errorText: { color: C.alert, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  homeBottom: { paddingTop: 4, alignItems: 'center', gap: 4 },
  demoFootnote: { color: C.muted, fontSize: 11, lineHeight: 15, textAlign: 'center' },
  signupLink: { minHeight: 48, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  signupLinkText: { color: C.blueDeep, fontSize: 13, fontWeight: '800' },
  signupArrow: { color: C.blueDeep, fontSize: 20, lineHeight: 22, fontWeight: '800' },
  footer: { minHeight: 34, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  footerText: { color: C.muted, fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: 1 },
  backButton: { minHeight: 48, alignSelf: 'flex-start', marginLeft: -7, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { color: C.blueDeep, fontSize: 27, lineHeight: 30, fontWeight: '600' },
  backText: { color: C.blueDeep, fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 0.8 },
  resultsHeading: { gap: 5 },
  screenTitle: { color: C.ink, fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: -0.7 },
  areaName: { color: C.muted, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  resultsList: { gap: 12 },
  providerCard: { padding: 14, borderRadius: 15, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, gap: 12 },
  providerTop: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  providerMark: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  providerMarkText: { color: C.lime, fontSize: 14, fontWeight: '900' },
  providerNameWrap: { flex: 1, gap: 3 },
  providerName: { color: C.ink, fontSize: 16, lineHeight: 20, fontWeight: '900' },
  providerArea: { color: C.muted, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  providerFacts: { minHeight: 49, paddingVertical: 9, flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  providerFact: { flex: 1, justifyContent: 'center', gap: 2 },
  factLabel: { color: C.muted, fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 0.7 },
  factValue: { color: C.ink, fontSize: 15, lineHeight: 19, fontWeight: '800' },
  factDivider: { width: 1, marginHorizontal: 12, backgroundColor: C.line },
  providerBottom: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  availabilityText: { flex: 1, color: C.success, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  viewProfileButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingLeft: 8 },
  viewProfileText: { color: C.blueDeep, fontSize: 12, fontWeight: '900' },
  viewProfileArrow: { color: C.blueDeep, fontSize: 21, lineHeight: 24, fontWeight: '700' },
  emptyCard: { padding: 17, gap: 11, alignItems: 'flex-start', borderRadius: 15, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  emptyMark: { width: 43, height: 43, borderRadius: 13, backgroundColor: C.softBlue, alignItems: 'center', justifyContent: 'center' },
  emptyMarkRing: { width: 19, height: 19, borderWidth: 2, borderColor: C.blueDeep, borderRadius: 11 },
  emptyMarkSlash: { position: 'absolute', width: 25, height: 3, borderRadius: 2, backgroundColor: C.blueDeep, transform: [{ rotate: '-45deg' }] },
  emptyTitle: { color: C.ink, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  emptyBody: { color: C.muted, fontSize: 13, lineHeight: 19 },
  profileHero: { minHeight: 230, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 18, backgroundColor: C.ink },
  profileMark: { width: 66, height: 66, marginBottom: 3, borderRadius: 20, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  profileMarkText: { color: C.ink, fontSize: 22, fontWeight: '900' },
  profileName: { color: C.white, fontSize: 25, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  profileArea: { color: '#E0E5F0', fontSize: 14, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  profileAvailability: { minHeight: 72, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  availabilityDot: { width: 10, height: 10, borderRadius: 6, backgroundColor: C.success },
  availabilityCopy: { flex: 1, gap: 4 },
  availabilityLabel: { color: C.muted, fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 0.8 },
  availabilityValue: { color: C.ink, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  profileStats: { minHeight: 72, padding: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  profileStat: { flex: 1, gap: 5 },
  profileStatLabel: { color: C.muted, fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 0.6 },
  profileStatValue: { color: C.ink, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  profileStatDivider: { width: 1, height: 36, marginHorizontal: 13, backgroundColor: C.line },
  punctureOnlyCard: { minHeight: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, backgroundColor: C.softBlue },
  punctureIcon: { width: 33, height: 33, borderRadius: 11, backgroundColor: C.blue, color: C.white, fontSize: 24, lineHeight: 31, fontWeight: '700', textAlign: 'center', overflow: 'hidden' },
  punctureCopy: { gap: 3 },
  punctureTitle: { color: C.ink, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  punctureSub: { color: C.muted, fontSize: 11, lineHeight: 15, fontWeight: '600' },
  profileActions: { gap: 10 },
  profileDisclaimer: { color: C.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  requestHeading: { gap: 7, paddingTop: 5, paddingBottom: 3 },
  requestSubtitle: { color: C.muted, fontSize: 14, lineHeight: 20 },
  requestCard: { padding: 16, gap: 13, borderRadius: 15, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  requestStatusRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  requestStatusDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: C.blue },
  requestStatusDotOff: { backgroundColor: C.muted },
  requestStatusCopy: { flex: 1, gap: 4 },
  requestStatusLabel: { color: C.muted, fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 0.8 },
  requestStatusValue: { color: C.ink, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  requestDivider: { height: 1, backgroundColor: C.line },
  summaryRow: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { color: C.muted, fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: 0.6 },
  summaryValue: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'right' },
  requestDisclaimer: { color: C.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  signupHeading: { gap: 6, paddingBottom: 2 },
  signupIntro: { color: C.muted, fontSize: 14, lineHeight: 20 },
  signupForm: { padding: 15, gap: 15, borderRadius: 15, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  listingPreview: { padding: 16, gap: 6, borderRadius: 15, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  listingPreviewName: { color: C.ink, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  listingPreviewArea: { color: C.muted, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  listingPreviewNote: { marginTop: 5, color: C.muted, fontSize: 11, lineHeight: 16 },
});
