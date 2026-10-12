import { useAppContext } from "../AppContext.jsx";

export default function HomePage() {
  const {
    displayCountry,
    getUserLocation,
    isArabic,
    locationMessage,
    selectedCountry,
    setShowCountries,
    userLocation,
  } = useAppContext();

  return (
    <section className="hero">
          <div className="hero-content">
            <p className="small-title">
              {selectedCountry
                ? isArabic
                  ? "وجهتك"
                  : "YOUR DESTINATION"
                : isArabic
                ? "اكتشف • استكشف • استمتع"
                : "DISCOVER • EXPLORE • ENJOY"}
            </p>

            <h1>
              {selectedCountry ? (
                <>
                  {isArabic
                    ? "يلا"
                    : "Let's"}

                  <br />

                  <span>
                    {isArabic
                      ? "نستكشف."
                      : "Explore."}
                  </span>
                </>
              ) : (
                <>
                  {isArabic
                    ? "استكشف."
                    : "Explore."}

                  <br />

                  <span>
                    {isArabic
                      ? "اكتشف."
                      : "Discover."}
                  </span>

                  <br />

                  {isArabic
                    ? "استمتع."
                    : "Enjoy."}
                </>
              )}
            </h1>

            <p className="description">
              {selectedCountry
                ? isArabic
                  ? `اكتشفي الأماكن والمطاعم والكافيهات والفعاليات والتجارب الحقيقية في ${displayCountry(
                      selectedCountry
                    )}.`
                  : "Discover real places, restaurants, cafés, events and experiences in " +
                    selectedCountry +
                    "."
                : isArabic
                ? "اكتشفي الأماكن الحقيقية من حولك. مطاعم، كافيهات، فعاليات، تسوق وتجارب مميزة."
                : "Find real places around you. Discover restaurants, cafés, events, shopping spots and amazing experiences."}
            </p>

            <div className="hero-buttons">
              <button
                className="primary-btn"
                onClick={() =>
                  setShowCountries(
                    true
                  )
                }
              >
                {selectedCountry
                  ? isArabic
                    ? "تغيير الدولة"
                    : "Change Country"
                  : isArabic
                  ? "استكشفي الآن"
                  : "Explore Now"}
              </button>

              <button
                className="secondary-btn"
                onClick={
                  getUserLocation
                }
              >
                📍{" "}
                {isArabic
                  ? "استخدمي موقعي"
                  : "Use My Location"}
              </button>
            </div>

            {locationMessage && (
              <div className="location-status">
                <span>
                  📍
                </span>

                <p>
                  {
                    locationMessage
                  }
                </p>
              </div>
            )}
          </div>

          <div className="hero-visual">
            <div className="visual-circle circle-one"></div>

            <div className="visual-circle circle-two"></div>

            <div className="visual-card">
              <div className="location-icon">
                📍
              </div>

              <h3>
                {displayCountry(
                  selectedCountry
                ) ||
                  (isArabic
                    ? "مغامرتك القادمة"
                    : "Your next adventure")}
              </h3>

              <p>
                {userLocation
                  ? isArabic
                    ? "موقعك جاهز."
                    : "Your location is ready."
                  : isArabic
                  ? "اكتشفي أماكن تستحق الزيارة."
                  : "Discover places worth visiting."}
              </p>
            </div>
          </div>
        </section>
  );
}
