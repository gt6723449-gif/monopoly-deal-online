import monopolyGreenMan from "../../assets/monopoly-green-man.png";

export function SplashScreen() {
  return (
    <main className="splash-page" aria-label="Loading">
      <section className="splash-card">
        <img src={monopolyGreenMan} alt="" aria-hidden="true" />
        <div className="game-logo splash-logo">
          <span>MONOPOLY</span>
          <strong>DEAL</strong>
        </div>
      </section>
    </main>
  );
}
