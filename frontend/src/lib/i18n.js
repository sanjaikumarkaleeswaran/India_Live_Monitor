import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "dashboard.title": "Command Center",
      "dashboard.welcome": "National Dashboard",
      "dashboard.sos": "SOS Emergency",
      "nav.dashboard": "Dashboard",
      "nav.liveMap": "Live Map",
      "nav.analytics": "Analytics",
      "weather.title": "National Weather",
      "aqi.title": "Air Quality",
      "fuel.title": "Fuel Prices",
    }
  },
  hi: {
    translation: {
      "dashboard.title": "कमांड सेंटर",
      "dashboard.welcome": "राष्ट्रीय डैशबोर्ड",
      "dashboard.sos": "एसओएस आपातकाल",
      "nav.dashboard": "डैशबोर्ड",
      "nav.liveMap": "लाइव मैप",
      "nav.analytics": "एनालिटिक्स",
      "weather.title": "राष्ट्रीय मौसम",
      "aqi.title": "वायु गुणवत्ता",
      "fuel.title": "ईंधन की कीमतें",
    }
  },
  ta: {
    translation: {
      "dashboard.title": "கட்டளை மையம்",
      "dashboard.welcome": "தேசிய டாஷ்போர்டு",
      "dashboard.sos": "அவசரநிலை",
      "nav.dashboard": "டாஷ்போர்டு",
      "nav.liveMap": "நேரடி வரைபடம்",
      "nav.analytics": "பகுப்பாய்வு",
      "weather.title": "தேசிய வானிலை",
      "aqi.title": "காற்று தரம்",
      "fuel.title": "எரிபொருள் விலை",
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
