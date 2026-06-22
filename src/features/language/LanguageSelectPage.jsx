export function LanguageSelectPage({ onSelectLanguage }) {
  return (
    <main className="language-page">
      <section className="language-card">
        <div className="game-logo">
          <span>MONOPOLY</span>
          <strong>DEAL</strong>
        </div>

        <h1>
          Select your language
          <span lang="ar" dir="rtl">اختر لغتك</span>
        </h1>
        <p>Choose your preferred language to start.</p>

        <div className="language-buttons">
          <button type="button" onClick={() => onSelectLanguage("en")}>
            English
          </button>

          <button type="button" lang="ar" dir="rtl" onClick={() => onSelectLanguage("ar")}>
            العربية
          </button>
        </div>
      </section>
    </main>
  );
}
