import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/common.json';
import hi from './locales/hi/common.json';
import bn from './locales/bn/common.json';
import ta from './locales/ta/common.json';
import te from './locales/te/common.json';
import mr from './locales/mr/common.json';
import gu from './locales/gu/common.json';
import kn from './locales/kn/common.json';
import ml from './locales/ml/common.json';
import pa from './locales/pa/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      hi: { common: hi },
      bn: { common: bn },
      ta: { common: ta },
      te: { common: te },
      mr: { common: mr },
      gu: { common: gu },
      kn: { common: kn },
      ml: { common: ml },
      pa: { common: pa },
    },
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
