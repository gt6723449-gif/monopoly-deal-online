import { useState } from "react";
import { t } from "../../i18n/translations";

const COUNTRIES = [
  { iso: "LB", name: "Lebanon", arName: "لبنان", code: "+961" },
  { iso: "SA", name: "Saudi Arabia", arName: "السعودية", code: "+966" },
  { iso: "AE", name: "United Arab Emirates", arName: "الإمارات", code: "+971" },
  { iso: "KW", name: "Kuwait", arName: "الكويت", code: "+965" },
  { iso: "QA", name: "Qatar", arName: "قطر", code: "+974" },
  { iso: "JO", name: "Jordan", arName: "الأردن", code: "+962" },
  { iso: "EG", name: "Egypt", arName: "مصر", code: "+20" },
  { iso: "IQ", name: "Iraq", arName: "العراق", code: "+964" },
  { iso: "TR", name: "Turkey", arName: "تركيا", code: "+90" },
];

export function WinnerClaimPage({ winner, amount, language, onPlayAgain }) {
  const [selectedCountryIso, setSelectedCountryIso] = useState("LB");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedCountry =
    COUNTRIES.find((country) => country.iso === selectedCountryIso) ||
    COUNTRIES[0];

  function getCountryName(country) {
    return language === "ar" ? country.arName : country.name;
  }

  function handlePhoneChange(event) {
    setPhoneNumber(event.target.value.replace(/[^0-9]/g, ""));
  }

  async function handleCollectGift(event) {
    event.preventDefault();

    if (!phoneNumber.trim()) {
      setPhoneError(true);
      return;
    }

    setPhoneError(false);
    setIsSaving(true);

    const data = {
      country: getCountryName(selectedCountry),
      phone: `${selectedCountry.code} ${phoneNumber}`,
      amount,
    };

    const body = new URLSearchParams({
      data: JSON.stringify(data),
    });

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

      if (!scriptUrl) {
        throw new Error("Missing VITE_GOOGLE_SCRIPT_URL");
      }

      await fetch(scriptUrl, {
        method: "POST",
        body,
        mode: "no-cors",
      });

      setSaved(true);
    } catch (error) {
      console.log("Sheet save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="winner-claim-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <section className="winner-claim-card">
        <h1>{t(language, "winnerCongratulations")}</h1>

        <p>
          <strong>{winner.name}</strong> {t(language, "winnerWonGame")}
        </p>

        <div className="claim-amount">{amount}</div>

        <form onSubmit={handleCollectGift}>
          <label>
            {t(language, "country")}
            <select
              value={selectedCountryIso}
              onChange={(event) => setSelectedCountryIso(event.target.value)}
            >
              {COUNTRIES.map((country) => (
                <option value={country.iso} key={country.iso}>
                  {getCountryName(country)} ({country.code})
                </option>
              ))}
            </select>
          </label>

          <label>
            {t(language, "whatsappPhone")}
            <div className="phone-row">
              <span>{selectedCountry.code}</span>
              <input
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder={t(language, "phonePlaceholder")}
                inputMode="numeric"
              />
            </div>
          </label>

          {phoneError && (
            <p className="claim-error">{t(language, "enterPhone")}</p>
          )}

          {saved && (
            <p className="claim-success">{t(language, "savedSuccessfully")}</p>
          )}

          <button type="submit" disabled={isSaving || saved}>
            {isSaving ? t(language, "saving") : t(language, "collectGift")}
          </button>

          <button type="button" onClick={onPlayAgain}>
            {t(language, "playAgain")}
          </button>
        </form>
      </section>
    </main>
  );
}