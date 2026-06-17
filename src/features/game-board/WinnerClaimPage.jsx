import { useState } from "react";

const COUNTRIES = [
    { iso: "LB", name: "Lebanon", code: "+961" },
    { iso: "SA", name: "Saudi Arabia", code: "+966" },
    { iso: "AE", name: "United Arab Emirates", code: "+971" },
    { iso: "KW", name: "Kuwait", code: "+965" },
    { iso: "QA", name: "Qatar", code: "+974" },
    { iso: "JO", name: "Jordan", code: "+962" },
    { iso: "EG", name: "Egypt", code: "+20" },
    { iso: "IQ", name: "Iraq", code: "+964" },
    { iso: "TR", name: "Turkey", code: "+90" },
];

export function WinnerClaimPage({ winner, amount, onPlayAgain }) {
    const [selectedCountryIso, setSelectedCountryIso] = useState("LB");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneError, setPhoneError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const selectedCountry =
        COUNTRIES.find((country) => country.iso === selectedCountryIso) ||
        COUNTRIES[0];

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
            country: selectedCountry.name,
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
        <main className="winner-claim-page">
            <section className="winner-claim-card">
                <h1>Congratulations!</h1>

                <p>
                    <strong>{winner.name}</strong> won the game.
                </p>

                <div className="claim-amount">{amount}</div>

                <form onSubmit={handleCollectGift}>
                    <label>
                        Country
                        <select
                            value={selectedCountryIso}
                            onChange={(event) => setSelectedCountryIso(event.target.value)}
                        >
                            {COUNTRIES.map((country) => (
                                <option value={country.iso} key={country.iso}>
                                    {country.name} ({country.code})
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        WhatsApp phone number
                        <div className="phone-row">
                            <span>{selectedCountry.code}</span>
                            <input
                                value={phoneNumber}
                                onChange={handlePhoneChange}
                                placeholder="Phone number"
                                inputMode="numeric"
                            />
                        </div>
                    </label>

                    {phoneError && (
                        <p className="claim-error">Please enter your phone number.</p>
                    )}

                    {saved && <p className="claim-success">Saved successfully.</p>}

                    <button type="submit" disabled={isSaving || saved}>
                        {isSaving ? "Saving..." : "Collect Gift"}
                    </button>

                    <button type="button" onClick={onPlayAgain}>
                        Play Again
                    </button>
                </form>
            </section>
        </main>
    );
}