import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CoordinatorProfile,
  CoordinatorRole,
  DutyStatus,
  UILanguage,
} from '../types';
import { tr } from '../lib/i18n';
import {
  getActiveCoordinatorProfile,
  registerCoordinatorAccount,
  requestCoordinatorPasswordReset,
  signInCoordinatorWithCredentials,
  signInCoordinatorWithGoogle,
  signOutCoordinator,
  updateActiveCoordinatorProfile,
} from '../lib/firebase';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Shield,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

interface CoordinatorAuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register' | 'profile';
  lang: UILanguage;
  firebaseUser: User | null;
  activeProfile: CoordinatorProfile | null;
  onClose: () => void;
  onProfileChange: (profile: CoordinatorProfile | null) => void;
}

const DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

const DISTRICT_LABELS: Record<
  string,
  { en: string; si: string; ta: string; code: string; province: string }
> = {
  Ampara: {
    en: 'Ampara',
    si: 'අම්පාර (Ampara)',
    ta: 'அம்பாறை (Ampara)',
    code: 'AMP',
    province: 'Eastern',
  },
  Anuradhapura: {
    en: 'Anuradhapura',
    si: 'අනුරාධපුර (Anuradhapura)',
    ta: 'அனுராதபுரம் (Anuradhapura)',
    code: 'ANU',
    province: 'North Central',
  },
  Badulla: {
    en: 'Badulla',
    si: 'බදුල්ල (Badulla)',
    ta: 'பதுளை (Badulla)',
    code: 'BAD',
    province: 'Uva',
  },
  Batticaloa: {
    en: 'Batticaloa',
    si: 'මඩකලපුව (Batticaloa)',
    ta: 'மட்டக்களப்பு (Batticaloa)',
    code: 'BAT',
    province: 'Eastern',
  },
  Colombo: {
    en: 'Colombo',
    si: 'කොළඹ (Colombo)',
    ta: 'கொழும்பு (Colombo)',
    code: 'CMB',
    province: 'Western',
  },
  Galle: {
    en: 'Galle',
    si: 'ගාල්ල (Galle)',
    ta: 'காலி (Galle)',
    code: 'GAL',
    province: 'Southern',
  },
  Gampaha: {
    en: 'Gampaha',
    si: 'ගම්පහ (Gampaha)',
    ta: 'கம்பஹா (Gampaha)',
    code: 'GAM',
    province: 'Western',
  },
  Hambantota: {
    en: 'Hambantota',
    si: 'හම්බන්තොට (Hambantota)',
    ta: 'ஹம்பாந்தோட்டை (Hambantota)',
    code: 'HAM',
    province: 'Southern',
  },
  Jaffna: {
    en: 'Jaffna',
    si: 'යාපනය (Jaffna)',
    ta: 'யாழ்ப்பாணம் (Jaffna)',
    code: 'JAF',
    province: 'Northern',
  },
  Kalutara: {
    en: 'Kalutara',
    si: 'කළුතර (Kalutara)',
    ta: 'களுத்துறை (Kalutara)',
    code: 'KAL',
    province: 'Western',
  },
  Kandy: {
    en: 'Kandy',
    si: 'මහනුවර (Kandy)',
    ta: 'கண்டி (Kandy)',
    code: 'KAN',
    province: 'Central',
  },
  Kegalle: {
    en: 'Kegalle',
    si: 'කෑගල්ල (Kegalle)',
    ta: 'கேகாலை (Kegalle)',
    code: 'KEG',
    province: 'Sabaragamuwa',
  },
  Kilinochchi: {
    en: 'Kilinochchi',
    si: 'කිලිනොච්චිය (Kilinochchi)',
    ta: 'கிளிநொச்சி (Kilinochchi)',
    code: 'KIL',
    province: 'Northern',
  },
  Kurunegala: {
    en: 'Kurunegala',
    si: 'කුරුණෑගල (Kurunegala)',
    ta: 'குருநாகல் (Kurunegala)',
    code: 'KUR',
    province: 'North Western',
  },
  Mannar: {
    en: 'Mannar',
    si: 'මන්නාරම (Mannar)',
    ta: 'மன்னார் (Mannar)',
    code: 'MAN',
    province: 'Northern',
  },
  Matale: {
    en: 'Matale',
    si: 'මාතලේ (Matale)',
    ta: 'மாத்தளை (Matale)',
    code: 'MTL',
    province: 'Central',
  },
  Matara: {
    en: 'Matara',
    si: 'මාතර (Matara)',
    ta: 'மாத்தறை (Matara)',
    code: 'MTR',
    province: 'Southern',
  },
  Monaragala: {
    en: 'Monaragala',
    si: 'මොණරාගල (Monaragala)',
    ta: 'மொனராகலை (Monaragala)',
    code: 'MON',
    province: 'Uva',
  },
  Mullaitivu: {
    en: 'Mullaitivu',
    si: 'මුලතිව් (Mullaitivu)',
    ta: 'முல்லைத்தீவு (Mullaitivu)',
    code: 'MUL',
    province: 'Northern',
  },
  'Nuwara Eliya': {
    en: 'Nuwara Eliya',
    si: 'නුවරඑළිය (Nuwara Eliya)',
    ta: 'நுவரெலியா (Nuwara Eliya)',
    code: 'NUW',
    province: 'Central',
  },
  Polonnaruwa: {
    en: 'Polonnaruwa',
    si: 'පොළොන්නරුව (Polonnaruwa)',
    ta: 'பொலன்னறுவை (Polonnaruwa)',
    code: 'POL',
    province: 'North Central',
  },
  Puttalam: {
    en: 'Puttalam',
    si: 'පුත්තලම (Puttalam)',
    ta: 'புத்தளம் (Puttalam)',
    code: 'PUT',
    province: 'North Western',
  },
  Ratnapura: {
    en: 'Ratnapura',
    si: 'රත්නපුර (Ratnapura)',
    ta: 'இரத்தினபுரி (Ratnapura)',
    code: 'RAT',
    province: 'Sabaragamuwa',
  },
  Trincomalee: {
    en: 'Trincomalee',
    si: 'ත්‍රිකුණාමලය (Trincomalee)',
    ta: 'திருகோணமலை (Trincomalee)',
    code: 'TRI',
    province: 'Eastern',
  },
  Vavuniya: {
    en: 'Vavuniya',
    si: 'වවුනියාව (Vavuniya)',
    ta: 'வவுனியா (Vavuniya)',
    code: 'VAV',
    province: 'Northern',
  },
};

