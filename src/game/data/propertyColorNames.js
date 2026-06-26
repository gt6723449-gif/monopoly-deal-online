import { PROPERTY_SETS } from "./propertySets";

const PROPERTY_COLOR_NAMES = {
  en: {
    brown: "Brown",
    lightBlue: "Light Blue",
    pink: "Pink",
    orange: "Orange",
    red: "Red",
    yellow: "Yellow",
    green: "Green",
    darkBlue: "Dark Blue",
    railroad: "Railroad",
    utility: "Utility",
  },
  ar: {
    brown: "بني",
    lightBlue: "أزرق فاتح",
    pink: "زهري",
    orange: "برتقالي",
    red: "أحمر",
    yellow: "أصفر",
    green: "أخضر",
    darkBlue: "أزرق غامق",
    railroad: "السكة",
    utility: "الخدمات",
  },
};

export function getPropertyColorName(color, language = "en") {
  return (
    PROPERTY_COLOR_NAMES[language]?.[color] ||
    PROPERTY_COLOR_NAMES.en[color] ||
    PROPERTY_SETS[color]?.label ||
    color
  );
}
