import { useAppContext } from "../AppContext.jsx";

export default function PlaceDetailsModal() {
  const {
    addToOuting,
    categoryTitle,
    formatDistance,
    getCrowdEstimate,
    getDisplayPlaceName,
    getOpenStatus,
    getOpenStatusLabel,
    getPlaceImage,
    getPlaceRating,
    isArabic,
    isFavorite,
    isInOuting,
    openCrowdInfo,
    openDirections,
    removeOutingStop,
    savePlaceRating,
    selectedCategory,
    selectedPlace,
    setSelectedPlace,
    toggleFavorite,
  } = useAppContext();

  return (
    selectedPlace && (
        <div
          role="presentation"
          onClick={() =>
            setSelectedPlace(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(22, 14, 38, 0.72)",
            backdropFilter: "blur(5px)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="place-details-title"
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "30px",
              borderRadius: "24px",
              background: "#ffffff",
              color: "#29213a",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.28)",
              textAlign: isArabic ? "right" : "left",
            }}
          >
            <button
              type="button"
              aria-label={isArabic ? "إغلاق التفاصيل" : "Close details"}
              onClick={() =>
                setSelectedPlace(null)
              }
              style={{
                position: "absolute",
                top: "16px",
                insetInlineEnd: "16px",
                width: "40px",
                height: "40px",
                border: "none",
                borderRadius: "50%",
                background: "#f0e9ff",
                color: "#6c35de",
                fontSize: "26px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div style={{ position: "relative", margin: "2px 0 20px", borderRadius: "17px", overflow: "hidden", background: "#eee7ff" }}>
              <img
                src={getPlaceImage(selectedPlace)}
                alt={getDisplayPlaceName(selectedPlace) || (isArabic ? "صورة المكان" : "Place image")}
                onError={(event) => {
                  const image = event.currentTarget;
                  if (image.dataset.fallbackApplied === "yes") { image.style.display = "none"; return; }
                  image.dataset.fallbackApplied = "yes";
                  image.src = getPlaceImage({ ...selectedPlace, photoUrl: "" });
                  const caption = image.parentElement?.querySelector("[data-photo-caption]");
                  if (caption) caption.style.display = "inline-block";
                }}
                style={{ display: "block", width: "100%", height: "210px", objectFit: "cover" }}
              />
              <span data-photo-caption="true" style={{ display: selectedPlace.photoUrl ? "none" : "inline-block", position: "absolute", bottom: "10px", insetInlineStart: "10px", padding: "6px 9px", borderRadius: "8px", background: "rgba(28,19,43,.76)", color: "#fff", fontSize: "11px" }}>{isArabic ? "صورة توضيحية للفئة وليست صورة مؤكدة للمكان" : "Illustrative category image, not a verified venue photo"}</span>
            </div>
            {selectedPlace.photoSource && (
              <p style={{ margin: "-10px 0 14px", color: "#81758f", fontSize: "11px", lineHeight: 1.5 }}>
                {isArabic ? `مصدر الصورة: ${selectedPlace.photoSource}` : `Photo source: ${selectedPlace.photoSource}`}
                {selectedPlace.photoAttribution && (
                  <> · {isArabic ? "الاسم والترخيص" : "Credit and license"}: {selectedPlace.photoAttribution}</>
                )}
                {selectedPlace.photoAttributionUrl && (
                  <> · <a href={selectedPlace.photoAttributionUrl} target="_blank" rel="noreferrer">{isArabic ? "صفحة الصورة" : "Image page"}</a></>
                )}
              </p>
            )}
            <p
              style={{
                display: "inline-block",
                margin: "0 0 14px",
                padding: "7px 12px",
                borderRadius: "999px",
                background: "#f0e9ff",
                color: "#6c35de",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {categoryTitle(selectedPlace.category || selectedCategory)}
            </p>

            <h2
              id="place-details-title"
              style={{
                margin: "0 44px 22px 0",
                color: "#2b2040",
                fontSize: "28px",
                lineHeight: 1.35,
                overflowWrap: "anywhere",
              }}
            >
              {getDisplayPlaceName(selectedPlace)}
            </h2>

            <div
              style={{
                display: "grid",
                gap: "14px",
                marginBottom: "26px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "#faf8ff",
                  border: "1px solid #eee7ff",
                }}
              >
                <p
                  style={{
                    margin: "0 0 7px",
                    color: "#6c35de",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {isArabic ? "📍 العنوان" : "📍 Address"}
                </p>
                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.7,
                    overflowWrap: "anywhere",
                  }}
                >
                  {selectedPlace.address ||
                    (isArabic
                      ? "العنوان غير متاح حاليًا"
                      : "Address is not available right now")}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    borderRadius: "14px",
                    background: "#faf8ff",
                    border: "1px solid #eee7ff",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 7px",
                      color: "#6c35de",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {isArabic ? "نوع المكان" : "Place type"}
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    {selectedPlace.cuisine || categoryTitle(selectedPlace.category || selectedCategory)}
                  </p>
                </div>

                <div
                  style={{
                    padding: "15px",
                    borderRadius: "14px",
                    background: "#faf8ff",
                    border: "1px solid #eee7ff",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 7px",
                      color: "#6c35de",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {isArabic ? "المسافة منك" : "Distance from you"}
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.6, fontWeight: 700 }}>
                    {formatDistance(selectedPlace.distance)}
                  </p>
                </div>
              </div>

              <div style={{ padding: "17px", borderRadius: "15px", background: getCrowdEstimate(selectedPlace).background, border: `1px solid ${getCrowdEstimate(selectedPlace).color}33` }}>
                <strong style={{ display: "block", color: getCrowdEstimate(selectedPlace).color, marginBottom: "8px", fontSize: "14px" }}>
                  {getCrowdEstimate(selectedPlace).icon} {isArabic ? "الزحمة المتوقعة الآن" : "Estimated crowd right now"}
                </strong>
                <div style={{ color: getCrowdEstimate(selectedPlace).color, fontSize: "18px", fontWeight: 850, marginBottom: "7px" }}>
                  {getCrowdEstimate(selectedPlace).label}
                </div>
                <p style={{ margin: "0 0 12px", color: "#675777", fontSize: "12px", lineHeight: 1.7 }}>
                  {isArabic ? "ده تقدير عام حسب نوع المكان والساعة على جهازك، مش عدد أشخاص ولا بيانات مباشرة من المكان." : "This is a general estimate based on the place type and your device's local time—not a people count or live venue data."}
                </p>
                <button type="button" onClick={() => openCrowdInfo(selectedPlace)} style={{ width: "100%", border: "1px solid #e5d9fa", background: "#fff", color: "#5930b0", borderRadius: "10px", padding: "11px 13px", fontWeight: 750, cursor: "pointer" }}>
                  {isArabic ? "تحققي من الأوقات الشائعة على خرائط Google ↗" : "Check Popular Times on Google Maps ↗"}
                </button>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ padding: "14px 16px", borderRadius: "13px", background: "#faf8ff", border: "1px solid #eee7ff" }}>
                  <strong style={{ display: "block", color: "#6c35de", marginBottom: "6px", fontSize: "13px" }}>{isArabic ? "🕒 مواعيد العمل" : "🕒 Opening hours"}</strong>
                  <span style={{ lineHeight: 1.6, overflowWrap: "anywhere", color: selectedPlace.openingHours ? "#3c3150" : "#82798d" }}>{selectedPlace.openingHours || (isArabic ? "مواعيد العمل غير متاحة في بيانات المكان." : "Opening hours are not available in the place data.")}</span>
                  <p style={{ margin: "8px 0 0", fontSize: "12px", color: getOpenStatus(selectedPlace) === "open" ? "#216b4b" : getOpenStatus(selectedPlace) === "closed" ? "#a3223b" : "#82798d", fontWeight: 700 }}>{getOpenStatusLabel(selectedPlace)}</p>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "13px", background: "#faf8ff", border: "1px solid #eee7ff" }}>
                  <strong style={{ display: "block", color: "#6c35de", marginBottom: "6px", fontSize: "13px" }}>{isArabic ? "☎️ الهاتف" : "☎️ Phone"}</strong>
                  {selectedPlace.phone ? <a href={`tel:${selectedPlace.phone}`} onClick={(event) => event.stopPropagation()} style={{ color: "#5930b0", overflowWrap: "anywhere" }}>{selectedPlace.phone}</a> : <span style={{ color: "#82798d" }}>{isArabic ? "رقم الهاتف غير متاح في البيانات." : "Phone number is not available in the data."}</span>}
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "13px", background: "#faf8ff", border: "1px solid #eee7ff" }}>
                  <strong style={{ display: "block", color: "#6c35de", marginBottom: "6px", fontSize: "13px" }}>{isArabic ? "🌐 الموقع الإلكتروني" : "🌐 Website"}</strong>
                  {selectedPlace.website ? <a href={/^https?:\/\//i.test(selectedPlace.website) ? selectedPlace.website : `https://${selectedPlace.website}`} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} style={{ color: "#5930b0", overflowWrap: "anywhere" }}>{selectedPlace.website}</a> : <span style={{ color: "#82798d" }}>{isArabic ? "الموقع الإلكتروني غير متاح في البيانات." : "Website is not available in the data."}</span>}
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "13px", background: "#faf8ff", border: "1px solid #eee7ff" }}>
                  <strong style={{ display: "block", color: "#6c35de", marginBottom: "6px", fontSize: "13px" }}>{isArabic ? "✉️ البريد الإلكتروني" : "✉️ Email"}</strong>
                  {selectedPlace.email ? <a href={`mailto:${selectedPlace.email}`} onClick={(event) => event.stopPropagation()} style={{ color: "#5930b0", overflowWrap: "anywhere" }}>{selectedPlace.email}</a> : <span style={{ color: "#82798d" }}>{isArabic ? "البريد الإلكتروني غير متاح في البيانات." : "Email is not available in the data."}</span>}
                </div>
              </div>

              <div style={{ padding: "17px", borderRadius: "15px", background: "#faf8ff", border: "1px solid #eee7ff" }}>
                <strong style={{ display: "block", color: "#6c35de", marginBottom: "8px", fontSize: "14px" }}>{isArabic ? "⭐ قيّمي المكان" : "⭐ Rate this place"}</strong>
                <div role="group" aria-label={isArabic ? "تقييم المكان" : "Rate this place"} style={{ display: "flex", gap: "5px", direction: "ltr" }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" aria-label={isArabic ? `${rating} من 5 نجوم` : `${rating} out of 5 stars`} aria-pressed={getPlaceRating(selectedPlace) === rating} onClick={() => savePlaceRating(selectedPlace, rating)} style={{ border: 0, padding: "2px", background: "transparent", fontSize: "30px", color: rating <= getPlaceRating(selectedPlace) ? "#f4b400" : "#d9d2e5", cursor: "pointer" }}>★</button>
                  ))}
                </div>
                <p aria-live="polite" style={{ margin: "7px 0 0", fontSize: "13px", color: "#675777" }}>{getPlaceRating(selectedPlace) ? (isArabic ? `تقييمك المحفوظ ${getPlaceRating(selectedPlace)} من 5` : `Your saved rating: ${getPlaceRating(selectedPlace)} out of 5`) : (isArabic ? "اختاري تقييمك من نجمة إلى 5 نجوم." : "Choose a rating from one to five stars.")}</p>
              </div>
            </div>

            <button type="button" className="secondary-btn" onClick={() => toggleFavorite(selectedPlace)} style={{ width: "100%", marginBottom: "10px", border: "1px solid #e7dcff" }}>
              {isFavorite(selectedPlace) ? (isArabic ? "♥ إزالة من المفضلة" : "♥ Remove from favorites") : (isArabic ? "♡ إضافة إلى المفضلة" : "♡ Add to favorites")}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => isInOuting(selectedPlace) ? removeOutingStop(selectedPlace.id) : addToOuting(selectedPlace)}
              style={{ width: "100%", marginBottom: "10px", border: "1px solid #e7dcff" }}
            >
              {isInOuting(selectedPlace) ? (isArabic ? "✓ إزالة من خطة الخروجة" : "✓ Remove from outing") : (isArabic ? "+ إضافة لخطة الخروجة" : "+ Add to outing")}
            </button>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                openDirections(
                  selectedPlace.latitude,
                  selectedPlace.longitude
                )
              }
              style={{
                width: "100%",
                marginBottom: "10px",
              }}
            >
              📍 {isArabic ? "افتح الاتجاهات على الخريطة" : "Get directions on map"}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                setSelectedPlace(null)
              }
              style={{ width: "100%" }}
            >
              {isArabic ? "إغلاق التفاصيل" : "Close details"}
            </button>
          </section>
        </div>
      )
  );
}