const DIVISIONS_BY_DISTRICT: Record<string, string[]> = {
  Ampara: [
    'Ampara DS',
    'Akkaraipattu DS',
    'Addalaichenai DS',
    'Alayadiwembu DS',
    'Damana DS',
    'Dehiattakandiya DS',
    'Kalmunai DS',
    'Karaitivu DS',
    'Lahugala DS',
    'Mahaoya DS',
    'Ninthavur DS',
    'Padiyathalawa DS',
    'Pottuvil DS',
    'Sammanturai DS',
    'Thirukkovil DS',
    'Uhana DS',
  ],
  Anuradhapura: [
    'Anuradhapura Nuwaragam Palatha East DS',
    'Nuwaragam Palatha Central DS',
    'Galenbindunuwewa DS',
    'Galnewa DS',
    'Horowpothana DS',
    'Ipalogama DS',
    'Kahatagasdigiliya DS',
    'Kebithigollewa DS',
    'Kekirawa DS',
    'Medawachchiya DS',
    'Mihintale DS',
    'Nochchiyagama DS',
    'Padaviya DS',
    'Rajanganaya DS',
    'Rambewa DS',
    'Thalawa DS',
    'Thambuttegama DS',
  ],
  Badulla: [
    'Passara DS',
    'Badulla DS',
    'Bandarawela DS',
    'Ella DS',
    'Haldummulla DS',
    'Hali-Ela DS',
    'Haputale DS',
    'Kandaketiya DS',
    'Lunugala DS',
    'Mahiyanganaya DS',
    'Meegahakivula DS',
    'Rideemaliyadda DS',
    'Soranathota DS',
    'Uva-Paranagama DS',
    'Welimada DS',
  ],
  Batticaloa: [
    'Manmunai North (Batticaloa) DS',
    'Eravur Pattu DS',
    'Eravur Town DS',
    'Kattankudy DS',
    'Koralai Pattu (Valachchenai) DS',
    'Koralai Pattu North (Vaharai) DS',
    'Manmunai Pattu (Araipattai) DS',
    'Manmunai South & Eruvil Pattu DS',
    'Manmunai Southwest DS',
    'Manmunai West DS',
    'Porativu Pattu DS',
  ],
  Colombo: [
    'Colombo DS',
    'Dehiwala DS',
    'Homagama DS',
    'Kaduwela DS',
    'Kesbewa DS',
    'Kolonnawa DS',
    'Kotte (Sri Jayawardenepura) DS',
    'Maharagama DS',
    'Moratuwa DS',
    'Padukka DS',
    'Ratmalana DS',
    'Seethawaka (Avissawella) DS',
    'Thimbirigasyaya DS',
  ],
  Galle: [
    'Galle Four Gravets DS',
    'Akmeemana DS',
    'Ambalangoda DS',
    'Baddegama DS',
    'Balapitiya DS',
    'Bentota DS',
    'Bope-Poddala DS',
    'Elpitiya DS',
    'Habaraduwa DS',
    'Hikkaduwa DS',
    'Imaduwa DS',
    'Karandeniya DS',
    'Nagoda DS',
    'Neluwa DS',
    'Niyagama DS',
    'Thawalama DS',
    'Welivitiya-Divithura DS',
    'Yakkalamulla DS',
  ],
  Gampaha: [
    'Gampaha DS',
    'Attanagalla DS',
    'Biyagama DS',
    'Divulapitiya DS',
    'Dompe DS',
    'Ja-Ela DS',
    'Katana DS',
    'Kelaniya DS',
    'Mahara DS',
    'Minuwangoda DS',
    'Mirigama DS',
    'Negombo DS',
    'Wattala DS',
  ],
  Hambantota: [
    'Hambantota DS',
    'Ambalantota DS',
    'Angunakolapelessa DS',
    'Beliatta DS',
    'Katuwana DS',
    'Lunugamvehera DS',
    'Okewela DS',
    'Sooriyawewa DS',
    'Tangalle DS',
    'Thissamaharama DS',
    'Walasmulla DS',
    'Weeraketiya DS',
  ],
  Jaffna: [
    'Jaffna DS',
    'Nallur DS',
    'Chankanai (Valikamam West) DS',
    'Chavakachcheri (Thenmaradchi) DS',
    'Delft DS',
    'Karainagar DS',
    'Kayts (Island North) DS',
    'Kopay (Valikamam East) DS',
    'Maruthankerney (Vadamaradchi East) DS',
    'Point Pedro (Vadamaradchi North) DS',
    'Sandilipay (Valikamam South-West) DS',
    'Tellippalai (Valikamam North) DS',
    'Uduvil (Valikamam South) DS',
    'Velanai (Island South) DS',
  ],
  Kalutara: [
    'Kalutara DS',
    'Agalawatta DS',
    'Bandaragama DS',
    'Beruwala DS',
    'Bulathsinhala DS',
    'Dodangoda DS',
    'Horana DS',
    'Ingiriya DS',
    'Madurawela DS',
    'Matugama DS',
    'Millaniya DS',
    'Palindanuwara DS',
    'Panadura DS',
    'Walallavita DS',
  ],
  Kandy: [
    'Kandy Four Gravets & Gangawata Korale DS',
    'Akurana DS',
    'Delthota DS',
    'Doluwa DS',
    'Ganga Ihala Korale (Kurunduwatta) DS',
    'Harispattuwa DS',
    'Hatharaliyadda DS',
    'Kundasale DS',
    'Medadumbara DS',
    'Minipe DS',
    'Panvila DS',
    'Pasbage Korale (Nawalapitiya) DS',
    'Pathadumbara DS',
    'Pathahewaheta DS',
    'Poojapitiya DS',
    'Thumpane DS',
    'Udadumbara DS',
    'Udapalatha (Gampola) DS',
    'Udunuwara DS',
    'Yatinuwara DS',
  ],
  Kegalle: [
    'Kegalle DS',
    'Aranayaka DS',
    'Bulathkohupitiya DS',
    'Dehiovita DS',
    'Deraniyagala DS',
    'Galigamuwa DS',
    'Mawanella DS',
    'Rambukkana DS',
    'Ruwanwella DS',
    'Warakapola DS',
    'Yatiyanthota DS',
  ],
  Kilinochchi: [
    'Karachchi (Kilinochchi) DS',
    'Kandavalai DS',
    'Pachchilaipalli DS',
    'Poonakary DS',
  ],
  Kurunegala: [
    'Kurunegala DS',
    'Alawwa DS',
    'Bingiriya DS',
    'Galgamuwa DS',
    'Giriulla / Pannala DS',
    'Ibbagamuwa DS',
    'Kuliyapitiya East DS',
    'Kuliyapitiya West DS',
    'Maho DS',
    'Mawathagama DS',
    'Narammala DS',
    'Nikaweratiya DS',
    'Panduwasnuwara DS',
    'Polgahawela DS',
    'Polpithigama DS',
    'Rasnayakapura DS',
    'Rideegama DS',
    'Wariyapola DS',
  ],
  Mannar: [
    'Mannar Town DS',
    'Madhu DS',
    'Manthai West DS',
    'Musali DS',
    'Nanaddan DS',
  ],
  Matale: [
    'Matale DS',
    'Ambanganga Korale DS',
    'Dambulla DS',
    'Galewela DS',
    'Laggala-Pallegama DS',
    'Naula DS',
    'Pallepola DS',
    'Rattota DS',
    'Ukuwela DS',
    'Wilgamuwa DS',
    'Yatawatta DS',
  ],
  Matara: [
    'Matara Four Gravets DS',
    'Akuressa DS',
    'Athuraliya DS',
    'Devinuwara DS',
    'Dickwella DS',
    'Hakmana DS',
    'Kamburupitiya DS',
    'Kirinda Puhulwella DS',
    'Kotapola DS',
    'Malimbada DS',
    'Mulatiyana DS',
    'Pasgoda DS',
    'Pitabeddara DS',
    'Thihagoda DS',
    'Weligama DS',
    'Welipitiya DS',
  ],
  Monaragala: [
    'Monaragala DS',
    'Badalkumbura DS',
    'Bibile DS',
    'Buttala DS',
    'Katharagama DS',
    'Madulla DS',
    'Medagama DS',
    'Sevanagala DS',
    'Siyambalanduwa DS',
    'Thanamalvila DS',
    'Wellawaya DS',
  ],
  Mullaitivu: [
    'Maritimepattu (Mullaitivu) DS',
    'Manthai East (Pandiyankulam) DS',
    'Oddusuddan DS',
    'Puthukkudiyiruppu DS',
    'Thunukkai DS',
    'Welioya DS',
  ],
  'Nuwara Eliya': [
    'Nuwara Eliya DS',
    'Ambagamuwa (Ginigathhena) DS',
    'Hanguranketha DS',
    'Kothmale East DS',
    'Kothmale West DS',
    'Maskeliya DS',
    'Norwood DS',
    'Thalawakelle DS',
    'Walapane DS',
    'Nildandahinna DS',
  ],
  Polonnaruwa: [
    'Thamankaduwa (Polonnaruwa) DS',
    'Dimbulagala DS',
    'Elahera DS',
    'Hingurakgoda DS',
    'Lankapura DS',
    'Medirigiriya DS',
    'Welikanda DS',
  ],
  Puttalam: [
    'Puttalam DS',
    'Anamaduwa DS',
    'Arachchikattuwa DS',
    'Chilaw DS',
    'Dankotuwa DS',
    'Kalpitiya DS',
    'Karuwalagaswewa DS',
    'Madampe DS',
    'Mahakumbukkadawala DS',
    'Mahawewa DS',
    'Mundel DS',
    'Nattandiya DS',
    'Nawagattegama DS',
    'Pallama DS',
    'Vanathavilluwa DS',
    'Wennappuwa DS',
  ],
  Ratnapura: [
    'Ratnapura DS',
    'Ayagama DS',
    'Balangoda DS',
    'Eheliyagoda DS',
    'Elapatha DS',
    'Embilipitiya DS',
    'Godakawela DS',
    'Imbulpe DS',
    'Kahawatta DS',
    'Kalawana DS',
    'Kiriella DS',
    'Kolonna DS',
    'Kuruwita DS',
    'Nivitigala DS',
    'Opanayaka DS',
    'Pelmadulla DS',
    'Weligepola DS',
  ],
  Trincomalee: [
    'Trincomalee Town and Gravets DS',
    'Gomarankadawala DS',
    'Kantalai DS',
    'Kinniya DS',
    'Kuchchaveli DS',
    'Morawewa DS',
    'Muttur DS',
    'Padavi Sri Pura DS',
    'Seruvila DS',
    'Thampalakamam DS',
    'Verugal (Echchilampattu) DS',
  ],
  Vavuniya: [
    'Vavuniya DS',
    'Vavuniya North (Nedunkeni) DS',
    'Vavuniya South DS',
    'Vengalacheddikulam DS',
  ],
};

