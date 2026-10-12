import { useAppContext } from "../AppContext.jsx";

export default function CountryPickerModal() {
  const {
    chooseCountry,
    countries,
    displayCountry,
    isArabic,
    navigateTo,
    selectedCountry,
    setShowCountries,
    showCountries,
  } = useAppContext();

  return (
    showCountries && (
        <div className="country-overlay">
          <div className="country-modal">
            <button
              className="close-country"
              onClick={() => {
                setShowCountries(false);
                if (!selectedCountry) navigateTo("home");
              }}
            >
              ×
            </button>

            <p className="modal-small-title">
              {isArabic
                ? "يلا بينا"
                : "LET'S GO"}
            </p>

            <h2>
              {isArabic
                ? "إلى أين تريدين الذهاب؟"
                : "Where do you want to go?"}
            </h2>

            <p className="modal-description">
              {isArabic
                ? "اختاري دولة وابدئي في اكتشاف أماكن حقيقية."
                : "Choose a country and start discovering real places."}
            </p>

            <div className="country-list">
              {countries.map(
                (country) => (
                  <button
                    type="button"
                    className="country-option"
                    key={
                      country
                    }
                    onClick={() =>
                      chooseCountry(
                        country
                      )
                    }
                  >
                    <span>
                      {displayCountry(
                        country
                      )}
                    </span>

                    <span>
                      →
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )
  );
}
