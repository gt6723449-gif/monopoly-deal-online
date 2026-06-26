import { useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { COUNTRIES } from "../../data/countries";
import { t } from "../../i18n/translations";

function getLocalizedCountryName(country, language) {
  if (typeof Intl === "undefined" || !Intl.DisplayNames) {
    return country.name;
  }

  try {
    return new Intl.DisplayNames([language], { type: "region" }).of(country.iso) || country.name;
  } catch {
    return country.name;
  }
}

function parseWhatsappNumber(phoneNumber, country) {
  const trimmedNumber = phoneNumber.trim();

  if (!trimmedNumber) {
    return null;
  }

  const normalizedNumber = trimmedNumber.startsWith("+")
    ? trimmedNumber
    : `+${country.dialCode}${trimmedNumber.replace(/\D/g, "")}`;

  try {
    const parsedNumber =
      parsePhoneNumberFromString(trimmedNumber, country.iso) ||
      parsePhoneNumberFromString(normalizedNumber);

    return parsedNumber?.isValid() ? parsedNumber : null;
  } catch {
    return null;
  }
}

function isValidWhatsappNumber(phoneNumber, country) {
  return Boolean(parseWhatsappNumber(phoneNumber, country));
}

export function WinnerClaimPage({
  winner,
  amount,
  language,
  onPlayAgain,
  isHumanWinner = true,
}) {
  const [selectedCountryIso, setSelectedCountryIso] = useState("LB");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedCountry =
    COUNTRIES.find((country) => country.iso === selectedCountryIso) ||
    COUNTRIES[0];
  const canSubmit =
    fullName.trim().length > 0 &&
    isValidWhatsappNumber(phoneNumber, selectedCountry);

  function getCountryName(country) {
    return getLocalizedCountryName(country, language);
  }

  function handlePhoneChange(event) {
    setPhoneNumber(event.target.value.replace(/[^\d+\s()-]/g, ""));
    setFormError("");
  }

  function handleCountryChange(event) {
    setSelectedCountryIso(event.target.value);
    setFormError("");
  }

  async function handleCollectGift(event) {
    event.preventDefault();

    if (!fullName.trim()) {
      setFormError(t(language, "enterFullName"));
      return;
    }

    if (!isValidWhatsappNumber(phoneNumber, selectedCountry)) {
      setFormError(t(language, "invalidPhone"));
      return;
    }

    const parsedPhoneNumber = parseWhatsappNumber(phoneNumber, selectedCountry);

    setFormError("");
    setIsSaving(true);

    const data = {
      name: fullName.trim(),
      fullName: fullName.trim(),
      country: getCountryName(selectedCountry),
      phone: parsedPhoneNumber.number,
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
        <h1>
          {isHumanWinner
            ? t(language, "winnerCongratulations")
            : t(language, "youLost")}
        </h1>

        {isHumanWinner ? (
          <p>
            <strong>{winner.name}</strong> {t(language, "winnerWonGame")}
          </p>
        ) : (
          <p>{t(language, "hardLuck")}</p>
        )}

        {isHumanWinner && <div className="claim-amount">{amount}</div>}

        {isHumanWinner ? (
          <form onSubmit={handleCollectGift}>
            <label>
              {t(language, "fullName")}
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setFormError("");
                }}
                placeholder={t(language, "fullName")}
                autoComplete="name"
                required
              />
            </label>

            <label>
              {t(language, "country")}
              <select value={selectedCountryIso} onChange={handleCountryChange}>
                {COUNTRIES.map((country) => (
                  <option value={country.iso} key={country.iso}>
                    {getCountryName(country)} (+{country.dialCode})
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t(language, "whatsappPhone")}
              <div className="phone-row">
                <span>+{selectedCountry.dialCode}</span>
                <input
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder={t(language, "phonePlaceholder")}
                  inputMode="tel"
                  autoComplete="tel-national"
                />
              </div>
            </label>

            {formError && <p className="claim-error">{formError}</p>}

            {saved && (
              <p className="claim-success">{t(language, "savedSuccessfully")}</p>
            )}

            <button type="submit" disabled={!canSubmit || isSaving || saved}>
              {isSaving ? t(language, "saving") : t(language, "collectGift")}
            </button>

            <button type="button" onClick={onPlayAgain}>
              {t(language, "playAgain")}
            </button>
          </form>
        ) : (
          <button type="button" onClick={onPlayAgain}>
            {t(language, "playAgain")}
          </button>
        )}
      </section>
    </main>
  );
}