export const CoordinatorAuthModal: React.FC<CoordinatorAuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  lang,
  firebaseUser,
  activeProfile,
  onClose,
  onProfileChange,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'profile'>(initialTab);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration & Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<CoordinatorRole>('DS Coordinator');
  const [district, setDistrict] = useState('Badulla');
  const [division, setDivision] = useState('Passara DS');
  const [badgeNumber, setBadgeNumber] = useState('DMC-BAD-108');
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>('on_duty');

  // Feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (activeProfile) {
        setTab(initialTab === 'register' ? 'register' : 'profile');
        setFullName(activeProfile.fullName);
        setEmail(activeProfile.email);
        setRole(activeProfile.role);
        setDistrict(activeProfile.district || 'Badulla');
        setDivision(activeProfile.division || 'Passara DS');
        setBadgeNumber(activeProfile.badgeNumber || 'DMC-BAD-042');
        setDutyStatus(activeProfile.dutyStatus || 'on_duty');
      } else {
        setTab(initialTab === 'profile' ? 'login' : initialTab);
      }
    }
  }, [isOpen, initialTab, activeProfile]);

  if (!isOpen) return null;

  const availableDivisions = DIVISIONS_BY_DISTRICT[district] || ['Passara DS'];

  const getDistrictDisplayLabel = (d: string) => {
    const info = DISTRICT_LABELS[d];
    if (!info) return d;
    const localName =
      lang === 'si' ? info.si : lang === 'ta' ? info.ta : info.en;
    return `${localName} · ${info.province} (DMC-${info.code})`;
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const divs = DIVISIONS_BY_DISTRICT[newDistrict] || [`${newDistrict} DS`];
    setDivision(divs[0]);
    const code =
      DISTRICT_LABELS[newDistrict]?.code ||
      newDistrict.slice(0, 3).toUpperCase();
    setBadgeNumber((prev) => {
      const match = prev.match(/^DMC-[A-Z]{3}-(\d{3,4})$/);
      if (match) {
        return `DMC-${code}-${match[1]}`;
      }
      return prev;
    });
  };

  const generateBadgeCode = () => {
    const prefix =
      DISTRICT_LABELS[district]?.code || district.slice(0, 3).toUpperCase();
    const num = Math.floor(100 + Math.random() * 899);
    setBadgeNumber(`DMC-${prefix}-${num}`);
  };

  const getPasswordStrength = (pwd: string): {
    score: number;
    label: string;
    color: string;
  } => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 1;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) {
      return {
        score: 1,
        label: tr(lang, 'Weak', 'දුර්වලයි', 'பலவீனமானது'),
        color: 'bg-red-500',
      };
    }
    if (score === 2) {
      return {
        score: 2,
        label: tr(lang, 'Fair', 'සාමාන්‍යයි', 'சாதாரணமானது'),
        color: 'bg-amber-500',
      };
    }
    return {
      score: 3,
      label: tr(lang, 'Strong', 'ශක්තිමත්', 'வலுவானது'),
      color: 'bg-emerald-600',
    };
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const user = await signInCoordinatorWithGoogle();
      const profile = getActiveCoordinatorProfile() || {
        uid: user.uid,
        fullName: user.displayName || 'Divisional Coordinator',
        email: user.email || '',
        role: 'DS Coordinator',
        division: 'Passara DS',
        district: 'Badulla',
        badgeNumber: `DMC-${user.uid.slice(0, 6).toUpperCase()}`,
        dutyStatus: 'on_duty',
        authMethod: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onProfileChange(profile);
      setSuccessMsg(
        tr(
          lang,
          `Signed in via Google Cloud SSO as ${profile.fullName} (${profile.badgeNumber}).`,
          `Google Cloud SSO මගින් ${profile.fullName} (${profile.badgeNumber}) ලෙස පිවිසියා.`,
          `Google Cloud SSO மூலம் ${profile.fullName} (${profile.badgeNumber}) ஆக உள்நுழைந்தீர்கள்.`
        )
      );
      setTab('profile');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      if (!raw.includes('popup-closed-by-user')) {
        setErrorMsg(
          tr(
            lang,
            `Google SSO failed: ${raw}`,
            `Google පිවිසුම අසාර්ථක විය: ${raw}`,
            `Google உள்நுழைவு தோல்வியடைந்தது: ${raw}`
          )
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg(
        tr(
          lang,
          'Please enter both your Official Email / Badge ID and Password.',
          'කරුණාකර ඔබගේ නිල විද්‍යුත් තැපෑල / නිල අංකය සහ මුරපදය ඇතුළත් කරන්න.',
          'உங்கள் அதிகாரப்பூர்வ மின்னஞ்சல் / அடையாள எண் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.'
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { profile } = await signInCoordinatorWithCredentials(
        loginIdentifier,
        loginPassword
      );
      onProfileChange(profile);
      setSuccessMsg(
        tr(
          lang,
          `Welcome back, ${profile.fullName} (${profile.division}).`,
          `නැවත සාදරයෙන් පිළිගනිමු, ${profile.fullName} (${profile.division}).`,
          `மீண்டும் வருக, ${profile.fullName} (${profile.division}).`
        )
      );
      setTab('profile');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim() || !badgeNumber.trim()) {
      setErrorMsg(
        tr(
          lang,
          'Full Name, Official Email, and Service Badge ID are required.',
          'සම්පූර්ණ නම, නිල විද්‍යුත් තැපෑල සහ නිල හැඳුනුම්පත් අංකය අනිවාර්ය වේ.',
          'முழு பெயர், அதிகாரப்பூர்வ மின்னஞ்சல் மற்றும் அடையாள எண் அவசியம்.'
        )
      );
      return;
    }

    if (password.length < 6) {
      setErrorMsg(
        tr(
          lang,
          'Password must be at least 6 characters long.',
          'මුරපදය අවම වශයෙන් අකුරු 6 ක් විය යුතුය.',
          'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.'
        )
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        tr(
          lang,
          'Passwords do not match. Please verify.',
          'මුරපද දෙක නොගැලපේ. කරුණාකර පරීක්ෂා කරන්න.',
          'கடவுச்சொற்கள் பொருந்தவில்லை. சரிபார்க்கவும்.'
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { profile, cloudSynced } = await registerCoordinatorAccount({
        email,
        password,
        fullName,
        role,
        division,
        district,
        badgeNumber,
        dutyStatus,
      });
      onProfileChange(profile);
      setSuccessMsg(
        cloudSynced
          ? tr(
              lang,
              `Officer ${profile.fullName} (${profile.badgeNumber}) registered and synced to Firestore Cloud.`,
              `නිලධාරී ${profile.fullName} (${profile.badgeNumber}) ලියාපදිංචි කර Firestore Cloud වෙත සමමුහුර්ත කරන ලදී.`,
              `அதிகாரி ${profile.fullName} (${profile.badgeNumber}) பதிவு செய்யப்பட்டு Firestore Cloud உடன் ஒத்திசைக்கப்பட்டது.`
            )
          : tr(
              lang,
              `Officer ${profile.fullName} (${profile.badgeNumber}) registered in Division Registry & active for duty.`,
              `නිලධාරී ${profile.fullName} (${profile.badgeNumber}) කොට්ඨාස ලේඛනයේ ලියාපදිංචි කර රාජකාරි සඳහා සක්‍රීය කරන ලදී.`,
              `அதிகாரி ${profile.fullName} (${profile.badgeNumber}) பிரிவு பதிவேட்டில் பதிவு செய்யப்பட்டு பணிக்கு செயல்படுத்தப்பட்டார்.`
            )
      );
      setTab('profile');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const updated = await updateActiveCoordinatorProfile({
        fullName,
        role,
        division,
        district,
        badgeNumber,
        dutyStatus,
      });
      onProfileChange(updated);
      setSuccessMsg(
        tr(
          lang,
          'Coordinator profile updated and persisted.',
          'සම්බන්ධීකාරක නිලධාරී තොරතුරු යාවත්කාලීන කරන ලදී.',
          'ஒருங்கிணைப்பாளர் சுயவிவரம் புதுப்பிக்கப்பட்டு சேமிக்கப்பட்டது.'
        )
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!loginIdentifier.includes('@')) {
      setErrorMsg(
        tr(
          lang,
          'Enter your official email address in the identifier field first to request a password reset.',
          'මුරපදය යළි පිහිටුවීමට පළමුව ඔබගේ නිල විද්‍යුත් තැපැල් ලිපිනය ඇතුළත් කරන්න.',
          'கடவுச்சொல்லை மீட்டமைக்க முதலில் உங்கள் அதிகாரப்பூர்வ மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
        )
      );
      return;
    }
    try {
      await requestCoordinatorPasswordReset(loginIdentifier);
      setSuccessMsg(
        tr(
          lang,
          `Password reset instructions dispatched for ${loginIdentifier}.`,
          `${loginIdentifier} සඳහා මුරපදය යළි පිහිටුවීමේ උපදෙස් යොමු කරන ලදී.`,
          `${loginIdentifier} க்கான கடவுச்சொல் மீட்டமைப்பு வழிமுறைகள் அனுப்பப்பட்டன.`
        )
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await signOutCoordinator();
      onProfileChange(null);
      setTab('login');
      setSuccessMsg(
        tr(
          lang,
          'Signed out of Coordinator session.',
          'සම්බන්ධීකාරක සැසියෙන් ඉවත් විය.',
          'ஒருங்கிணைப்பாளர் அமர்விலிருந்து வெளியேறினீர்கள்.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setLoginIdentifier('DMC-BAD-042');
    setLoginPassword('Passara2026!');
    setErrorMsg(null);
  };

  const pwdStrength = getPasswordStrength(password);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden my-auto">
        {/* Top Authority Banner */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B2A6F] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-blue-200 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                {tr(
                  lang,
                  'Divisional Secretariat Officer Portal',
                  'ප්‍රාදේශීය ලේකම් කාර්යාලයීය නිලධාරී පිවිසුම',
                  'பிரதேச செயலக அதிகாரி நுழைவாயில்'
                )}
              </h2>
              <p className="text-[11px] text-blue-200">
                {tr(
                  lang,
                  'DisaLink AI · Verified Human-in-the-Loop Identity & Cloud Sync',
                  'DisaLink AI · තහවුරු කළ නිලධාරී අනන්‍යතාවය සහ Cloud සමමුහුර්තකරණය',
                  'DisaLink AI · சரிபார்க்கப்பட்ட அதிகாரி அடையாளம் மற்றும் Cloud ஒத்திசைவு'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              tab === 'login'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{tr(lang, 'Sign In', 'පිවිසෙන්න', 'உள்நுழைக')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              tab === 'register'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>
              {tr(lang, 'Register Officer', 'ලියාපදිංචි වන්න', 'அதிகாரி பதிவு')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('profile');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              tab === 'profile'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>
              {tr(lang, 'Officer Profile', 'නිලධාරී ගිණුම', 'சுயவிவரம்')}
            </span>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Alerts */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {tab === 'login' && (
            <div className="space-y-4">
              {/* Primary Google Cloud SSO Button */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B2A6F] flex items-center gap-1.5">
                    <Cloud className="h-4 w-4" />
                    {tr(
                      lang,
                      'Official Cloud SSO (Firestore Sync Enabled)',
                      'නිල Cloud පිවිසුම (Firestore සමමුහුර්තකරණය සහිතයි)',
                      'அதிகாரப்பூர்வ Cloud SSO (Firestore ஒத்திசைவு)'
                    )}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                    RECOMMENDED
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-2.5 rounded-md bg-[#0B2A6F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#081f54] disabled:opacity-50 transition-colors shadow-xs"
                >
                  <LogIn className="h-4 w-4" />
                  <span>
                    {tr(
                      lang,
                      'Continue with Google Workspace / Account',
                      'Google ගිණුම මගින් පිවිසෙන්න',
                      'Google கணக்கு மூலம் உள்நுழையவும்'
                    )}
                  </span>
                </button>
              </div>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-3 shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {tr(
                    lang,
                    'Or Division Credential Login',
                    'හෝ නිලධාරී මුරපද පිවිසුම',
                    'அல்லது அதிகாரி கடவுச்சொல் உள்நுழைவு'
                  )}
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleCredentialLogin} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {tr(
                        lang,
                        'Official Email or Service Badge ID',
                        'නිල විද්‍යුත් තැපෑල හෝ හැඳුනුම්පත් අංකය',
                        'அதிகாரப்பூர்வ மின்னஞ்சல் அல்லது அடையாள எண்'
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={fillDemoCredentials}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B2A6F] hover:underline"
                    >
                      <Sparkles className="h-3 w-3" />
                      {tr(
                        lang,
                        'Fill Passara DS Demo Officer',
                        'ආදර්ශ නිලධාරී දත්ත පුරවන්න',
                        'மாதிரி அதிகாரி விவரங்களை நிரப்புக'
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="DMC-BAD-042 or coord.passara@dmc.gov.lk"
                      className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {tr(lang, 'Password', 'මුරපදය', 'கடவுச்சொல்')}
                    </label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-[11px] font-medium text-slate-500 hover:text-[#0B2A6F]"
                    >
                      {tr(
                        lang,
                        'Forgot password?',
                        'මුරපදය අමතකද?',
                        'கடவுச்சொல் மறந்ததா?'
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-9 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>
                    {tr(
                      lang,
                      'Sign In with Officer Credentials',
                      'නිලධාරී මුරපදයෙන් පිවිසෙන්න',
                      'அதிகாரி சான்றுகளுடன் உள்நுழைக'
                    )}
                  </span>
                </button>
              </form>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 flex items-center justify-between">
                <span>
                  {tr(
                    lang,
                    'New Divisional Secretariat or GN Officer?',
                    'නව ප්‍රාදේශීය ලේකම් හෝ ග්‍රාම නිලධාරියෙක්ද?',
                    'புதிய பிரதேச செயலக அல்லது கிராம சேவகர் அதிகாரியா?'
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="font-semibold text-[#0B2A6F] hover:underline"
                >
                  {tr(
                    lang,
                    'Register Officer Account →',
                    'නව ගිණුමක් ලියාපදිංචි කරන්න →',
                    'புதிய கணக்கை பதிவு செய்க →'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER NEW OFFICER */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr(
                      lang,
                      'Full Official Name *',
                      'සම්පූර්ණ නිල නම *',
                      'முழு அதிகாரப்பூர்வ பெயர் *'
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., H. M. S. Bandara"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr(
                      lang,
                      'Official Email *',
                      'නිල විද්‍යුත් තැපෑල *',
                      'அதிகாரப்பூர்வ மின்னஞ்சல் *'
                    )}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@passara.ds.gov.lk"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr(
                      lang,
                      'Official Designation / Role',
                      'නිල තනතුර / භූමිකාව',
                      'அதிகாரப்பூர்வ பதவி'
                    )}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as CoordinatorRole)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  >
                    <option value="DS Coordinator">
                      {tr(
                        lang,
                        'DS Coordinator (Divisional Secretariat)',
                        'ප්‍රාදේශීය ලේකම් කාර්යාලයීය සම්බන්ධීකාරක',
                        'பிரதேச செயலக ஒருங்கிணைப்பாளர்'
                      )}
                    </option>
                    <option value="GN Officer">
                      {tr(
                        lang,
                        'Grama Niladhari (GN Officer)',
                        'ග්‍රාම නිලධාරී (GN Officer)',
                        'கிராம சேவகர் (GN Officer)'
                      )}
                    </option>
                    <option value="DMC Liaison">
                      {tr(
                        lang,
                        'DMC District Liaison Officer',
                        'ආපදා කළමනාකරණ මධ්‍යස්ථාන නිලධාරී',
                        'அனர்த்த முகாமைத்துவ நிலைய அதிகாரி'
                      )}
                    </option>
                    <option value="Field Relief Officer">
                      {tr(
                        lang,
                        'Field Relief & Triage Officer',
                        'ක්ෂේත්‍ර සහන සේවා නිලධාරී',
                        'கள நிவாரண அதிகாரி'
                      )}
                    </option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {tr(
                        lang,
                        'Service Badge ID *',
                        'නිල හැඳුනුම්පත් අංකය *',
                        'சேவை அடையாள எண் *'
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={generateBadgeCode}
                      className="text-[10px] font-semibold text-[#0B2A6F] hover:underline"
                    >
                      {tr(lang, 'Auto-ID', 'ස්වයංක්‍රීය අංකය', 'தானியங்கி எண்')}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="DMC-BAD-108"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr(
                      lang,
                      'Administrative District (All 25 Districts)',
                      'පරිපාලන දිස්ත්‍රික්කය (දිස්ත්‍රික්ක 25)',
                      'நிர்வாக மாவட்டம் (25 மாவட்டங்கள்)'
                    )}
                  </label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {getDistrictDisplayLabel(d)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr(
                      lang,
                      `Divisional Secretariat (${availableDivisions.length} DS Divisions)`,
                      `ප්‍රාදේශීය ලේකම් කොට්ඨාසය (${availableDivisions.length})`,
                      `பிரதேச செயலகப் பிரிவு (${availableDivisions.length})`
                    )}
                  </label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  >
                    {availableDivisions.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr(
                      lang,
                      'Create Password *',
                      'මුරපදයක් සාදන්න *',
                      'கடவுச்சொல்லை உருவாக்குக *'
                    )}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  />
                  {password && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full transition-all ${pwdStrength.color}`}
                          style={{ width: `${(pwdStrength.score / 3) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600">
                        {pwdStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr(
                      lang,
                      'Confirm Password *',
                      'මුරපදය තහවුරු කරන්න *',
                      'கடவுச்சொல்லை உறுதிப்படுத்துக *'
                    )}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tr(
                    lang,
                    'Initial Shift Status',
                    'මුල් රාජකාරි තත්ත්වය',
                    'தற்போதைய பணி நிலை'
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'on_duty',
                        label: tr(
                          lang,
                          'On Duty (Active)',
                          'රාජකාරියේ (සක්‍රීය)',
                          'பணியில் (செயலில்)'
                        ),
                      },
                      {
                        id: 'standby',
                        label: tr(
                          lang,
                          'Standby Shift',
                          'අතිරේක සූදානම්',
                          'காத்திருப்பு பணி'
                        ),
                      },
                      {
                        id: 'off_duty',
                        label: tr(
                          lang,
                          'Off Duty',
                          'රාජකාරියෙන් බැහැර',
                          'பணி ஓய்வு'
                        ),
                      },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDutyStatus(st.id)}
                      className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                        dutyStatus === st.id
                          ? 'border-[#0B2A6F] bg-blue-50 text-[#0B2A6F]'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0B2A6F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#081f54] disabled:opacity-50 transition-colors shadow-xs"
              >
                <UserPlus className="h-4 w-4" />
                <span>
                  {tr(
                    lang,
                    'Complete Officer Registration & Activate Session',
                    'නිලධාරී ලියාපදිංචිය සම්පූර්ණ කර සැසිය අරඹන්න',
                    'அதிகாரி பதிவை முடித்து அமர்வைத் தொடங்கவும்'
                  )}
                </span>
              </button>
            </form>
          )}

          {/* TAB 3: ACTIVE OFFICER PROFILE */}
          {tab === 'profile' && (
            <div className="space-y-4">
              {!activeProfile && !firebaseUser ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
                  <UserCheck className="mx-auto h-8 w-8 text-slate-400" />
                  <div className="text-xs font-semibold text-slate-800">
                    {tr(
                      lang,
                      'No Active Coordinator Signed In',
                      'සක්‍රීය සම්බන්ධීකාරක නිලධාරියෙකු පිවිස නැත',
                      'செயலில் உள்ள ஒருங்கிணைப்பாளர் எவரும் உள்நுழையவில்லை'
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    {tr(
                      lang,
                      'Sign in with Google Cloud SSO or your Division Officer credentials to tag ledger approvals and sync incident snapshots.',
                      'තීරණ ලෙජරයේ නිලධාරී අනන්‍යතාවය සටහන් කිරීමට සහ Cloud සමමුහුර්තකරණයට කරුණාකර පිවිසෙන්න.',
                      'முடிவுப் பதிவேட்டில் அதிகாரி அடையாளத்தை இணைக்கவும் Cloud ஒத்திசைவுக்கும் உள்நுழையவும்.'
                    )}
                  </p>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTab('login')}
                      className="rounded-md bg-[#0B2A6F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#081f54]"
                    >
                      {tr(lang, 'Go to Sign In', 'පිවිසුමට යන්න', 'உள்நுழையச் செல்க')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('register')}
                      className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {tr(
                        lang,
                        'Register Officer',
                        'ලියාපදිංචි වන්න',
                        'அதிகாரி பதிவு'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Verified Identity Card */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-sm font-bold text-slate-900">
                            {activeProfile?.fullName ||
                              firebaseUser?.displayName ||
                              'Divisional Coordinator'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {activeProfile?.email || firebaseUser?.email}
                        </div>
                      </div>
                      <span className="rounded border border-blue-300 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[#0B2A6F]">
                        {activeProfile?.badgeNumber || 'DMC-BAD-042'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                        <Building2 className="h-3 w-3 text-[#0B2A6F]" />
                        {activeProfile?.role || 'DS Coordinator'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium text-slate-700 border border-slate-200">
                        <MapPin className="h-3 w-3 text-[#0B2A6F]" />
                        {activeProfile?.division || 'Passara DS'},{' '}
                        {activeProfile?.district || 'Badulla'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${
                          firebaseUser
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <Cloud className="h-3 w-3" />
                        {firebaseUser
                          ? tr(
                              lang,
                              'Firestore Cloud Connected',
                              'Firestore Cloud සම්බන්ධිතයි',
                              'Firestore Cloud இணைக்கப்பட்டுள்ளது'
                            )
                          : tr(
                              lang,
                              'Local Division Session',
                              'ප්‍රාදේශීය නිලධාරී සැසිය',
                              'உள்ளூர் பிரிவு அமர்வு'
                            )}
                      </span>
                    </div>
                  </div>

                  {/* Edit Officer Details Form */}
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr(
                            lang,
                            'Full Official Name',
                            'සම්පූර්ණ නිල නම',
                            'முழு அதிகாரப்பூர்வ பெயர்'
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={120}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr(
                            lang,
                            'Service Badge ID',
                            'නිල හැඳුනුම්පත් අංකය',
                            'சேவை அடையாள எண்'
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={40}
                          value={badgeNumber}
                          onChange={(e) => setBadgeNumber(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr(lang, 'Role', 'තනතුර', 'பதவி')}
                        </label>
                        <select
                          value={role}
                          onChange={(e) =>
                            setRole(e.target.value as CoordinatorRole)
                          }
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          <option value="DS Coordinator">DS Coordinator</option>
                          <option value="GN Officer">GN Officer</option>
                          <option value="DMC Liaison">DMC Liaison</option>
                          <option value="Field Relief Officer">
                            Field Relief Officer
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr(
                            lang,
                            'District (25)',
                            'දිස්ත්‍රික්කය (25)',
                            'மாவட்டம் (25)'
                          )}
                        </label>
                        <select
                          value={district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          {DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {getDistrictDisplayLabel(d)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {tr(
                            lang,
                            'DS Division',
                            'ප්‍රා. ලේ. කොට්ඨාසය',
                            'பிரதேச செயலகம்'
                          )}
                        </label>
                        <select
                          value={division}
                          onChange={(e) => setDivision(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                        >
                          {availableDivisions.map((div) => (
                            <option key={div} value={div}>
                              {div}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {tr(
                          lang,
                          'Operational Shift Status',
                          'මෙහෙයුම් රාජකාරි තත්ත්වය',
                          'செயல்பாட்டு பணி நிலை'
                        )}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            {
                              id: 'on_duty',
                              label: tr(
                                lang,
                                'On Duty',
                                'රාජකාරියේ',
                                'பணியில்'
                              ),
                            },
                            {
                              id: 'standby',
                              label: tr(
                                lang,
                                'Standby',
                                'සූදානම්',
                                'காத்திருப்பு'
                              ),
                            },
                            {
                              id: 'off_duty',
                              label: tr(
                                lang,
                                'Off Duty',
                                'නිවාඩු',
                                'பணி ஓய்வு'
                              ),
                            },
                          ] as const
                        ).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setDutyStatus(st.id)}
                            className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                              dutyStatus === st.id
                                ? 'border-[#0B2A6F] bg-blue-50 text-[#0B2A6F]'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>
                          {tr(lang, 'Sign Out', 'ඉවත් වන්න', 'வெளியேறு')}
                        </span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#081f54] disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {tr(
                            lang,
                            'Save Officer Profile',
                            'තොරතුරු සුරකින්න',
                            'சுயவிவரத்தை சேமிக்கவும்'
                          )}
                        </span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
