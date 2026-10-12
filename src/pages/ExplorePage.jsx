import { useAppContext } from "../AppContext.jsx";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import MapController from "../components/MapController.jsx";

export default function ExplorePage() {
  const {
    addToOuting,
    availablePlaceTypes,
    categories,
    categoryDescription,
    categoryName,
    categoryTitle,
    clearSearch,
    displayCountry,
    distanceFilter,
    filteredPlaces,
    findBeautyPlaces,
    findCafes,
    findEvents,
    findFashionPlaces,
    findPicnicPlaces,
    findRestaurants,
    formatDistance,
    getCrowdEstimate,
    getDisplayPlaceName,
    getOpenStatus,
    getOpenStatusLabel,
    getPlaceImage,
    getPlaceRating,
    getUserLocation,
    handleSearchKeyDown,
    hasSearched,
    isArabic,
    isFavorite,
    isInOuting,
    isRealPlacesCategory,
    loadingPlaces,
    nearbyFilterTerm,
    openCrowdInfo,
    openDirections,
    openNowOnly,
    openPlaceDetails,
    places,
    placesToDisplay,
    removeOutingStop,
    savePlaceRating,
    searchLoading,
    searchNearestPlace,
    searchResults,
    searchTerm,
    selectCategory,
    selectedCategory,
    selectedCountry,
    setDistanceFilter,
    setNearbyFilterTerm,
    setOpenNowOnly,
    setPlaces,
    setSearchTerm,
    setSelectedCategory,
    setSelectedPlace,
    setShowFavoritesOnly,
    setSortOption,
    setTypeFilter,
    setViewMode,
    showFavoritesOnly,
    sortOption,
    toggleFavorite,
    typeFilter,
    userLocation,
    viewMode,
  } = useAppContext();

  return (
    <>
{selectedCountry &&
          !selectedCategory && (
            <section className="categories">
              <div className="section-header">
                <p>
                  {isArabic
                    ? "اكتشفي وجهتك"
                    : "EXPLORE YOUR DESTINATION"}
                </p>

                <h2>
                  {isArabic
                    ? "ماذا تبحثين عنه؟"
                    : "What are you looking for?"}
                </h2>
              </div>

              <div className="category-list">
                {categories.map(
                  (category) => (
                    <div
                      className="category-card"
                      key={
                        category.title
                      }
                      onClick={() =>
                        selectCategory(
                          category.title
                        )
                      }
                    >
                      <span>
                        {
                          category.icon
                        }
                      </span>

                      <h3>
                        {categoryTitle(
                          category.title
                        )}
                      </h3>

                      <p>
                        {categoryDescription(
                          category.title
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

{isRealPlacesCategory && (
          <section className="places-section">
            <div className="section-header">
              <p>
                {showFavoritesOnly
                  ? (isArabic ? "أماكنك المحفوظة" : "YOUR SAVED PLACES")
                  : displayCountry(selectedCountry)}
              </p>

              <h2>
                {showFavoritesOnly
                  ? (isArabic ? "الأماكن المفضلة" : "Your Favorites")
                  : selectedCategory ===
                "Cafés"
                  ? isArabic
                    ? "الكافيهات القريبة منك"
                    : "Cafés Near You"
                  : selectedCategory ===
                    "Picnic & Sitting"
                  ? isArabic
                    ? "أماكن النزهات والجلوس القريبة"
                    : "Picnic & Sitting Near You"
                  : selectedCategory ===
                    "Events"
                  ? isArabic
                    ? "الفعاليات القريبة منك"
                    : "Events Near You"
                  : selectedCategory ===
                    "Fashion"
                  ? isArabic
                    ? "محلات الموضة القريبة منك"
                    : "Fashion Near You"
                  : selectedCategory ===
                    "Beauty"
                  ? isArabic
                    ? "أماكن الجمال القريبة منك"
                    : "Beauty Near You"
                  : isArabic
                  ? "المطاعم القريبة منك"
                  : "Restaurants Near You"}
              </h2>

              <p className="places-description">
                {showFavoritesOnly
                  ? (isArabic
                    ? "كل الأماكن اللي حفظتيها، وتقدري ترجعي لها في أي وقت."
                    : "Places you saved to revisit anytime.")
                  : hasSearched
                  ? isArabic
                    ? "أقرب فرع مطابق لبحثك، حتى لو كان خارج نطاق 15 كم."
                    : "Nearest matching branch, even if it is outside the 15 km range."
                  : isArabic
                  ? "أماكن حقيقية ضمن 15 كم، مرتبة من الأقرب إلى الأبعد."
                  : `Real ${categoryName} within 15 km, sorted from nearest to farthest.`}
              </p>
            </div>

            {userLocation && !showFavoritesOnly && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  searchNearestPlace();
                }}
                style={{
                  display:
                    "flex",
                  gap:
                    "12px",
                  flexWrap:
                    "wrap",
                  marginBottom:
                    "25px",
                  alignItems:
                    "center",
                }}
              >
                <input
                  type="text"
                  value={
                    searchTerm
                  }
                  onChange={(event) =>
                    setSearchTerm(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={
                    handleSearchKeyDown
                  }
                  placeholder={
                    isArabic
                      ? "🔎 اكتبي اسم المكان أو السلسلة..."
                      : "🔎 Enter place or brand name..."
                  }
                  style={{
                    flex:
                      "1 1 300px",
                    minWidth:
                      "220px",
                    padding:
                      "14px 16px",
                    borderRadius:
                      "12px",
                    border:
                      "1px solid #ddd",
                    fontSize:
                      "16px",
                    outline:
                      "none",
                    background:
                      "#fff",
                  }}
                />

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    searchLoading ||
                    !searchTerm.trim()
                  }
                  style={{
                    padding:
                      "14px 20px",
                    opacity:
                      searchLoading ||
                      !searchTerm.trim()
                        ? 0.6
                        : 1,
                  }}
                >
                  {searchLoading
                    ? isArabic
                      ? "جارٍ البحث..."
                      : "Searching..."
                    : isArabic
                    ? "أقرب فرع"
                    : "Find Nearest"}
                </button>

                {!hasSearched && (
                  <select
                    value={
                      distanceFilter
                    }
                    onChange={(event) =>
                      setDistanceFilter(
                        event.target
                          .value
                      )
                    }
                    aria-label={
                      isArabic
                        ? "فلتر المسافة"
                        : "Distance filter"
                    }
                    style={{
                      flex:
                        "0 0 170px",
                      padding:
                        "14px 16px",
                      borderRadius:
                        "12px",
                      border:
                        "1px solid #ddd",
                      fontSize:
                        "16px",
                      background:
                        "#fff",
                      cursor:
                        "pointer",
                    }}
                  >
                    <option value="5">
                      {isArabic
                        ? "حتى 5 كم"
                        : "Up to 5 km"}
                    </option>

                    <option value="10">
                      {isArabic
                        ? "حتى 10 كم"
                        : "Up to 10 km"}
                    </option>

                    <option value="15">
                      {isArabic
                        ? "حتى 15 كم"
                        : "Up to 15 km"}
                    </option>
                  </select>
                )}

                {hasSearched && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={
                      clearSearch
                    }
                  >
                    {isArabic
                      ? "العودة للأماكن القريبة"
                      : "Back to Nearby"}
                  </button>
                )}
              </form>
            )}

            {!hasSearched && (places.length > 0 || showFavoritesOnly) && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px",
                  margin: "0 0 24px",
                  padding: "16px",
                  border: "1px solid #eee7fb",
                  borderRadius: "16px",
                  background: "#fbf9ff",
                }}
              >
                <input
                  type="search"
                  value={nearbyFilterTerm}
                  onChange={(event) => setNearbyFilterTerm(event.target.value)}
                  placeholder={isArabic ? "فلترة الأماكن المعروضة بالاسم أو العنوان..." : "Filter displayed places by name or address..."}
                  aria-label={isArabic ? "فلترة الأماكن المعروضة" : "Filter displayed places"}
                  style={{ flex: "1 1 250px", minWidth: 0, padding: "12px 14px", borderRadius: "11px", border: "1px solid #e3d9f5", fontSize: "15px", background: "#fff" }}
                />
                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                  aria-label={isArabic ? "ترتيب الأماكن" : "Sort places"}
                  style={{ flex: "0 1 210px", minWidth: "175px", padding: "12px 14px", borderRadius: "11px", border: "1px solid #e3d9f5", background: "#fff", fontSize: "15px" }}
                >
                  <option value="nearest">{isArabic ? "الأقرب أولًا" : "Nearest first"}</option>
                  <option value="rating">{isArabic ? "أعلى تقييم شخصي" : "Highest personal rating"}</option>
                  <option value="name">{isArabic ? "الاسم: أ - ي" : "Name: A–Z"}</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label={isArabic ? "فلترة حسب النوع" : "Filter by type"}
                  style={{ flex: "0 1 205px", minWidth: "170px", padding: "12px 14px", borderRadius: "11px", border: "1px solid #e3d9f5", background: "#fff", fontSize: "15px" }}
                >
                  <option value="all">{isArabic ? "كل الأنواع" : "All types"}</option>
                  {availablePlaceTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}
                </select>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#5b2eb8", fontWeight: 700, fontSize: "13px", background: "#fff", border: "1px solid #e3d9f5", borderRadius: "11px", padding: "11px 12px" }}>
                  <input type="checkbox" checked={openNowOnly} onChange={(event) => setOpenNowOnly(event.target.checked)} />
                  {isArabic ? "المفتوح الآن حسب المواعيد" : "Open now (listed hours)"}
                </label>
                <span style={{ color: "#675777", fontSize: "13px", fontWeight: 700 }}>
                  {isArabic ? `${placesToDisplay.length} نتيجة` : `${placesToDisplay.length} results`}
                </span>
                {nearbyFilterTerm && (
                  <button type="button" className="secondary-btn" onClick={() => setNearbyFilterTerm("")}>
                    {isArabic ? "مسح الفلتر" : "Clear filter"}
                  </button>
                )}
              </div>
            )}

            {placesToDisplay.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", margin: "0 0 18px", padding: "12px 14px", border: "1px solid #eee7fb", borderRadius: "14px", background: "#fbf9ff" }}>
                <strong style={{ color: "#3a2854" }}>{isArabic ? "طريقة عرض الأماكن" : "Places view"}</strong>
                <div role="group" aria-label={isArabic ? "طريقة العرض" : "View mode"} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { value: "map", label: isArabic ? "🗺️ الخريطة" : "🗺️ Map" },
                    { value: "list", label: isArabic ? "▦ الكروت" : "▦ List" },
                    { value: "both", label: isArabic ? "الاتنين" : "Both" },
                  ].map((mode) => (
                    <button key={mode.value} type="button" onClick={() => setViewMode(mode.value)} aria-pressed={viewMode === mode.value} style={{ border: viewMode === mode.value ? "1px solid #6c35de" : "1px solid #e3d9f5", background: viewMode === mode.value ? "#6c35de" : "#fff", color: viewMode === mode.value ? "#fff" : "#5930b0", borderRadius: "10px", padding: "9px 13px", fontWeight: 750, cursor: "pointer" }}>{mode.label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ================= MAP ================= */}

            {userLocation && viewMode !== "list" && (
              <div
                style={{
                  width:
                    "100%",
                  height:
                    "420px",
                  borderRadius:
                    "18px",
                  overflow:
                    "hidden",
                  marginBottom:
                    "30px",
                  border:
                    "1px solid #e5e5e5",
                  position:
                    "relative",
                  zIndex:
                    1,
                }}
              >
                <MapContainer
                  center={[
                    userLocation.latitude,
                    userLocation.longitude,
                  ]}
                  zoom={13}
                  scrollWheelZoom={
                    true
                  }
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                  }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapController
                    userLocation={
                      userLocation
                    }
                    places={
                      placesToDisplay
                    }
                  />

                  {/* USER LOCATION */}

                  <CircleMarker
                    center={[
                      userLocation.latitude,
                      userLocation.longitude,
                    ]}
                    radius={10}
                    pathOptions={{
                      color:
                        "#6c35de",
                      fillColor:
                        "#6c35de",
                      fillOpacity:
                        0.85,
                    }}
                  >
                    <Popup>
                      <div
                        dir={
                          isArabic
                            ? "rtl"
                            : "ltr"
                        }
                      >
                        <strong>
                          {isArabic
                            ? "موقعك الحالي"
                            : "Your Location"}
                        </strong>
                      </div>
                    </Popup>
                  </CircleMarker>

                  {/* PLACES */}

                  {placesToDisplay.map(
                    (place) => (
                      <CircleMarker
                        key={
                          `map-${place.id}`
                        }
                        center={[
                          place.latitude,
                          place.longitude,
                        ]}
                        radius={8}
                        pathOptions={{
                          color:
                            "#9b7bea",
                          fillColor:
                            "#9b7bea",
                          fillOpacity:
                            0.9,
                        }}
                        eventHandlers={{
                          click: () => openPlaceDetails(place),
                        }}
                      >
                        <Popup>
                          <div
                            dir={
                              isArabic
                                ? "rtl"
                                : "ltr"
                            }
                            style={{
                              minWidth:
                                "180px",
                            }}
                          >
                            <strong>
                              {
                                place.name
                              }
                            </strong>

                            <br />

                            <span>
                              📍{" "}
                              {
                                place.address
                              }
                            </span>

                            <br />

                            <span>
                              📏{" "}
                              {formatDistance(
                                place.distance
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDirections(
                                  place.latitude,
                                  place.longitude
                                );
                              }}
                              style={{
                                marginTop:
                                  "10px",
                                width:
                                  "100%",
                                padding:
                                  "9px 12px",
                                border:
                                  "none",
                                borderRadius:
                                  "9px",
                                background:
                                  "#6c35de",
                                color:
                                  "#fff",
                                cursor:
                                  "pointer",
                                fontWeight:
                                  "600",
                              }}
                            >
                              📍{" "}
                              {isArabic
                                ? "الاتجاهات"
                                : "Get Directions"}
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )
                  )}
                </MapContainer>
              </div>
            )}

            {searchLoading && (
              <div className="places-loading">
                <div className="loading-icon">
                  🔎
                </div>

                <h3>
                  {isArabic
                    ? "جارٍ البحث عن أقرب فرع..."
                    : "Finding the nearest branch..."}
                </h3>

                <p>
                  {isArabic
                    ? "البحث يتم بشكل مستقل عن نتائج الأماكن القريبة."
                    : "Searching independently from the nearby places list."}
                </p>
              </div>
            )}

            {loadingPlaces &&
              !searchLoading && (
                <div className="places-loading">
                  <div className="loading-icon">
                    {selectedCategory ===
                    "Cafés"
                      ? "☕"
                      : selectedCategory ===
                        "Picnic & Sitting"
                      ? "🌳"
                      : selectedCategory ===
                        "Events"
                      ? "🎉"
                      : selectedCategory ===
                        "Fashion"
                      ? "👗"
                      : selectedCategory ===
                        "Beauty"
                      ? "💄"
                      : "🍽️"}
                  </div>

                  <h3>
                    {selectedCategory ===
                    "Cafés"
                      ? isArabic
                        ? "جارٍ البحث عن الكافيهات..."
                        : "Finding cafés..."
                      : selectedCategory ===
                        "Picnic & Sitting"
                      ? isArabic
                        ? "جارٍ البحث عن أماكن النزهات..."
                        : "Finding picnic places..."
                      : selectedCategory ===
                        "Events"
                      ? isArabic
                        ? "جارٍ البحث عن الفعاليات..."
                        : "Finding events..."
                      : selectedCategory ===
                        "Fashion"
                      ? isArabic
                        ? "جارٍ البحث عن محلات الموضة..."
                        : "Finding fashion stores..."
                      : selectedCategory ===
                        "Beauty"
                      ? isArabic
                        ? "جارٍ البحث عن أماكن الجمال..."
                        : "Finding beauty places..."
                      : isArabic
                      ? "جارٍ البحث عن المطاعم..."
                      : "Finding restaurants..."}
                  </h3>

                  <p>
                    {isArabic
                      ? "نبحث عن أماكن حقيقية قريبة منك."
                      : "We're searching for real places near you."}
                  </p>
                </div>
              )}

            {!loadingPlaces &&
              !searchLoading &&
              placesToDisplay.length >
                0 && (
                <>
                  <p
                    style={{
                      marginBottom:
                        "18px",
                      opacity:
                        0.75,
                    }}
                  >
                    {hasSearched
                      ? isArabic
                        ? `أقرب فرع لـ "${searchTerm}"`
                        : `Nearest branch for "${searchTerm}"`
                      : isArabic
                      ? `عرض ${placesToDisplay.length} مكان قريب`
                      : `Showing ${placesToDisplay.length} nearby places`}
                  </p>

                  {viewMode !== "map" && (
                  <div
                    className="places-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 285px), 1fr))",
                      gap: "22px",
                      alignItems: "stretch",
                    }}
                  >
                    {placesToDisplay.map((place) => {
                      const savedRating = getPlaceRating(place);
                      const placeCategory = place.category || selectedCategory;
                      const crowdEstimate = getCrowdEstimate(place);
                      const openStatus = getOpenStatus(place);
                      return (
                        <article
                          className="place-card"
                          key={place.id}
                          role="button"
                          tabIndex={0}
                          aria-label={isArabic ? `عرض تفاصيل ${getDisplayPlaceName(place)}` : `View details for ${place.name}`}
                          onClick={() => openPlaceDetails(place)}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openPlaceDetails(place);
                            }
                          }}
                          style={{
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            border: "1px solid #eee7fb",
                            borderRadius: "21px",
                            background: "#fff",
                            boxShadow: "0 10px 28px rgba(65, 38, 110, 0.09)",
                            cursor: "pointer",
                            transition: "transform 180ms ease, box-shadow 180ms ease",
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.transform = "translateY(-4px)";
                            event.currentTarget.style.boxShadow = "0 18px 36px rgba(65, 38, 110, 0.16)";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.transform = "translateY(0)";
                            event.currentTarget.style.boxShadow = "0 10px 28px rgba(65, 38, 110, 0.09)";
                          }}
                        >
                          <div style={{ position: "relative", height: "205px", overflow: "hidden", background: "linear-gradient(135deg, #eee7ff, #f8f4ff)" }}>
                            <img
                              src={getPlaceImage(place)}
                              alt={getDisplayPlaceName(place) || (isArabic ? "صورة المكان" : "Place image")}
                              loading="lazy"
                              onError={(event) => {
                                const image = event.currentTarget;
                                if (image.dataset.fallbackApplied === "yes") { image.style.display = "none"; return; }
                                image.dataset.fallbackApplied = "yes";
                                image.src = getPlaceImage({ ...place, photoUrl: "" });
                                const caption = image.parentElement?.querySelector("[data-photo-caption]");
                                if (caption) caption.style.display = "inline-block";
                              }}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                            <span data-photo-caption="true" style={{ display: place.photoUrl ? "none" : "inline-block", position: "absolute", bottom: "48px", insetInlineEnd: "12px", padding: "5px 8px", borderRadius: "8px", color: "#fff", background: "rgba(28,19,43,.68)", fontSize: "10px", fontWeight: 650 }}>{isArabic ? "صورة توضيحية" : "Illustrative image"}</span>
                            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(24,14,40,.18), transparent 42%, rgba(24,14,40,.58))", pointerEvents: "none" }} />
                            <span style={{ position: "absolute", top: "13px", insetInlineStart: "13px", maxWidth: "calc(100% - 78px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "7px 11px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "#5b2eb8", fontSize: "12px", fontWeight: 750 }}>
                              {categoryTitle(placeCategory)}
                            </span>
                            <button
                              type="button"
                              aria-label={isFavorite(place) ? (isArabic ? "إزالة من المفضلة" : "Remove from favorites") : (isArabic ? "إضافة إلى المفضلة" : "Add to favorites")}
                              title={isFavorite(place) ? (isArabic ? "إزالة من المفضلة" : "Remove from favorites") : (isArabic ? "إضافة إلى المفضلة" : "Add to favorites")}
                              onClick={(event) => { event.stopPropagation(); toggleFavorite(place); }}
                              style={{ position: "absolute", top: "11px", insetInlineEnd: "11px", width: "44px", height: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, border: "1px solid rgba(255,255,255,.75)", borderRadius: "50%", background: isFavorite(place) ? "#fff0f5" : "rgba(255,255,255,.95)", color: isFavorite(place) ? "#df3d78" : "#673ab7", fontSize: "25px", cursor: "pointer", boxShadow: "0 6px 18px rgba(24,14,40,.16)" }}
                            >{isFavorite(place) ? "♥" : "♡"}</button>
                            <span style={{ position: "absolute", bottom: "13px", insetInlineStart: "13px", padding: "7px 11px", borderRadius: "999px", background: "rgba(28,19,43,.76)", color: "#fff", fontSize: "13px", fontWeight: 750 }}>
                              📍 {formatDistance(Number(place.distance) || 0)}
                            </span>
                            <span
                              title={isArabic ? "تقدير عام حسب الوقت ونوع المكان، وليس بيانات زحمة مباشرة" : "General estimate by time and place type, not live crowd data"}
                              style={{ position: "absolute", bottom: "13px", insetInlineEnd: "13px", maxWidth: "58%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "7px 10px", borderRadius: "999px", background: crowdEstimate.background, color: crowdEstimate.color, fontSize: "12px", fontWeight: 800 }}
                            >
                              {crowdEstimate.icon} {crowdEstimate.label}
                            </span>
                          </div>

                          <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "13px", padding: "19px", minWidth: 0 }}>
                            <div>
                              <h3 style={{ margin: "0 0 8px", color: "#2b2040", fontSize: "20px", fontWeight: 800, lineHeight: 1.35, overflowWrap: "anywhere" }}>
                                {place.name}
                              </h3>
                              {hasSearched && <span style={{ display: "inline-block", padding: "5px 9px", borderRadius: "8px", background: "#f2ebff", color: "#6233b2", fontSize: "12px", fontWeight: 750 }}>📌 {isArabic ? "أقرب فرع لبحثك" : "Nearest match"}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#6d6578", fontSize: "13px", lineHeight: 1.6, overflowWrap: "anywhere" }}>
                              <span>📍</span><span>{place.address || (isArabic ? "العنوان غير متوفر" : "Address not available")}</span>
                            </div>
                            <div style={{ marginTop: "-2px", padding: "8px 10px", borderRadius: "10px", background: openStatus === "open" ? "#eaf8f0" : openStatus === "closed" ? "#fff0f2" : "#f4f1f8", color: openStatus === "open" ? "#216b4b" : openStatus === "closed" ? "#a3223b" : "#6d6578", fontSize: "12px", fontWeight: 750 }}>
                              🕒 {getOpenStatusLabel(place)}
                            </div>
                            <div style={{ padding: "12px", borderRadius: "12px", background: crowdEstimate.background, border: `1px solid ${crowdEstimate.color}22`, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <span style={{ color: crowdEstimate.color, fontSize: "13px", fontWeight: 800 }}>
                                {crowdEstimate.icon} {isArabic ? "الزحمة المتوقعة:" : "Estimated crowd:"} {crowdEstimate.label}
                              </span>
                              <button
                                type="button"
                                onClick={(event) => { event.stopPropagation(); openCrowdInfo(place); }}
                                title={isArabic ? "افتح المكان على خرائط Google للتحقق من الأوقات الشائعة إن توفرت" : "Open Google Maps to check Popular Times if available"}
                                style={{ border: 0, background: "rgba(255,255,255,.78)", color: "#5930b0", borderRadius: "9px", padding: "7px 9px", fontSize: "12px", fontWeight: 750, cursor: "pointer" }}
                              >
                                {isArabic ? "تحققي على الخرائط ↗" : "Check on Maps ↗"}
                              </button>
                              <p style={{ flexBasis: "100%", margin: 0, color: "#6d6578", fontSize: "11px", lineHeight: 1.5 }}>
                                {isArabic ? "تقدير حسب الساعة ونوع المكان، وليس قياسًا مباشرًا للزحمة." : "Estimated from the time and place type; not a live crowd measurement."}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", padding: "12px 0", borderTop: "1px solid #f0ebf7", borderBottom: "1px solid #f0ebf7" }}>
                              <span style={{ color: "#665a78", fontSize: "12px", fontWeight: 650, overflowWrap: "anywhere" }}>🏷️ {place.cuisine || categoryTitle(placeCategory)}</span>
                              <span style={{ padding: "6px 9px", borderRadius: "9px", background: "#f7f3ff", color: "#6435b5", fontSize: "12px", fontWeight: 750, whiteSpace: "nowrap" }}>↔ {formatDistance(Number(place.distance) || 0)}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <div role="group" aria-label={isArabic ? "تقييمك للمكان" : "Your rating for this place"} style={{ display: "inline-flex", gap: "1px", direction: "ltr" }}>
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button key={rating} type="button" aria-label={isArabic ? `تقييم ${rating} من 5` : `Rate ${rating} out of 5`} aria-pressed={savedRating === rating} onClick={(event) => { event.stopPropagation(); savePlaceRating(place, rating); }} style={{ border: 0, background: "transparent", padding: "1px", fontSize: "19px", lineHeight: 1.1, color: rating <= savedRating ? "#f4b400" : "#d9d2e5", cursor: "pointer" }}>★</button>
                                ))}
                              </div>
                              <span style={{ color: savedRating ? "#74500c" : "#847a93", fontSize: "12px", fontWeight: 700 }}>{savedRating ? (isArabic ? `تقييمك ${savedRating}/5` : `Your rating ${savedRating}/5`) : (isArabic ? "قيّمي المكان" : "Rate this place")}</span>
                            </div>
                            <button type="button" className="secondary-btn" onClick={(event) => { event.stopPropagation(); isInOuting(place) ? removeOutingStop(place.id) : addToOuting(place); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", minHeight: "42px", padding: "10px 14px", borderRadius: "13px", fontWeight: 750, border: "1px solid #e7dcff" }}>
                              {isInOuting(place) ? (isArabic ? "✓ مضاف لخطة الخروجة" : "✓ Added to outing") : (isArabic ? "+ إضافة لخطة الخروجة" : "+ Add to outing")}
                            </button>
                            <button type="button" className="primary-btn" onClick={(event) => { event.stopPropagation(); openDirections(place.latitude, place.longitude); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", minHeight: "46px", marginTop: "auto", padding: "12px 16px", borderRadius: "13px", fontWeight: 750 }}>
                              📍 {isArabic ? "الاتجاهات على الخريطة" : "Get Directions"} ↗
                            </button>
                            <p style={{ margin: 0, color: "#8a8198", fontSize: "11px", textAlign: "center" }}>{isArabic ? "اضغطي على الكارت لعرض التفاصيل" : "Tap the card to see details"}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  )}
                </>
              )}

            {showFavoritesOnly && !loadingPlaces && !searchLoading && filteredPlaces.length === 0 && (
              <div className="places-loading">
                <div className="loading-icon">♡</div>
                <h3>{isArabic ? "لسه مفيش أماكن محفوظة هنا" : "No saved places to show"}</h3>
                <p>{isArabic ? "اضغطي على القلب في كارت أي مكان علشان تضيفيه للمفضلة." : "Tap the heart on any place card to save it to your favorites."}</p>
                <button type="button" className="primary-btn" onClick={() => { setShowFavoritesOnly(false); setSelectedCategory(""); setSelectedPlace(null); }} style={{ marginTop: "18px" }}>{isArabic ? "اكتشفي الأماكن" : "Explore places"}</button>
              </div>
            )}

            {!showFavoritesOnly && !loadingPlaces && !searchLoading && !hasSearched && places.length > 0 && filteredPlaces.length === 0 && (
              <div className="places-loading">
                <div className="loading-icon">🔎</div>
                <h3>{isArabic ? "مفيش نتائج مطابقة للفلاتر" : "No places match these filters"}</h3>
                <p>{isArabic ? "جرّبي كلمة مختلفة أو زوّدي نطاق المسافة." : "Try another search term or increase the distance range."}</p>
                <button type="button" className="primary-btn" onClick={() => { setNearbyFilterTerm(""); setDistanceFilter("15"); }} style={{ marginTop: "18px" }}>{isArabic ? "إظهار كل النتائج" : "Show all results"}</button>
              </div>
            )}

            {!loadingPlaces &&
              !searchLoading &&
              hasSearched &&
              searchResults.length ===
                0 && (
                <div className="places-loading">
                  <div className="loading-icon">
                    🔎
                  </div>

                  <h3>
                    {isArabic
                      ? "لم يتم العثور على المكان"
                      : "Place not found"}
                  </h3>

                  <p>
                    {isArabic
                      ? `لم نجد فرعًا مطابقًا لـ "${searchTerm}" داخل الدولة المختارة.`
                      : `We couldn't find a matching branch for "${searchTerm}" inside the selected country.`}
                  </p>

                  <button
                    className="primary-btn"
                    onClick={
                      clearSearch
                    }
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >
                    {isArabic
                      ? "العودة للأماكن القريبة"
                      : "Back to Nearby"}
                  </button>
                </div>
              )}

            {!loadingPlaces &&
              !searchLoading &&
              !hasSearched &&
              places.length >
                0 &&
              filteredPlaces.length ===
                0 && (
                <div className="places-loading">
                  <div className="loading-icon">
                    🔎
                  </div>

                  <h3>
                    {isArabic
                      ? "لا توجد نتائج ضمن المسافة المختارة"
                      : "No places within the selected distance"}
                  </h3>

                  <p>
                    {isArabic
                      ? "اكتبي اسم المكان بالأعلى للبحث عن أقرب فرع حتى لو كان خارج 15 كم."
                      : "Search for a place above to find its nearest branch, even outside 15 km."}
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() => {
                      setDistanceFilter(
                        "15"
                      );
                    }}
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >
                    {isArabic
                      ? "عرض حتى 15 كم"
                      : "Show up to 15 km"}
                  </button>
                </div>
              )}

            {!showFavoritesOnly &&
              !loadingPlaces &&
              !searchLoading &&
              !hasSearched &&
              places.length ===
                0 &&
              userLocation && (
                <div className="places-loading">
                  <div className="loading-icon">
                    📍
                  </div>

                  <h3>
                    {isArabic
                      ? `لم يتم العثور على ${
                          selectedCategory ===
                          "Cafés"
                            ? "كافيهات"
                            : selectedCategory ===
                              "Picnic & Sitting"
                            ? "أماكن نزهات وجلوس"
                            : selectedCategory ===
                              "Events"
                            ? "أماكن فعاليات"
                            : selectedCategory ===
                              "Fashion"
                            ? "محلات موضة"
                            : selectedCategory ===
                              "Beauty"
                            ? "أماكن جمال"
                            : "مطاعم"
                        } مسماة`
                      : `No named ${
                          selectedCategory ===
                          "Cafés"
                            ? "cafés"
                            : selectedCategory ===
                              "Picnic & Sitting"
                            ? "picnic & sitting places"
                            : selectedCategory ===
                              "Events"
                            ? "event places"
                            : selectedCategory ===
                              "Fashion"
                            ? "fashion stores"
                            : selectedCategory ===
                              "Beauty"
                            ? "beauty places"
                            : "restaurants"
                        } found`}
                  </h3>

                  <p>
                    {isArabic
                      ? "اكتبي اسم المكان بالأعلى للبحث عن أقرب فرع."
                      : "Enter a place name above to search for its nearest branch."}
                  </p>

                  <button
                    className="primary-btn"
                    onClick={
                      selectedCategory ===
                      "Cafés"
                        ? findCafes
                        : selectedCategory ===
                          "Picnic & Sitting"
                        ? findPicnicPlaces
                        : selectedCategory ===
                          "Events"
                        ? findEvents
                        : selectedCategory ===
                          "Fashion"
                        ? findFashionPlaces
                        : selectedCategory ===
                          "Beauty"
                        ? findBeautyPlaces
                        : findRestaurants
                    }
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >
                    {isArabic
                      ? "حاولي مرة أخرى"
                      : "Try Again"}
                  </button>
                </div>
              )}

            {!userLocation && (
              <div className="places-loading">
                <div className="loading-icon">
                  📍
                </div>

                <h3>
                  {isArabic
                    ? "الموقع مطلوب"
                    : "Location required"}
                </h3>

                <p>
                  {isArabic
                    ? `اسمحي بالوصول إلى الموقع للعثور على ${categoryName} القريبة منك.`
                    : `Allow location access to find real ${categoryName} near you.`}
                </p>

                <button
                  className="primary-btn"
                  onClick={
                    getUserLocation
                  }
                  style={{
                    marginTop:
                      "20px",
                  }}
                >
                  {isArabic
                    ? "السماح بالموقع"
                    : "Allow Location"}
                </button>
              </div>
            )}

            <button
              className="secondary-btn"
              onClick={() => {
                setSelectedCategory(
                  ""
                );
                setPlaces([]);
                clearSearch();
              }}
              style={{
                marginTop:
                  "30px",
              }}
            >
              {isArabic
                ? "→ العودة إلى التصنيفات"
                : "← Back to Categories"}
            </button>
          </section>
        )}

{selectedCategory &&
          !isRealPlacesCategory && (
            <section className="places-section">
              <div className="section-header">
                <p>
                  {displayCountry(
                    selectedCountry
                  )}
                </p>

                <h2>
                  {categoryTitle(
                    selectedCategory
                  )}
                </h2>

                <p className="places-description">
                  {isArabic
                    ? "سيتم ربط الأماكن الحقيقية القريبة بهذا التصنيف لاحقًا."
                    : "Real nearby places will be connected to this category next."}
                </p>
              </div>

              <div className="places-loading">
                <div className="loading-icon">
                  📍
                </div>

                <h3>
                  {isArabic
                    ? "قريبًا"
                    : "Coming next"}
                </h3>

                <p>
                  {isArabic
                    ? "نعمل على ربط هذا التصنيف ببيانات المواقع الحقيقية."
                    : "We're connecting this category to real location data."}
                </p>
              </div>

              <button
                className="secondary-btn"
                onClick={() =>
                  setSelectedCategory(
                    ""
                  )
                }
                style={{
                  marginTop:
                    "30px",
                }}
              >
                {isArabic
                  ? "→ العودة إلى التصنيفات"
                  : "← Back to Categories"}
              </button>
            </section>
          )}
</>
  );
}
