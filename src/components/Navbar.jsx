import { useAppContext } from "../AppContext.jsx";
import yallaNakhrujLogo from "../assets/yalla-nakhruj-logo.jpeg";

export default function Navbar() {
  const {
    favorites,
    goHome,
    goPlaces,
    goToNavbarCategory,
    handleInstallApp,
    isAppInstalled,
    isArabic,
    openFavorites,
    outingStops,
    toggleLanguage,
    toggleOutingPlanner,
  } = useAppContext();

  return (
    <header className="navbar">
        <img
          src={yallaNakhrujLogo}
          alt="Yalla Nakhruj"
          className="logo-image"
        />

        <nav>
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goHome();
            }}
          >
            {isArabic
              ? "الرئيسية"
              : "Home"}
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goPlaces();
            }}
          >
            {isArabic
              ? "الأماكن"
              : "Places"}
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goToNavbarCategory(
                "Restaurants"
              );
            }}
          >
            {isArabic
              ? "مطاعم"
              : "Restaurants"}
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goToNavbarCategory(
                "Cafés"
              );
            }}
          >
            {isArabic
              ? "كافيهات"
              : "Cafés"}
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goToNavbarCategory(
                "Events"
              );
            }}
          >
            {isArabic
              ? "فعاليات"
              : "Events"}
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goToNavbarCategory(
                "Fashion"
              );
            }}
          >
            {isArabic
              ? "موضة"
              : "Fashion"}
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goToNavbarCategory(
                "Beauty"
              );
            }}
          >
            {isArabic
              ? "جمال"
              : "Beauty"}
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              openFavorites();
            }}
          >
            ♥ {isArabic ? "المفضلة" : "Favorites"} ({favorites.length})
          </a>
          <a
            href="#/outing"
            onClick={(event) => { event.preventDefault(); toggleOutingPlanner(); }}
          >
            🗺️ {isArabic ? "خطة خروجة" : "Outing plan"} ({outingStops.length})
          </a>
        </nav>

        <button
          className="language-btn"
          type="button"
          onClick={
            toggleLanguage
          }
        >
          {isArabic
            ? "EN"
            : "AR"}
        </button>
        {!isAppInstalled && (
          <button
            className="secondary-btn install-app-btn"
            type="button"
            onClick={handleInstallApp}
            title={isArabic ? "تثبيت يلا نخرج على جهازك" : "Install Yalla Nakhruj on your device"}
          >
            📲 {isArabic ? "ثبّتي التطبيق" : "Install app"}
          </button>
        )}
      </header>
  );
}
