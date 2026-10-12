import "./App.css";
import { AppContext } from "./AppContext.jsx";
import Navbar from "./components/Navbar.jsx";
import PlaceDetailsModal from "./components/PlaceDetailsModal.jsx";
import CountryPickerModal from "./components/CountryPickerModal.jsx";
import HomePage from "./pages/HomePage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import OutingPlannerPage from "./pages/OutingPlannerPage.jsx";
import "leaflet/dist/leaflet.css";

import {
  useEffect,
  useRef,
  useState,
} from "react";

async function fetchVerifiedWikidataPhoto(wikidataId) {
  if (!/^Q\d+$/.test(String(wikidataId || ""))) {
    return { photoUrl: "", photoSource: "", photoAttribution: "", photoAttributionUrl: "" };
  }

  try {
    const wikidataParams = new URLSearchParams({
      action: "wbgetentities", ids: wikidataId, props: "claims", format: "json", origin: "*",
    });
    const wikidataResponse = await fetch(`https://www.wikidata.org/w/api.php?${wikidataParams.toString()}`);
    if (!wikidataResponse.ok) return { photoUrl: "", photoSource: "", photoAttribution: "", photoAttributionUrl: "" };

    const wikidataData = await wikidataResponse.json();
    const fileName = wikidataData?.entities?.[wikidataId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (typeof fileName !== "string" || !fileName.trim()) {
      return { photoUrl: "", photoSource: "", photoAttribution: "", photoAttributionUrl: "" };
    }

    const commonsParams = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      titles: `File:${fileName.trim()}`,
      iiprop: "url|extmetadata",
      iiurlwidth: "900",
      origin: "*",
    });
    const commonsResponse = await fetch(`https://commons.wikimedia.org/w/api.php?${commonsParams.toString()}`);
    if (!commonsResponse.ok) return { photoUrl: "", photoSource: "", photoAttribution: "", photoAttributionUrl: "" };

    const commonsData = await commonsResponse.json();
    const pages = commonsData?.query?.pages || {};
    const page = Object.values(pages)[0];
    const imageInfo = page?.imageinfo?.[0];
    if (!imageInfo?.thumburl && !imageInfo?.url) {
      return { photoUrl: "", photoSource: "", photoAttribution: "", photoAttributionUrl: "" };
    }

    const metadata = imageInfo.extmetadata || {};
    const cleanMetadata = (value) => String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    const artist = cleanMetadata(metadata.Artist?.value || metadata.Credit?.value);
    const license = cleanMetadata(metadata.LicenseShortName?.value);
    const attribution = [artist, license].filter(Boolean).join(" · ") || "Wikimedia Commons";

    return {
      photoUrl: imageInfo.thumburl || imageInfo.url,
      photoSource: "Wikimedia Commons",
      photoAttribution: attribution,
      photoAttributionUrl: imageInfo.descriptionurl || "https://commons.wikimedia.org/",
    };
  } catch (error) {
    console.warn("Could not verify a linked Wikidata photo:", wikidataId, error);
    return { photoUrl: "", photoSource: "", photoAttribution: "", photoAttributionUrl: "" };
  }
}

const APP_ROUTES = new Set(["home", "places", "favorites", "outing", "details"]);

function getAppRouteFromHash() {
  if (typeof window === "undefined") return "home";
  const route = String(window.location.hash || "").replace(/^#\/?/, "").split("/")[0].split("?")[0];
  return APP_ROUTES.has(route) ? route : "home";
}

function App() {
  const [showCountries, setShowCountries] =
    useState(false);

  const [selectedCountry, setSelectedCountry] = useState(() => {
    try {
      return window.localStorage.getItem("yalla-nakhruj-selected-country") || "";
    } catch (error) {
      console.warn("Could not restore selected country:", error);
      return "";
    }
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    try {
      return window.localStorage.getItem("yalla-nakhruj-selected-category") || "";
    } catch (error) {
      console.warn("Could not restore selected category:", error);
      return "";
    }
  });

  const [selectedPlace, setSelectedPlace] =
    useState(null);

  const [currentPage, setCurrentPage] = useState(() => getAppRouteFromHash());
  const previousPageRef = useRef(currentPage === "details" ? "home" : currentPage);

  function navigateTo(page) {
    const nextPage = APP_ROUTES.has(page) ? page : "home";
    setCurrentPage(nextPage);
    const nextHash = "#/" + nextPage;
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
    if (nextPage !== "details") window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openPlaceDetails(place) {
    if (!place) return;
    if (currentPage !== "details") {
      previousPageRef.current = currentPage === "details"
        ? previousPageRef.current
        : currentPage;
    }
    setSelectedPlace(place);
    navigateTo("details");
  }

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = window.localStorage.getItem("yalla-nakhruj-favorites");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Could not load favorites:", error);
      return [];
    }
  });

  const [placeRatings, setPlaceRatings] = useState(() => {
    try {
      const saved = window.localStorage.getItem("yalla-nakhruj-place-ratings");
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      console.warn("Could not load place ratings:", error);
      return {};
    }
  });

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [nearbyFilterTerm, setNearbyFilterTerm] = useState("");
  const [sortOption, setSortOption] = useState("nearest");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [showOutingPanel, setShowOutingPanel] = useState(false);
  const [outingName, setOutingName] = useState("");
  const [outingMessage, setOutingMessage] = useState("");

  const [outingStops, setOutingStops] = useState(() => {
    try {
      const saved = window.localStorage.getItem("yalla-nakhruj-current-outing");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Could not load current outing:", error);
      return [];
    }
  });

  const [savedOutingPlans, setSavedOutingPlans] = useState(() => {
    try {
      const saved = window.localStorage.getItem("yalla-nakhruj-outing-plans");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Could not load saved outing plans:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("yalla-nakhruj-favorites", JSON.stringify(favorites));
    } catch (error) {
      console.warn("Could not save favorites:", error);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      window.localStorage.setItem("yalla-nakhruj-place-ratings", JSON.stringify(placeRatings));
    } catch (error) {
      console.warn("Could not save place ratings:", error);
    }
  }, [placeRatings]);

  useEffect(() => {
    try {
      window.localStorage.setItem("yalla-nakhruj-current-outing", JSON.stringify(outingStops));
    } catch (error) {
      console.warn("Could not save current outing:", error);
    }
  }, [outingStops]);

  useEffect(() => {
    try {
      window.localStorage.setItem("yalla-nakhruj-outing-plans", JSON.stringify(savedOutingPlans));
    } catch (error) {
      console.warn("Could not save outing plans:", error);
    }
  }, [savedOutingPlans]);

  const [userLocation, setUserLocation] =
    useState(null);

  const [locationMessage, setLocationMessage] =
    useState("");

  const [places, setPlaces] =
    useState([]);

  const [loadingPlaces, setLoadingPlaces] =
    useState(false);

  // Restore the last selected language from this browser after refresh.
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = window.localStorage.getItem("yalla-nakhruj-language");
      return savedLanguage === "ar" || savedLanguage === "en"
        ? savedLanguage
        : "en";
    } catch (error) {
      console.warn("Could not load saved language:", error);
      return "en";
    }
  });

  useEffect(() => {
    const handleHashChange = () => {
      const nextPage = getAppRouteFromHash();
      setCurrentPage(nextPage);
      if (nextPage !== "details") setSelectedPlace(null);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (currentPage === "details" && !selectedPlace) {
      const fallbackPage = previousPageRef.current && previousPageRef.current !== "details"
        ? previousPageRef.current
        : (selectedCountry ? "places" : "home");
      navigateTo(fallbackPage);
    }
  }, [currentPage, selectedPlace, selectedCountry]);

  useEffect(() => {
    if (currentPage === "places" && !selectedCountry && !showCountries) {
      setShowCountries(true);
    }
    if (currentPage === "favorites" && !showFavoritesOnly) {
      setShowFavoritesOnly(true);
      setSelectedCategory("Favorites");
      setPlaces([]);
      clearSearch();
    }
  }, [currentPage, selectedCountry, showCountries, showFavoritesOnly]);

  useEffect(() => {
    try {
      if (selectedCountry) {
        window.localStorage.setItem("yalla-nakhruj-selected-country", selectedCountry);
      } else {
        window.localStorage.removeItem("yalla-nakhruj-selected-country");
      }
    } catch (error) {
      console.warn("Could not save selected country:", error);
    }
  }, [selectedCountry]);

  useEffect(() => {
    try {
      if (selectedCategory) {
        window.localStorage.setItem("yalla-nakhruj-selected-category", selectedCategory);
      } else {
        window.localStorage.removeItem("yalla-nakhruj-selected-category");
      }
    } catch (error) {
      console.warn("Could not save selected category:", error);
    }
  }, [selectedCategory]);

  // Save every language change so it stays selected on the next refresh.
  useEffect(() => {
    try {
      window.localStorage.setItem("yalla-nakhruj-language", language);
    } catch (error) {
      console.warn("Could not save language:", error);
    }
  }, [language]);

  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [installMessage, setInstallMessage] = useState("");

  // Keep browser chrome language in sync with the selected website language,
  // expose the PWA manifest, and register the service worker in production.
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
    document.title = language === "ar" ? "يلا نخرج | Yalla Nakhruj" : "Yalla Nakhruj | يلا نخرج";
  }, [language]);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    let manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement("link");
      manifest.rel = "manifest";
      document.head.appendChild(manifest);
    }
    manifest.href = `${baseUrl}manifest.webmanifest`;

    let appIcon = document.querySelector('link[rel="icon"]');
    if (!appIcon) {
      appIcon = document.createElement("link");
      appIcon.rel = "icon";
      document.head.appendChild(appIcon);
    }
    appIcon.href = `${baseUrl}icons/yalla-nakhruj.svg`;
    appIcon.type = "image/svg+xml";

    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement("link");
      appleTouchIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = `${baseUrl}icons/yalla-nakhruj-192.png`;

    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.name = "theme-color";
      document.head.appendChild(themeColor);
    }
    themeColor.content = "#6b35c8";

    let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleCapable) {
      appleCapable = document.createElement("meta");
      appleCapable.name = "apple-mobile-web-app-capable";
      document.head.appendChild(appleCapable);
    }
    appleCapable.content = "yes";

    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitle);
    }
    appleTitle.content = "يلا نخرج";

    setIsAppInstalled(
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      window.navigator.standalone === true
    );

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPromptEvent(null);
      setInstallMessage(document.documentElement.lang === "ar" ? "تم تثبيت يلا نخرج بنجاح! 💜" : "Yalla Nakhruj was installed successfully! 💜");
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${baseUrl}sw.js`, { scope: baseUrl })
        .catch((error) => console.warn("PWA service worker registration failed:", error));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallApp() {
    if (installPromptEvent) {
      try {
        await installPromptEvent.prompt();
        const choice = await installPromptEvent.userChoice;
        if (choice?.outcome === "accepted") {
          setIsAppInstalled(true);
          setInstallMessage(isArabic ? "جاري تثبيت التطبيق…" : "Installing the app…");
        }
      } catch (error) {
        console.warn("Could not open app installation prompt:", error);
        setInstallMessage(isArabic
          ? "افتحي قائمة المتصفح واختاري «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق»."
          : "Open your browser menu and choose “Add to Home screen” or “Install app”.");
      } finally {
        setInstallPromptEvent(null);
      }
      return;
    }
    setInstallMessage(isArabic
      ? "لتثبيت يلا نخرج: افتحي قائمة المتصفح واختاري «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق». على iPhone: اضغطي مشاركة ثم «إضافة إلى الشاشة الرئيسية»."
      : "To install Yalla Nakhruj, open your browser menu and choose “Add to Home screen” or “Install app”. On iPhone, tap Share, then “Add to Home Screen”.");
  }

  const [searchTerm, setSearchTerm] =
    useState("");

  const [distanceFilter, setDistanceFilter] =
    useState("15");

  const [searchResults, setSearchResults] =
    useState([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [hasSearched, setHasSearched] =
    useState(false);

  // Refresh the estimated crowd indicator every minute using the device's local clock.
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(timerId);
  }, []);

  const isArabic =
    language === "ar";

  // Request the device location automatically when the app first opens.
  // A browser permission prompt may still appear; the app cannot bypass it.
  const locationRequestStarted = useRef(false);

  useEffect(() => {
    if (locationRequestStarted.current) {
      return;
    }

    locationRequestStarted.current = true;
    getUserLocation();
  }, []);

  useEffect(() => {
    if (!selectedPlace) {
      return;
    }

    function closePlaceDetails(event) {
      if (event.key === "Escape") {
        setSelectedPlace(null);
      }
    }

    window.addEventListener(
      "keydown",
      closePlaceDetails
    );

    return () => {
      window.removeEventListener(
        "keydown",
        closePlaceDetails
      );
    };
  }, [selectedPlace]);

  const countries = [
    "🇪🇬 Egypt",
    "🇸🇦 Saudi Arabia",
    "🇦🇪 United Arab Emirates",
    "🇶🇦 Qatar",
    "🇰🇼 Kuwait",
    "🇯🇴 Jordan",
  ];

  const categories = [
    {
      icon: "🌳",
      title: "Picnic & Sitting",
      description: "Relax and enjoy",
    },
    {
      icon: "🍽️",
      title: "Restaurants",
      description:
        "Discover great food",
    },
    {
      icon: "☕",
      title: "Cafés",
      description:
        "Find your coffee spot",
    },
    {
      icon: "🎉",
      title: "Events",
      description:
        "What's happening?",
    },
    {
      icon: "👗",
      title: "Fashion",
      description:
        "Shop your style",
    },
    {
      icon: "💄",
      title: "Beauty",
      description:
        "Beauty & care",
    },
  ];

  const categoryTranslations = {
    "Picnic & Sitting": {
      title: "النزهات والجلوس",
      description:
        "استرخي واستمتعي بوقتك",
    },

    Restaurants: {
      title: "مطاعم",
      description:
        "اكتشفي أفضل الأطعمة",
    },

    "Cafés": {
      title: "كافيهات",
      description:
        "اكتشفي مكان القهوة المفضل",
    },

    Events: {
      title: "فعاليات",
      description:
        "ماذا يحدث؟",
    },

    Fashion: {
      title: "موضة",
      description:
        "اختاري ستايلك",
    },

    Beauty: {
      title: "جمال",
      description:
        "جمال وعناية",
    },

    Favorites: {
      title: "المفضلة",
      description: "الأماكن اللي حفظتيها",
    },
  };

  const countryTranslations = {
    "🇪🇬 Egypt":
      "🇪🇬 مصر",

    "🇸🇦 Saudi Arabia":
      "🇸🇦 السعودية",

    "🇦🇪 United Arab Emirates":
      "🇦🇪 الإمارات العربية المتحدة",

    "🇶🇦 Qatar":
      "🇶🇦 قطر",

    "🇰🇼 Kuwait":
      "🇰🇼 الكويت",

    "🇯🇴 Jordan":
      "🇯🇴 الأردن",
  };

  function categoryTitle(category) {
    if (isArabic) {
      return (
        categoryTranslations[
          category
        ]?.title ||
        category
      );
    }

    return category;
  }

  function categoryDescription(
    category
  ) {
    if (isArabic) {
      return (
        categoryTranslations[
          category
        ]?.description ||
        ""
      );
    }

    const item =
      categories.find(
        (cat) =>
          cat.title === category
      );

    return (
      item?.description || ""
    );
  }

  function displayCountry(
    country
  ) {
    if (!country) return "";

    return isArabic
      ? countryTranslations[
          country
        ] || country
      : country;
  }

  function getPlaceRatingKey(place) {
    const name = normalizeSearchText(place?.name || "");
    const lat = Number(place?.latitude);
    const lon = Number(place?.longitude);
    return `${name}-${Number.isFinite(lat) ? lat.toFixed(5) : "no-lat"}-${Number.isFinite(lon) ? lon.toFixed(5) : "no-lon"}`;
  }

  function getPlaceRating(place) {
    if (!place) return 0;
    const value = Number(placeRatings[getPlaceRatingKey(place)] || 0);
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;
  }

  function savePlaceRating(place, rating) {
    if (!place || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
    const key = getPlaceRatingKey(place);
    setPlaceRatings((current) => ({ ...current, [key]: rating }));
  }

  function isFavorite(place) {
    return favorites.some((item) => String(item.id) === String(place?.id));
  }

  function toggleFavorite(place) {
    if (!place) return;
    if (isFavorite(place)) {
      setFavorites((current) => current.filter((item) => String(item.id) !== String(place.id)));
      return;
    }

    const category = place.category || selectedCategory;
    const country = place.country || selectedCountry;
    setFavorites((current) => [
      { ...place, category, country },
      ...current.filter((item) => String(item.id) !== String(place.id)),
    ]);
  }

  function isInOuting(place) {
    return outingStops.some((stop) => String(stop.id) === String(place?.id));
  }

  function addToOuting(place) {
    if (!place) return;
    if (isInOuting(place)) {
      setOutingMessage(isArabic ? "المكان موجود بالفعل في خطة الخروجة." : "This place is already in your outing.");
      setShowOutingPanel(true);
      navigateTo("outing");
      return;
    }

    const outingPlace = {
      ...place,
      category: place.category || selectedCategory,
      country: place.country || selectedCountry,
    };
    setOutingStops((current) => [...current, outingPlace]);
    setOutingMessage(isArabic ? `اتضاف ${place.name} لخطة الخروجة.` : `${place.name} was added to your outing.`);
    setShowOutingPanel(true);
    navigateTo("outing");
  }

  function removeOutingStop(placeId) {
    setOutingStops((current) => current.filter((place) => String(place.id) !== String(placeId)));
  }

  function moveOutingStop(index, direction) {
    setOutingStops((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const updated = [...current];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  }

  function saveOutingPlan() {
    if (!outingStops.length) {
      setOutingMessage(isArabic ? "ضيفي مكانًا واحدًا على الأقل قبل حفظ الخطة." : "Add at least one place before saving the outing.");
      return;
    }

    const defaultName = isArabic
      ? `خروجة ${new Date().toLocaleDateString("ar-EG")}`
      : `Outing ${new Date().toLocaleDateString("en-US")}`;
    const planName = outingName.trim() || defaultName;
    const plan = {
      id: `outing-${Date.now()}`,
      name: planName,
      stops: outingStops.map((place) => ({ ...place })),
      updatedAt: new Date().toISOString(),
    };

    setSavedOutingPlans((current) => [plan, ...current].slice(0, 30));
    setOutingName(planName);
    setOutingMessage(isArabic ? `اتحفظت خطة «${planName}» على جهازك.` : `“${planName}” was saved on this device.`);
  }

  function loadOutingPlan(plan) {
    if (!plan || !Array.isArray(plan.stops)) return;
    setOutingStops(plan.stops);
    setOutingName(plan.name || "");
    setOutingMessage(isArabic ? `تم فتح خطة «${plan.name}».` : `Loaded “${plan.name}”.`);
    setShowOutingPanel(true);
    navigateTo("outing");
  }

  function deleteOutingPlan(planId) {
    setSavedOutingPlans((current) => current.filter((plan) => String(plan.id) !== String(planId)));
    setOutingMessage(isArabic ? "تم حذف الخطة المحفوظة." : "Saved plan deleted.");
  }

  function openOutingDirections(stops = outingStops) {
    const validStops = (Array.isArray(stops) ? stops : []).filter((place) =>
      Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))
    );

    if (!validStops.length) {
      setOutingMessage(isArabic ? "ضيفي أماكن للخطة الأول." : "Add places to your outing first.");
      return;
    }

    if (validStops.length === 1) {
      openDirections(validStops[0].latitude, validStops[0].longitude);
      return;
    }

    const hasUserOrigin = Boolean(userLocation);
    const originPlace = hasUserOrigin ? userLocation : validStops[0];
    const routeStops = hasUserOrigin ? validStops : validStops.slice(1);
    const destination = routeStops[routeStops.length - 1];
    const waypoints = routeStops.slice(0, -1);
    const params = new URLSearchParams({
      api: "1",
      origin: `${originPlace.latitude},${originPlace.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      travelmode: "driving",
    });
    if (waypoints.length) {
      params.set("waypoints", waypoints.map((place) => `${place.latitude},${place.longitude}`).join("|"));
    }
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank", "noopener,noreferrer");
  }

  function toggleOutingPlanner() {
    setShowOutingPanel(true);
    navigateTo("outing");
  }

  function openFavorites() {
    setShowFavoritesOnly(true);
    setShowCountries(false);
    setSelectedPlace(null);
    setSelectedCategory("Favorites");
    setPlaces([]);
    setNearbyFilterTerm("");
    setSortOption("nearest");
    clearSearch();
    navigateTo("favorites");
  }

  function clearSearch() {
    setSearchTerm("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchLoading(false);
    setDistanceFilter("15");
    setNearbyFilterTerm("");
    setTypeFilter("all");
    setOpenNowOnly(false);
  }

  function chooseCountry(
    country
  ) {
    setShowFavoritesOnly(false);
    setSelectedCountry(country);
    setSelectedCategory("");
    setShowCountries(false);
    setPlaces([]);
    setLocationMessage("");
    clearSearch();
    navigateTo("places");
  }

  function goHome() {
    setShowFavoritesOnly(false);
    setShowCountries(false);
    setSelectedCountry("");
    setSelectedCategory("");
    setPlaces([]);
    setLocationMessage("");
    clearSearch();
    navigateTo("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goPlaces() {
    setShowFavoritesOnly(false);
    setShowCountries(false);
    setSelectedCategory("");
    setPlaces([]);
    clearSearch();
    navigateTo("places");

    if (!selectedCountry) {
      setShowCountries(true);
      return;
    }

  }

  function goToNavbarCategory(
    category
  ) {
    setShowFavoritesOnly(false);
    setShowCountries(false);

    if (!selectedCountry) {
      setSelectedCategory("");
      setPlaces([]);
      clearSearch();
      setShowCountries(true);
      navigateTo("places");
      return;
    }

    selectCategory(category);

  }

  function toggleLanguage() {
    setLanguage((currentLanguage) => {
      const nextLanguage = currentLanguage === "en" ? "ar" : "en";
      // Write immediately on click as well, so a quick refresh cannot lose the choice.
      try {
        window.localStorage.setItem("yalla-nakhruj-language", nextLanguage);
      } catch (error) {
        console.warn("Could not save language:", error);
      }
      return nextLanguage;
    });
  }

  function getUserLocation() {
    setLocationMessage(
      isArabic
        ? "جارٍ تحديد موقعك..."
        : "Finding your location..."
    );

    if (!navigator.geolocation) {
      setLocationMessage(
        isArabic
          ? "المتصفح لا يدعم تحديد الموقع."
          : "Location is not supported by your browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationMessage(
          isArabic
            ? "تم تحديد موقعك تلقائيًا بنجاح."
            : "Your location was detected automatically."
        );
      },
      (error) => {
        console.warn("Geolocation failed:", error);

        let messageEn = "We couldn't access your location. Allow location access in your browser settings.";
        let messageAr = "تعذر تحديد موقعك. اسمحي بالوصول للموقع من إعدادات المتصفح.";

        if (error?.code === 1) {
          messageEn = "Location permission was denied. Allow location access from the browser's site settings, then reload.";
          messageAr = "تم رفض إذن الموقع. اسمحي بالموقع من إعدادات المتصفح للموقع، ثم أعيدي تحميل الصفحة.";
        } else if (error?.code === 2) {
          messageEn = "Your location is currently unavailable. Check device location services and try again.";
          messageAr = "الموقع الحالي غير متاح. تأكدي من تشغيل خدمات الموقع في الجهاز وحاولي مرة أخرى.";
        } else if (error?.code === 3) {
          messageEn = "Location detection timed out. Try again or check your device's location settings.";
          messageAr = "انتهت مهلة تحديد الموقع. حاولي مرة أخرى أو راجعي إعدادات الموقع في الجهاز.";
        }

        setLocationMessage(isArabic ? messageAr : messageEn);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }

  function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
  ) {
    const R = 6371;

    const dLat =
      ((lat2 - lat1) * Math.PI) /
      180;

    const dLon =
      ((lon2 - lon1) * Math.PI) /
      180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(
        (lat1 * Math.PI) / 180
      ) *
        Math.cos(
          (lat2 * Math.PI) / 180
        ) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }

  /* ================= COUNTRY CODE ================= */

  function getCountryCode() {
    if (
      selectedCountry ===
      "🇪🇬 Egypt"
    ) {
      return "EG";
    }

    if (
      selectedCountry ===
      "🇸🇦 Saudi Arabia"
    ) {
      return "SA";
    }

    if (
      selectedCountry ===
      "🇦🇪 United Arab Emirates"
    ) {
      return "AE";
    }

    if (
      selectedCountry ===
      "🇶🇦 Qatar"
    ) {
      return "QA";
    }

    if (
      selectedCountry ===
      "🇰🇼 Kuwait"
    ) {
      return "KW";
    }

    if (
      selectedCountry ===
      "🇯🇴 Jordan"
    ) {
      return "JO";
    }

    return "";
  }

  /* ================= ARABIC SEARCH ================= */

  function normalizeArabic(text) {
    return String(text || "")
      .toLowerCase()
      .replace(
        /[ًٌٍَُِّْـ]/g,
        ""
      )
      .replace(
        /[أإآ]/g,
        "ا"
      )
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/گ/g, "ك")
      .replace(/چ/g, "ج")
      .replace(/پ/g, "ب")
      .replace(/ڤ/g, "ف")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeSearchText(
    text
  ) {
    return normalizeArabic(text)
      .replace(
        /[^\p{L}\p{N}\s]/gu,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }

  function getSearchVariants(
    query
  ) {
    const original =
      String(query || "").trim();

    const normalized =
      normalizeSearchText(
        original
      );

    const noSpaces =
      normalized.replace(
        /\s+/g,
        ""
      );

    return [
      ...new Set(
        [
          original,
          normalized,
          noSpaces,
        ].filter(Boolean)
      ),
    ];
  }

  /* ================= PHOTON / OPENSTREETMAP ================= */

  async function getPhotonPlaces(
    osmTag
  ) {
    if (!userLocation) {
      return [];
    }

    const {
      latitude,
      longitude,
    } = userLocation;

    const url =
      `https://photon.komoot.io/reverse` +
      `?lat=${encodeURIComponent(
        latitude
      )}` +
      `&lon=${encodeURIComponent(
        longitude
      )}` +
      `&radius=15` +
      `&osm_tag=${encodeURIComponent(
        osmTag
      )}` +
      `&limit=50`;

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Photon error: ${response.status}`
      );
    }

    const result =
      await response.json();

    return (
      result?.features || []
    );
  }

  function getSearchTags() {
    if (
      selectedCategory ===
      "Restaurants"
    ) {
      return [
        "amenity:restaurant",
      ];
    }

    if (
      selectedCategory ===
      "Cafés"
    ) {
      return [
        "amenity:cafe",
      ];
    }

    if (
      selectedCategory ===
      "Picnic & Sitting"
    ) {
      return [
        "leisure:park",
        "tourism:picnic_site",
      ];
    }

    if (
      selectedCategory ===
      "Events"
    ) {
      return [
        "amenity:theatre",
        "amenity:cinema",
        "amenity:arts_centre",
        "amenity:community_centre",
        "amenity:nightclub",
        "tourism:attraction",
      ];
    }

    if (
      selectedCategory ===
      "Fashion"
    ) {
      return [
        "shop:clothes",
        "shop:shoes",
        "shop:fashion_accessories",
        "shop:department_store",
      ];
    }

    if (
      selectedCategory ===
      "Beauty"
    ) {
      return [
        "shop:beauty",
        "shop:cosmetics",
        "shop:hairdresser",
        "shop:perfumery",
      ];
    }

    return [];
  }

  async function photonForwardSearch(
    query,
    includeCategoryTags = true
  ) {
    if (
      !userLocation ||
      !query.trim()
    ) {
      return [];
    }

    const {
      latitude,
      longitude,
    } = userLocation;

    const countryCode =
      getCountryCode();

    const params =
      new URLSearchParams();

    params.set(
      "q",
      query.trim()
    );

    params.set(
      "lat",
      String(latitude)
    );

    params.set(
      "lon",
      String(longitude)
    );

    params.set(
      "limit",
      "100"
    );

    params.set(
      "dedupe",
      "0"
    );

    params.set(
      "location_bias_scale",
      "0"
    );

    if (countryCode) {
      params.set(
        "countrycode",
        countryCode
      );
    }

    if (includeCategoryTags) {
      const searchTags =
        getSearchTags();

      searchTags.forEach(
        (tag) => {
          params.append(
            "osm_tag",
            tag
          );
        }
      );
    }

    const response =
      await fetch(
        `https://photon.komoot.io/api/?${params.toString()}`
      );

    if (!response.ok) {
      throw new Error(
        `Photon search error: ${response.status}`
      );
    }

    const result =
      await response.json();

    return (
      result?.features || []
    );
  }

  async function getPhotonSearchPlaces(
    query
  ) {
    const variants =
      getSearchVariants(
        query
      );

    let allResults = [];

    /* ===== CATEGORY SEARCH ===== */

    for (const variant of variants) {
      try {
        const results =
          await photonForwardSearch(
            variant,
            true
          );

        allResults = [
          ...allResults,
          ...results,
        ];
      } catch (error) {
        console.warn(
          "Category search failed:",
          variant,
          error
        );
      }
    }

    /* ===== BROAD SEARCH ===== */

    for (const variant of variants) {
      try {
        const results =
          await photonForwardSearch(
            variant,
            false
          );

        allResults = [
          ...allResults,
          ...results,
        ];
      } catch (error) {
        console.warn(
          "Broad search failed:",
          variant,
          error
        );
      }
    }

    /* ===== REMOVE DUPLICATES ===== */

    const uniqueResults =
      allResults.filter(
        (
          feature,
          index,
          array
        ) => {
          const properties =
            feature?.properties ||
            {};

          const coordinates =
            feature?.geometry
              ?.coordinates || [];

          const featureId =
            properties.osm_id ||
            `${coordinates[1]}-${coordinates[0]}-${properties.name || ""}`;

          return (
            index ===
            array.findIndex(
              (item) => {
                const itemProperties =
                  item?.properties ||
                  {};

                const itemCoordinates =
                  item?.geometry
                    ?.coordinates ||
                  [];

                const itemId =
                  itemProperties.osm_id ||
                  `${itemCoordinates[1]}-${itemCoordinates[0]}-${itemProperties.name || ""}`;

                return (
                  String(
                    itemId
                  ) ===
                  String(
                    featureId
                  )
                );
              }
            )
          );
        }
      );

    return uniqueResults;
  }

  function convertPhotonPlace(
    feature,
    defaultType,
    maxDistance = 15
  ) {
    const properties =
      feature?.properties ||
      {};

    const coordinates =
      feature?.geometry
        ?.coordinates || [];

    const placeLon =
      coordinates[0];

    const placeLat =
      coordinates[1];

    const name =
      properties.name;
    const nameArCandidate = properties["name:ar"] || properties.name_ar || properties.extra?.["name:ar"] || properties.extra?.name_ar;
    const nameAr = typeof nameArCandidate === "string" ? nameArCandidate.trim() : "";

    if (
      !name ||
      placeLat === undefined ||
      placeLon === undefined
    ) {
      return null;
    }

    const distance =
      calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        placeLat,
        placeLon
      );

    if (
      Number.isFinite(
        maxDistance
      ) &&
      distance > maxDistance
    ) {
      return null;
    }

    const street =
      properties.street || "";

    const houseNumber =
      properties.housenumber ||
      "";

    const city =
      properties.city ||
      properties.district ||
      properties.locality ||
      "";

    const addressParts = [
      street,
      houseNumber,
      city,
    ].filter(Boolean);

    const address =
      addressParts.length > 0
        ? addressParts.join(" ")
        : isArabic
        ? "العنوان غير متوفر"
        : "Address not available";

    const cuisine =
      properties.extra
        ?.cuisine ||
      properties.cuisine ||
      properties.osm_value ||
      defaultType;

    const osmId =
      properties.osm_id ||
      `${placeLat}-${placeLon}`;

    const extra =
      properties.extra &&
      typeof properties.extra ===
        "object"
        ? properties.extra
        : {};

    const firstText = (...values) =>
      values.find((value) => typeof value === "string" && value.trim())?.trim() || "";

    const phone = firstText(
      properties.phone, properties["contact:phone"], extra.phone, extra["contact:phone"]
    );
    const website = firstText(
      properties.website, properties.url, properties["contact:website"], extra.website, extra.url, extra["contact:website"]
    );
    const email = firstText(
      properties.email, properties["contact:email"], extra.email, extra["contact:email"]
    );
    const openingHours = firstText(
      properties.opening_hours, properties.openingHours, extra.opening_hours, extra.openingHours
    );
    const photoUrl = firstText(
      properties.image, properties.photo, properties["image:url"], extra.image, extra.photo
    );
    const wikidataIdCandidate = firstText(
      properties.wikidata, extra.wikidata, properties["wikidata"], extra["wikidata"]
    );
    const wikidataId = /^Q\d+$/.test(wikidataIdCandidate) ? wikidataIdCandidate : "";

    const searchAliases = [
      properties.name,
      properties["name:ar"],
      properties["name:en"],

      properties.alt_name,
      properties["alt_name:ar"],
      properties["alt_name:en"],

      properties.official_name,
      properties["official_name:ar"],
      properties["official_name:en"],

      properties.short_name,
      properties["short_name:ar"],
      properties["short_name:en"],

      properties.brand,
      properties["brand:ar"],
      properties["brand:en"],

      properties.operator,
      properties["operator:ar"],
      properties["operator:en"],

      extra.name,
      extra["name:ar"],
      extra["name:en"],

      extra.alt_name,
      extra["alt_name:ar"],
      extra["alt_name:en"],

      extra.brand,
      extra["brand:ar"],
      extra["brand:en"],
    ]
      .filter(Boolean)
      .map((item) =>
        String(item).trim()
      )
      .filter(Boolean);

    const uniqueSearchAliases =
      [
        ...new Set(
          searchAliases
        ),
      ];

    return {
      id: `photon-${defaultType}-${osmId}`,
      name,
      nameAr,
      address,
      cuisine,
      latitude: placeLat,
      longitude: placeLon,
      distance,

      osmKey:
        properties.osm_key ||
        "",

      osmValue:
        properties.osm_value ||
        "",

      searchAliases:
        uniqueSearchAliases,
      phone,
      website,
      email,
      openingHours,
      photoUrl: /^https?:\/\//i.test(photoUrl) ? photoUrl : "",
      photoSource: /^https?:\/\//i.test(photoUrl) ? "OpenStreetMap place data" : "",
      photoAttribution: "",
      photoAttributionUrl: "",
      wikidataId,
      photoLookupDone: false,
    };
  }

  function placeMatchesCategory(
    place
  ) {
    const key =
      String(
        place?.osmKey || ""
      ).toLowerCase();

    const value =
      String(
        place?.osmValue || ""
      ).toLowerCase();

    if (!key && !value) {
      return true;
    }

    if (
      selectedCategory ===
      "Restaurants"
    ) {
      return (
        key === "amenity" &&
        value === "restaurant"
      );
    }

    if (
      selectedCategory ===
      "Cafés"
    ) {
      return (
        key === "amenity" &&
        value === "cafe"
      );
    }

    if (
      selectedCategory ===
      "Picnic & Sitting"
    ) {
      return (
        (key === "leisure" &&
          value === "park") ||
        (key === "tourism" &&
          value ===
            "picnic_site")
      );
    }

    if (
      selectedCategory ===
      "Events"
    ) {
      return (
        (key === "amenity" &&
          [
            "theatre",
            "cinema",
            "arts_centre",
            "community_centre",
            "nightclub",
          ].includes(value)) ||
        (key === "tourism" &&
          value ===
            "attraction")
      );
    }

    if (
      selectedCategory ===
      "Fashion"
    ) {
      return (
        key === "shop" &&
        [
          "clothes",
          "shoes",
          "fashion_accessories",
          "department_store",
        ].includes(value)
      );
    }

    if (
      selectedCategory ===
      "Beauty"
    ) {
      return (
        key === "shop" &&
        [
          "beauty",
          "cosmetics",
          "hairdresser",
          "perfumery",
        ].includes(value)
      );
    }

    return true;
  }

  /* ================= SEARCH NEAREST ================= */

  async function searchNearestPlace() {
    if (!userLocation) {
      setLocationMessage(
        isArabic
          ? "اسمحي بالوصول إلى موقعك أولًا."
          : "Please allow location access first."
      );

      return;
    }

    const query =
      searchTerm.trim();

    if (!query) {
      setLocationMessage(
        isArabic
          ? "اكتبي اسم المكان الذي تبحثين عنه."
          : "Type the name of the place you are looking for."
      );

      return;
    }

    setSearchLoading(true);
    setHasSearched(true);
    setSearchResults([]);

    setLocationMessage(
      isArabic
        ? `جارٍ البحث عن أقرب فرع لـ "${query}"...`
        : `Finding the nearest branch for "${query}"...`
    );

    try {
      const photonResults =
        await getPhotonSearchPlaces(
          query
        );

      const convertedPlaces =
        photonResults
          .map((feature) =>
            convertPhotonPlace(
              feature,
              categoryName,
              Infinity
            )
          )
          .filter(Boolean);

      const normalizedQuery =
        normalizeSearchText(
          query
        );

      const queryWords =
        normalizedQuery
          .split(" ")
          .filter(Boolean);

      function getPlaceSearchText(
        place
      ) {
        const aliases =
          Array.isArray(
            place.searchAliases
          )
            ? place.searchAliases.join(
                " "
              )
            : "";

        return normalizeSearchText(
          `${place.name || ""} ${
            aliases
          } ${
            place.address || ""
          } ${
            place.cuisine || ""
          }`
        );
      }

      function getPlaceNameTexts(
        place
      ) {
        const aliases =
          Array.isArray(
            place.searchAliases
          )
            ? place.searchAliases
            : [];

        return [
          place.name || "",
          ...aliases,
        ]
          .map((item) =>
            normalizeSearchText(
              item
            )
          )
          .filter(Boolean);
      }

      function getMatches(
        placesList
      ) {
        const categoryMatched =
          placesList.filter(
            (place) =>
              placeMatchesCategory(
                place
              )
          );

        const pool =
          categoryMatched.length >
          0
            ? categoryMatched
            : placesList;

        const exactMatches =
          pool.filter(
            (place) => {
              const placeNames =
                getPlaceNameTexts(
                  place
                );

              return placeNames.some(
                (placeName) =>
                  placeName ===
                    normalizedQuery ||
                  placeName.includes(
                    normalizedQuery
                  ) ||
                  normalizedQuery.includes(
                    placeName
                  )
              );
            }
          );

        const wordMatches =
          pool.filter(
            (place) => {
              const searchableText =
                getPlaceSearchText(
                  place
                );

              if (
                queryWords.length ===
                0
              ) {
                return false;
              }

              return queryWords.every(
                (word) =>
                  searchableText.includes(
                    word
                  )
              );
            }
          );

        return {
          pool,
          exactMatches,
          wordMatches,
        };
      }

      const matchingData =
        getMatches(
          convertedPlaces
        );

      const {
        pool,
        exactMatches,
        wordMatches,
      } = matchingData;

      if (pool.length === 0) {
        setSearchResults([]);

        setLocationMessage(
          isArabic
            ? `لم يتم العثور على "${query}" داخل الدولة المختارة.`
            : `No "${query}" was found in the selected country.`
        );

        return;
      }

      let candidates = [];

      if (
        exactMatches.length >
        0
      ) {
        candidates =
          exactMatches;
      } else if (
        wordMatches.length >
        0
      ) {
        candidates =
          wordMatches;
      }

      if (
        candidates.length ===
        0
      ) {
        setSearchResults([]);

        setLocationMessage(
          isArabic
            ? `لم يتم العثور على مكان مطابق لـ "${query}".`
            : `No matching place was found for "${query}".`
        );

        return;
      }

      const sortedCandidates =
        [...candidates].sort(
          (a, b) =>
            a.distance -
            b.distance
        );

      const uniqueCandidates =
        sortedCandidates.filter(
          (
            place,
            index,
            array
          ) =>
            index ===
            array.findIndex(
              (item) =>
                normalizeSearchText(
                  item.name
                ) ===
                  normalizeSearchText(
                    place.name
                  ) &&
                Math.abs(
                  item.latitude -
                    place.latitude
                ) < 0.00001 &&
                Math.abs(
                  item.longitude -
                    place.longitude
                ) < 0.00001
            )
        );

      const nearestBranch =
        uniqueCandidates[0];

      if (!nearestBranch) {
        setSearchResults([]);

        setLocationMessage(
          isArabic
            ? `لم يتم العثور على أقرب فرع لـ "${query}".`
            : `No nearest branch for "${query}" was found.`
        );

        return;
      }

      setSearchResults([
        nearestBranch,
      ]);

      setLocationMessage(
        isArabic
          ? `تم العثور على أقرب فرع لـ "${query}" على بعد ${formatDistance(
              nearestBranch.distance
            )}.`
          : `The nearest branch for "${query}" is ${formatDistance(
              nearestBranch.distance
            )} away.`
      );
    } catch (error) {
      console.error(
        "Nearest search error:",
        error
      );

      setSearchResults([]);

      setLocationMessage(
        isArabic
          ? "تعذر تنفيذ البحث حاليًا. حاولي مرة أخرى."
          : "We couldn't complete the search right now. Please try again."
      );
    } finally {
      setSearchLoading(false);
    }
  }

  function formatDistance(
    distance
  ) {
    if (distance < 1) {
      return isArabic
        ? `${Math.round(
            distance * 1000
          )} متر`
        : `${Math.round(
            distance * 1000
          )} m`;
    }

    return isArabic
      ? `${distance.toFixed(
          1
        )} كم`
      : `${distance.toFixed(
          1
        )} km`;
  }

  /* ================= ESTIMATED CROWD LEVEL ================= */

  // Photon/OpenStreetMap does not provide a live crowd count. This is only a
  // general time/category estimate, so the UI labels it clearly and offers a
  // Google Maps link where Popular Times/live busyness may be available.
  function getCrowdEstimate(place) {
    const hour = currentTime.getHours();
    const day = currentTime.getDay();
    const isWeekend = day === 5 || day === 6;
    const category = place?.category || selectedCategory;
    const inRange = (start, end) => hour >= start && hour < end;
    let score = 0;

    if (category === "Restaurants") {
      if (inRange(13, 15) || inRange(19, 22)) score = 2;
      else if (inRange(12, 13) || inRange(15, 19) || inRange(22, 23)) score = 1;
      if (isWeekend && (inRange(12, 16) || inRange(19, 23))) score = 2;
    } else if (category === "Cafés") {
      if (inRange(17, 22)) score = 2;
      else if (inRange(9, 12) || inRange(14, 17)) score = 1;
      if (isWeekend && inRange(14, 22)) score = 2;
    } else if (category === "Picnic & Sitting") {
      if (isWeekend && inRange(11, 19)) score = 2;
      else if (inRange(15, 19) || (isWeekend && inRange(10, 11))) score = 1;
    } else if (category === "Events") {
      if (isWeekend && inRange(18, 23)) score = 2;
      else if (inRange(17, 22)) score = 1;
    } else if (category === "Fashion") {
      if (isWeekend && inRange(16, 22)) score = 2;
      else if (inRange(15, 21)) score = 1;
    } else if (category === "Beauty") {
      if (isWeekend && inRange(11, 19)) score = 2;
      else if (inRange(16, 20)) score = 1;
    } else {
      if (inRange(17, 21)) score = 1;
    }

    if (score === 2) {
      return {
        level: "busy",
        icon: "👥",
        label: isArabic ? "زحمة متوقعة" : "Likely busy",
        color: "#a3223b",
        background: "#fff0f2",
      };
    }

    if (score === 1) {
      return {
        level: "moderate",
        icon: "👥",
        label: isArabic ? "زحمة متوسطة متوقعة" : "Moderate expected",
        color: "#855600",
        background: "#fff7df",
      };
    }

    return {
      level: "quiet",
      icon: "🌿",
      label: isArabic ? "أهدى غالبًا" : "Likely quieter",
      color: "#216b4b",
      background: "#eaf8f0",
    };
  }

  // Returns open/closed only when the mapped opening-hours syntax is understood.
  // Complex rules such as public holidays or sunrise/sunset deliberately stay unknown.
  function getOpenStatus(place) {
    const raw = String(place?.openingHours || "").trim();
    if (!raw) return "unknown";
    if (/^24\s*\/\s*7$/i.test(raw)) return "open";
    if (/^(off|closed)$/i.test(raw)) return "closed";
    if (/(sunrise|sunset|\bPH\b|\bSH\b|\bopen\b|\bunknown\b)/i.test(raw)) return "unknown";

    const weekdayIndex = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };
    const nowDay = currentTime.getDay();
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const rules = raw.split(";").map((part) => part.trim()).filter(Boolean);
    let sawValidRule = false;
    let appliesToday = false;
    let hasDaySpecificRules = false;

    const inDayRange = (day, start, end) => {
      if (start <= end) return day >= start && day <= end;
      return day >= start || day <= end;
    };

    for (const rule of rules) {
      const timeMatches = [...rule.matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g)];
      const firstTimeIndex = timeMatches.length ? timeMatches[0].index : -1;
      let dayPart = firstTimeIndex >= 0 ? rule.slice(0, firstTimeIndex).trim() : rule.trim();
      dayPart = dayPart.replace(/\b(off|closed)\b/ig, "").trim();
      const isClosedRule = /\b(off|closed)\b/i.test(rule);
      const dayMatches = [...dayPart.matchAll(/\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g)];
      const residue = dayPart.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g, "").replace(/[\s,]+/g, "").trim();

      if (residue) return "unknown";
      const hasSpecificDays = dayMatches.length > 0;
      if (hasSpecificDays) hasDaySpecificRules = true;
      const tailAfterFirstTime = firstTimeIndex >= 0
        ? rule.slice(firstTimeIndex + timeMatches[0][0].length)
        : "";
      // Multiple weekday clauses in one OSM rule are ambiguous for this lightweight parser.
      if (/[,;]\s*(Mo|Tu|We|Th|Fr|Sa|Su)\b/.test(tailAfterFirstTime)) return "unknown";
      const applies = !hasSpecificDays || dayMatches.some((match) => {
        const start = weekdayIndex[match[1]];
        const end = match[2] ? weekdayIndex[match[2]] : start;
        return inDayRange(nowDay, start, end);
      });
      if (timeMatches.length || isClosedRule) sawValidRule = true;
      if (!applies) continue;
      appliesToday = true;

      if (isClosedRule && !timeMatches.length) {
        continue;
      }
      if (!timeMatches.length) return "unknown";
      for (const match of timeMatches) {
        const toMinutes = (value) => {
          const [hours, minutes] = value.split(":").map(Number);
          if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) return null;
          return hours * 60 + minutes;
        };
        const start = toMinutes(match[1]);
        const end = toMinutes(match[2]);
        if (start === null || end === null) return "unknown";
        const isWithin = end >= start
          ? nowMinutes >= start && nowMinutes < end
          : nowMinutes >= start || nowMinutes < end;
        if (isWithin) return "open";
      }
    }

    if (!sawValidRule) return "unknown";
    if (appliesToday || hasDaySpecificRules) return "closed";
    return "unknown";
  }

  function getOpenStatusLabel(place) {
    const status = getOpenStatus(place);
    if (status === "open") return isArabic ? "مفتوح الآن حسب المواعيد المسجلة" : "Open now (listed hours)";
    if (status === "closed") return isArabic ? "مغلق الآن حسب المواعيد المسجلة" : "Closed now (listed hours)";
    return place?.openingHours
      ? (isArabic ? "تعذر تحديد حالة الفتح من المواعيد" : "Could not interpret opening hours")
      : (isArabic ? "مواعيد العمل غير متاحة" : "Opening hours unavailable");
  }

  function openCrowdInfo(place) {
    if (!place) return;
    const searchText = `${place.name || ""} ${place.latitude ?? ""},${place.longitude ?? ""}`.trim();
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }

  function handleSearchKeyDown(
    event
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchNearestPlace();
    }
  }

  /* ================= RESTAURANTS ================= */

  async function getPhotonRestaurants() {
    return getPhotonPlaces(
      "amenity:restaurant"
    );
  }

  async function findRestaurants() {
    if (!userLocation) {
      setLocationMessage(
        isArabic
          ? "اسمحي بالوصول إلى موقعك أولًا."
          : "Please allow location access first."
      );

      return;
    }

    setLoadingPlaces(true);
    setPlaces([]);
    clearSearch();

    setLocationMessage(
      isArabic
        ? "جارٍ البحث عن مطاعم حقيقية قريبة منك..."
        : "Finding real restaurants near you..."
    );

    try {
      const photonResults =
        await getPhotonRestaurants();

      const convertedPlaces =
        photonResults
          .map((feature) =>
            convertPhotonPlace(
              feature,
              "Restaurant"
            )
          )
          .filter(Boolean);

      if (
        convertedPlaces.length ===
        0
      ) {
        setPlaces([]);

        setLocationMessage(
          isArabic
            ? "لم يتم العثور على مطاعم مسماة داخل 15 كم."
            : "No named restaurants were found within 15 km."
        );

        return;
      }

      const uniquePlaces =
        convertedPlaces
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          )
          .filter(
            (
              place,
              index,
              array
            ) =>
              index ===
              array.findIndex(
                (item) =>
                  item.name
                    .toLowerCase()
                    .trim() ===
                  place.name
                    .toLowerCase()
                    .trim()
              )
          )
          .slice(0, 20);

      setPlaces(uniquePlaces);

      setLocationMessage(
        isArabic
          ? `تم العثور على ${uniquePlaces.length} مطاعم قريبة منك.`
          : `Found ${uniquePlaces.length} nearby restaurants.`
      );
    } catch (error) {
      console.error(
        "Restaurant search error:",
        error
      );

      setPlaces([]);

      setLocationMessage(
        isArabic
          ? "تعذر تحميل المطاعم القريبة حاليًا. حاولي مرة أخرى."
          : "We couldn't load nearby restaurants right now. Please try again."
      );
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* ================= CAFÉS ================= */

  async function getPhotonCafes() {
    return getPhotonPlaces(
      "amenity:cafe"
    );
  }

  async function findCafes() {
    if (!userLocation) {
      setLocationMessage(
        isArabic
          ? "اسمحي بالوصول إلى موقعك أولًا."
          : "Please allow location access first."
      );

      return;
    }

    setLoadingPlaces(true);
    setPlaces([]);
    clearSearch();

    setLocationMessage(
      isArabic
        ? "جارٍ البحث عن كافيهات حقيقية قريبة منك..."
        : "Finding real cafés near you..."
    );

    try {
      const photonResults =
        await getPhotonCafes();

      const convertedPlaces =
        photonResults
          .map((feature) =>
            convertPhotonPlace(
              feature,
              "Café"
            )
          )
          .filter(Boolean);

      if (
        convertedPlaces.length ===
        0
      ) {
        setPlaces([]);

        setLocationMessage(
          isArabic
            ? "لم يتم العثور على كافيهات مسماة داخل 15 كم."
            : "No named cafés were found within 15 km."
        );

        return;
      }

      const uniquePlaces =
        convertedPlaces
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          )
          .filter(
            (
              place,
              index,
              array
            ) =>
              index ===
              array.findIndex(
                (item) =>
                  item.name
                    .toLowerCase()
                    .trim() ===
                  place.name
                    .toLowerCase()
                    .trim()
              )
          )
          .slice(0, 20);

      setPlaces(uniquePlaces);

      setLocationMessage(
        isArabic
          ? `تم العثور على ${uniquePlaces.length} كافيهات قريبة منك.`
          : `Found ${uniquePlaces.length} nearby cafés.`
      );
    } catch (error) {
      console.error(
        "Café search error:",
        error
      );

      setPlaces([]);

      setLocationMessage(
        isArabic
          ? "تعذر تحميل الكافيهات القريبة حاليًا. حاولي مرة أخرى."
          : "We couldn't load nearby cafés right now. Please try again."
      );
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* ================= PICNIC & SITTING ================= */

  async function getPhotonPicnicPlaces() {
    const parkResults =
      await getPhotonPlaces(
        "leisure:park"
      );

    const picnicResults =
      await getPhotonPlaces(
        "tourism:picnic_site"
      );

    return [
      ...parkResults,
      ...picnicResults,
    ];
  }

  async function findPicnicPlaces() {
    if (!userLocation) {
      setLocationMessage(
        isArabic
          ? "اسمحي بالوصول إلى موقعك أولًا."
          : "Please allow location access first."
      );

      return;
    }

    setLoadingPlaces(true);
    setPlaces([]);
    clearSearch();

    setLocationMessage(
      isArabic
        ? "جارٍ البحث عن أماكن نزهات وجلوس حقيقية قريبة منك..."
        : "Finding real picnic & sitting places near you..."
    );

    try {
      const photonResults =
        await getPhotonPicnicPlaces();

      const convertedPlaces =
        photonResults
          .map((feature) =>
            convertPhotonPlace(
              feature,
              "Picnic & Sitting"
            )
          )
          .filter(Boolean);

      if (
        convertedPlaces.length ===
        0
      ) {
        setPlaces([]);

        setLocationMessage(
          isArabic
            ? "لم يتم العثور على أماكن نزهات وجلوس مسماة داخل 15 كم."
            : "No named picnic & sitting places were found within 15 km."
        );

        return;
      }

      const uniquePlaces =
        convertedPlaces
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          )
          .filter(
            (
              place,
              index,
              array
            ) =>
              index ===
              array.findIndex(
                (item) =>
                  item.name
                    .toLowerCase()
                    .trim() ===
                  place.name
                    .toLowerCase()
                    .trim()
              )
          )
          .slice(0, 20);

      setPlaces(uniquePlaces);

      setLocationMessage(
        isArabic
          ? `تم العثور على ${uniquePlaces.length} أماكن نزهات وجلوس قريبة منك.`
          : `Found ${uniquePlaces.length} nearby picnic & sitting places.`
      );
    } catch (error) {
      console.error(
        "Picnic search error:",
        error
      );

      setPlaces([]);

      setLocationMessage(
        isArabic
          ? "تعذر تحميل أماكن النزهات القريبة حاليًا. حاولي مرة أخرى."
          : "We couldn't load nearby picnic places right now. Please try again."
      );
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* ================= EVENTS ================= */

  async function getPhotonEvents() {
    const eventTags = [
      "amenity:theatre",
      "amenity:cinema",
      "amenity:arts_centre",
      "amenity:community_centre",
      "amenity:nightclub",
      "tourism:attraction",
    ];

    const results =
      await Promise.all(
        eventTags.map((tag) =>
          getPhotonPlaces(tag)
        )
      );

    return results.flat();
  }

  async function findEvents() {
    if (!userLocation) {
      setLocationMessage(
        isArabic
          ? "اسمحي بالوصول إلى موقعك أولًا."
          : "Please allow location access first."
      );

      return;
    }

    setLoadingPlaces(true);
    setPlaces([]);
    clearSearch();

    setLocationMessage(
      isArabic
        ? "جارٍ البحث عن أماكن الفعاليات والترفيه القريبة منك..."
        : "Finding real events and entertainment places near you..."
    );

    try {
      const photonResults =
        await getPhotonEvents();

      const convertedPlaces =
        photonResults
          .map((feature) =>
            convertPhotonPlace(
              feature,
              "Event"
            )
          )
          .filter(Boolean);

      if (
        convertedPlaces.length ===
        0
      ) {
        setPlaces([]);

        setLocationMessage(
          isArabic
            ? "لم يتم العثور على أماكن فعاليات مسماة داخل 15 كم."
            : "No named event places were found within 15 km."
        );

        return;
      }

      const uniquePlaces =
        convertedPlaces
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          )
          .filter(
            (
              place,
              index,
              array
            ) =>
              index ===
              array.findIndex(
                (item) =>
                  item.name
                    .toLowerCase()
                    .trim() ===
                  place.name
                    .toLowerCase()
                    .trim()
              )
          )
          .slice(0, 20);

      setPlaces(uniquePlaces);

      setLocationMessage(
        isArabic
          ? `تم العثور على ${uniquePlaces.length} أماكن فعاليات قريبة منك.`
          : `Found ${uniquePlaces.length} nearby event places.`
      );
    } catch (error) {
      console.error(
        "Events search error:",
        error
      );

      setPlaces([]);

      setLocationMessage(
        isArabic
          ? "تعذر تحميل أماكن الفعاليات القريبة حاليًا. حاولي مرة أخرى."
          : "We couldn't load nearby events right now. Please try again."
      );
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* ================= FASHION ================= */

  async function getPhotonFashionPlaces() {
    const clothingResults =
      await getPhotonPlaces(
        "shop:clothes"
      );

    const shoesResults =
      await getPhotonPlaces(
        "shop:shoes"
      );

    const accessoriesResults =
      await getPhotonPlaces(
        "shop:fashion_accessories"
      );

    const departmentResults =
      await getPhotonPlaces(
        "shop:department_store"
      );

    return [
      ...clothingResults,
      ...shoesResults,
      ...accessoriesResults,
      ...departmentResults,
    ];
  }

  async function findFashionPlaces() {
    if (!userLocation) {
      setLocationMessage(
        isArabic
          ? "اسمحي بالوصول إلى موقعك أولًا."
          : "Please allow location access first."
      );

      return;
    }

    setLoadingPlaces(true);
    setPlaces([]);
    clearSearch();

    setLocationMessage(
      isArabic
        ? "جارٍ البحث عن محلات موضة حقيقية قريبة منك..."
        : "Finding real fashion stores near you..."
    );

    try {
      const photonResults =
        await getPhotonFashionPlaces();

      const convertedPlaces =
        photonResults
          .map((feature) =>
            convertPhotonPlace(
              feature,
              "Fashion"
            )
          )
          .filter(Boolean);

      if (
        convertedPlaces.length ===
        0
      ) {
        setPlaces([]);

        setLocationMessage(
          isArabic
            ? "لم يتم العثور على محلات موضة مسماة داخل 15 كم."
            : "No named fashion stores were found within 15 km."
        );

        return;
      }

      const uniquePlaces =
        convertedPlaces
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          )
          .filter(
            (
              place,
              index,
              array
            ) =>
              index ===
              array.findIndex(
                (item) =>
                  item.name
                    .toLowerCase()
                    .trim() ===
                  place.name
                    .toLowerCase()
                    .trim()
              )
          )
          .slice(0, 20);

      setPlaces(uniquePlaces);

      setLocationMessage(
        isArabic
          ? `تم العثور على ${uniquePlaces.length} محلات موضة قريبة منك.`
          : `Found ${uniquePlaces.length} nearby fashion stores.`
      );
    } catch (error) {
      console.error(
        "Fashion search error:",
        error
      );

      setPlaces([]);

      setLocationMessage(
        isArabic
          ? "تعذر تحميل محلات الموضة القريبة حاليًا. حاولي مرة أخرى."
          : "We couldn't load nearby fashion stores right now. Please try again."
      );
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* ================= BEAUTY ================= */

  async function getPhotonBeautyPlaces() {
    const beautyResults =
      await getPhotonPlaces(
        "shop:beauty"
      );

    const cosmeticsResults =
      await getPhotonPlaces(
        "shop:cosmetics"
      );

    const hairdresserResults =
      await getPhotonPlaces(
        "shop:hairdresser"
      );

    const perfumeryResults =
      await getPhotonPlaces(
        "shop:perfumery"
      );

    return [
      ...beautyResults,
      ...cosmeticsResults,
      ...hairdresserResults,
      ...perfumeryResults,
    ];
  }

  async function findBeautyPlaces() {
    if (!userLocation) {
      setLocationMessage(
        isArabic
          ? "اسمحي بالوصول إلى موقعك أولًا."
          : "Please allow location access first."
      );

      return;
    }

    setLoadingPlaces(true);
    setPlaces([]);
    clearSearch();

    setLocationMessage(
      isArabic
        ? "جارٍ البحث عن أماكن جمال حقيقية قريبة منك..."
        : "Finding real beauty places near you..."
    );

    try {
      const photonResults =
        await getPhotonBeautyPlaces();

      const convertedPlaces =
        photonResults
          .map((feature) =>
            convertPhotonPlace(
              feature,
              "Beauty"
            )
          )
          .filter(Boolean);

      if (
        convertedPlaces.length ===
        0
      ) {
        setPlaces([]);

        setLocationMessage(
          isArabic
            ? "لم يتم العثور على أماكن جمال مسماة داخل 15 كم."
            : "No named beauty places were found within 15 km."
        );

        return;
      }

      const uniquePlaces =
        convertedPlaces
          .sort(
            (a, b) =>
              a.distance -
              b.distance
          )
          .filter(
            (
              place,
              index,
              array
            ) =>
              index ===
              array.findIndex(
                (item) =>
                  item.name
                    .toLowerCase()
                    .trim() ===
                  place.name
                    .toLowerCase()
                    .trim()
              )
          )
          .slice(0, 20);

      setPlaces(uniquePlaces);

      setLocationMessage(
        isArabic
          ? `تم العثور على ${uniquePlaces.length} أماكن جمال قريبة منك.`
          : `Found ${uniquePlaces.length} nearby beauty places.`
      );
    } catch (error) {
      console.error(
        "Beauty search error:",
        error
      );

      setPlaces([]);

      setLocationMessage(
        isArabic
          ? "تعذر تحميل أماكن الجمال القريبة حاليًا. حاولي مرة أخرى."
          : "We couldn't load nearby beauty places right now. Please try again."
      );
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* ================= IMAGES ================= */

  function getRestaurantImage(
    place
  ) {
    const text = (
      `${place.name || ""} ${place.cuisine || ""}`
    ).toLowerCase();

    if (
      text.includes("seafood") ||
      text.includes("fish") ||
      text.includes("سمك") ||
      text.includes("أسماك") ||
      text.includes("اسماك") ||
      text.includes("بحر") ||
      text.includes("جمبرى") ||
      text.includes("جمبري") ||
      text.includes("shrimp") ||
      text.includes("prawn")
    ) {
      return "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("pizza") ||
      text.includes("بيتزا")
    ) {
      return "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("burger") ||
      text.includes("برجر") ||
      text.includes(
        "hamburger"
      )
    ) {
      return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("chicken") ||
      text.includes("فراخ") ||
      text.includes("دجاج")
    ) {
      return "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("pasta") ||
      text.includes("italian") ||
      text.includes("مكرونة") ||
      text.includes("باستا") ||
      text.includes("إيطالي") ||
      text.includes("ايطالي")
    ) {
      return "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("steak") ||
      text.includes("grill") ||
      text.includes("grilled") ||
      text.includes("مشويات") ||
      text.includes("ستيك") ||
      text.includes("مشوي")
    ) {
      return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("sushi") ||
      text.includes("سوشي")
    ) {
      return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("coffee") ||
      text.includes("cafe") ||
      text.includes("café") ||
      text.includes("قهوة") ||
      text.includes("كافيه") ||
      text.includes("كوفي")
    ) {
      return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85";
    }

    if (
      text.includes("dessert") ||
      text.includes("حلويات") ||
      text.includes("cake") ||
      text.includes("كيك")
    ) {
      return "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85";
    }

    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85";
  }

  function getCafeImage() {
    return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=85";
  }

  function getPicnicImage() {
    return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85";
  }

  function getEventImage() {
    return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85";
  }

  function getFashionImage() {
    return "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85";
  }

  function getBeautyImage() {
    return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85";
  }

  function getDisplayPlaceName(place) {
    return isArabic && place?.nameAr ? place.nameAr : (place?.name || "");
  }

  function getPlaceImage(place) {
    if (place?.photoUrl && /^https?:\/\//i.test(place.photoUrl)) {
      return place.photoUrl;
    }

    const category = place?.category || selectedCategory;
    if (category === "Cafés") return getCafeImage();
    if (category === "Picnic & Sitting") return getPicnicImage();
    if (category === "Events") return getEventImage();
    if (category === "Fashion") return getFashionImage();
    if (category === "Beauty") return getBeautyImage();
    return getRestaurantImage(place || {});
  }

  // If a mapped place is linked to an exact Wikidata item, try to obtain its
  // specifically associated Wikimedia Commons photo. Failures are harmless:
  // the UI keeps the clearly labelled illustrative category image instead.
  useEffect(() => {
    let cancelled = false;
    const pending = places
      .filter((place) => place?.wikidataId && !place.photoUrl && !place.photoLookupDone)
      .slice(0, 12);
    if (!pending.length) return () => { cancelled = true; };

    const updatePhotos = async () => {
      const updates = await Promise.all(pending.map(async (place) => ({
        id: place.id,
        ...(await fetchVerifiedWikidataPhoto(place.wikidataId)),
        photoLookupDone: true,
      })));

      if (cancelled) return;
      setPlaces((current) => current.map((place) => {
        const update = updates.find((item) => String(item.id) === String(place.id));
        if (!update) return place;
        return {
          ...place,
          photoUrl: place.photoUrl || update.photoUrl,
          photoSource: place.photoSource || update.photoSource,
          photoAttribution: place.photoAttribution || update.photoAttribution,
          photoAttributionUrl: place.photoAttributionUrl || update.photoAttributionUrl,
          photoLookupDone: true,
        };
      }));
    };

    updatePhotos();
    return () => { cancelled = true; };
  }, [places]);

  useEffect(() => {
    let cancelled = false;
    const pending = searchResults
      .filter((place) => place?.wikidataId && !place.photoUrl && !place.photoLookupDone)
      .slice(0, 6);
    if (!pending.length) return () => { cancelled = true; };

    const updatePhotos = async () => {
      const updates = await Promise.all(pending.map(async (place) => ({
        id: place.id,
        ...(await fetchVerifiedWikidataPhoto(place.wikidataId)),
        photoLookupDone: true,
      })));
      if (cancelled) return;
      setSearchResults((current) => current.map((place) => {
        const update = updates.find((item) => String(item.id) === String(place.id));
        return update ? {
          ...place,
          photoUrl: place.photoUrl || update.photoUrl,
          photoSource: place.photoSource || update.photoSource,
          photoAttribution: place.photoAttribution || update.photoAttribution,
          photoAttributionUrl: place.photoAttributionUrl || update.photoAttributionUrl,
          photoLookupDone: true,
        } : place;
      }));
    };
    updatePhotos();
    return () => { cancelled = true; };
  }, [searchResults]);

  /* ================= CATEGORY ================= */

  function selectCategory(
    category
  ) {
    setShowFavoritesOnly(false);
    navigateTo("places");
    setSelectedCategory(category);
    setNearbyFilterTerm("");
    setSortOption("nearest");
    setPlaces([]);
    clearSearch();

    if (
      category ===
      "Restaurants"
    ) {
      findRestaurants();
    }

    if (
      category ===
      "Cafés"
    ) {
      findCafes();
    }

    if (
      category ===
      "Picnic & Sitting"
    ) {
      findPicnicPlaces();
    }

    if (
      category ===
      "Events"
    ) {
      findEvents();
    }

    if (
      category ===
      "Fashion"
    ) {
      findFashionPlaces();
    }

    if (
      category ===
      "Beauty"
    ) {
      findBeautyPlaces();
    }
  }

  // If a category was chosen while GPS was still loading, load its places
  // as soon as the location becomes available.
  useEffect(() => {
    if (!userLocation || !selectedCountry || !selectedCategory || showFavoritesOnly) {
      return;
    }

    if (selectedCategory === "Restaurants") {
      findRestaurants();
    } else if (selectedCategory === "Cafés") {
      findCafes();
    } else if (selectedCategory === "Picnic & Sitting") {
      findPicnicPlaces();
    } else if (selectedCategory === "Events") {
      findEvents();
    } else if (selectedCategory === "Fashion") {
      findFashionPlaces();
    } else if (selectedCategory === "Beauty") {
      findBeautyPlaces();
    }
  }, [userLocation]);

  function openDirections(
    latitude,
    longitude
  ) {
    const mapsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${latitude},${longitude}`;

    window.open(
      mapsUrl,
      "_blank"
    );
  }

  const isRealPlacesCategory =
    selectedCategory === "Restaurants" ||
    selectedCategory === "Cafés" ||
    selectedCategory === "Picnic & Sitting" ||
    selectedCategory === "Events" ||
    selectedCategory === "Fashion" ||
    selectedCategory === "Beauty" ||
    selectedCategory === "Favorites";

  const categoryName =
    selectedCategory ===
    "Cafés"
      ? isArabic
        ? "الكافيهات"
        : "cafés"
      : selectedCategory ===
        "Picnic & Sitting"
      ? isArabic
        ? "أماكن النزهات والجلوس"
        : "picnic & sitting places"
      : selectedCategory ===
        "Events"
      ? isArabic
        ? "أماكن الفعاليات"
        : "event places"
      : selectedCategory ===
        "Fashion"
      ? isArabic
        ? "محلات الموضة"
        : "fashion stores"
      : selectedCategory === "Favorites"
      ? isArabic ? "الأماكن المفضلة" : "favorite places"
      : isArabic
      ? "المطاعم"
      : "restaurants";

  const visiblePlaceSource = showFavoritesOnly ? favorites : (hasSearched ? searchResults : places);
  const normalizedNearbyTerm = normalizeSearchText(nearbyFilterTerm);
  const availablePlaceTypes = [...new Set(visiblePlaceSource
    .map((place) => String(place.osmValue || place.cuisine || "").trim())
    .filter((value) => value && !["Restaurant", "Café", "Fashion", "Beauty", "Event", "Picnic & Sitting"].includes(value)))].sort((a, b) => a.localeCompare(b));

  const filteredPlaces = visiblePlaceSource
    .filter((place) => {
      const allSearchableText = normalizeSearchText([
        place.name,
        place.address,
        place.cuisine,
        place.osmValue,
        ...(Array.isArray(place.searchAliases) ? place.searchAliases : []),
      ].filter(Boolean).join(" "));
      const matchesSearch = hasSearched || !normalizedNearbyTerm || allSearchableText.includes(normalizedNearbyTerm);
      const matchesDistance = showFavoritesOnly || hasSearched || Number(place.distance) <= Number(distanceFilter);
      const placeType = String(place.osmValue || place.cuisine || "").trim();
      const matchesType = hasSearched || typeFilter === "all" || placeType === typeFilter;
      const matchesOpenStatus = hasSearched || !openNowOnly || getOpenStatus(place) === "open";
      return matchesSearch && matchesDistance && matchesType && matchesOpenStatus;
    })
    .sort((a, b) => {
      if (sortOption === "rating") {
        const ratingDifference = getPlaceRating(b) - getPlaceRating(a);
        if (ratingDifference !== 0) return ratingDifference;
      }
      if (sortOption === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""), isArabic ? "ar" : "en");
      }
      return Number(a.distance ?? Infinity) - Number(b.distance ?? Infinity);
    });

  const placesToDisplay = filteredPlaces;

  const pageContext = {
    addToOuting,
    availablePlaceTypes,
    calculateDistance,
    categories,
    categoryDescription,
    categoryName,
    categoryTitle,
    categoryTranslations,
    chooseCountry,
    clearSearch,
    convertPhotonPlace,
    countries,
    countryTranslations,
    currentPage,
    currentTime,
    deleteOutingPlan,
    displayCountry,
    distanceFilter,
    favorites,
    filteredPlaces,
    findBeautyPlaces,
    findCafes,
    findEvents,
    findFashionPlaces,
    findPicnicPlaces,
    findRestaurants,
    formatDistance,
    getBeautyImage,
    getCafeImage,
    getCountryCode,
    getCrowdEstimate,
    getDisplayPlaceName,
    getEventImage,
    getFashionImage,
    getOpenStatus,
    getOpenStatusLabel,
    getPhotonBeautyPlaces,
    getPhotonCafes,
    getPhotonEvents,
    getPhotonFashionPlaces,
    getPhotonPicnicPlaces,
    getPhotonPlaces,
    getPhotonRestaurants,
    getPhotonSearchPlaces,
    getPicnicImage,
    getPlaceImage,
    getPlaceRating,
    getPlaceRatingKey,
    getRestaurantImage,
    getSearchTags,
    getSearchVariants,
    getUserLocation,
    goHome,
    goPlaces,
    goToNavbarCategory,
    handleInstallApp,
    handleSearchKeyDown,
    hasSearched,
    installMessage,
    installPromptEvent,
    isAppInstalled,
    isArabic,
    isFavorite,
    isInOuting,
    isRealPlacesCategory,
    language,
    loadOutingPlan,
    loadingPlaces,
    locationMessage,
    locationRequestStarted,
    moveOutingStop,
    navigateTo,
    nearbyFilterTerm,
    normalizeArabic,
    normalizeSearchText,
    normalizedNearbyTerm,
    openCrowdInfo,
    openDirections,
    openFavorites,
    openNowOnly,
    openOutingDirections,
    openPlaceDetails,
    outingMessage,
    outingName,
    outingStops,
    photonForwardSearch,
    placeMatchesCategory,
    placeRatings,
    places,
    placesToDisplay,
    previousPageRef,
    removeOutingStop,
    saveOutingPlan,
    savePlaceRating,
    savedOutingPlans,
    searchLoading,
    searchNearestPlace,
    searchResults,
    searchTerm,
    selectCategory,
    selectedCategory,
    selectedCountry,
    selectedPlace,
    setCurrentPage,
    setCurrentTime,
    setDistanceFilter,
    setFavorites,
    setHasSearched,
    setInstallMessage,
    setInstallPromptEvent,
    setIsAppInstalled,
    setLanguage,
    setLoadingPlaces,
    setLocationMessage,
    setNearbyFilterTerm,
    setOpenNowOnly,
    setOutingMessage,
    setOutingName,
    setOutingStops,
    setPlaceRatings,
    setPlaces,
    setSavedOutingPlans,
    setSearchLoading,
    setSearchResults,
    setSearchTerm,
    setSelectedCategory,
    setSelectedCountry,
    setSelectedPlace,
    setShowCountries,
    setShowFavoritesOnly,
    setShowOutingPanel,
    setSortOption,
    setTypeFilter,
    setUserLocation,
    setViewMode,
    showCountries,
    showFavoritesOnly,
    showOutingPanel,
    sortOption,
    toggleFavorite,
    toggleLanguage,
    toggleOutingPlanner,
    typeFilter,
    userLocation,
    viewMode,
    visiblePlaceSource,
  };

  return (
    <AppContext.Provider value={pageContext}>
    <div
      className="app"
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
    >
      <style>{`
        .app { min-width: 0; }
        .app[dir="rtl"] { text-align: right; }
        .app[dir="ltr"] { text-align: left; }
        .app[dir="rtl"] input:not([type="checkbox"]):not([type="radio"]),
        .app[dir="rtl"] textarea,
        .app[dir="rtl"] select { direction: rtl; text-align: right; }
        .app[dir="ltr"] input:not([type="checkbox"]):not([type="radio"]),
        .app[dir="ltr"] textarea,
        .app[dir="ltr"] select { direction: ltr; text-align: left; }
        .app[dir="rtl"] .navbar, .app[dir="rtl"] .navbar nav { direction: rtl; }
        .app[dir="ltr"] .navbar, .app[dir="ltr"] .navbar nav { direction: ltr; }
        .app[dir="rtl"] .leaflet-popup-content { direction: rtl; text-align: right; }
        .app[dir="ltr"] .leaflet-popup-content { direction: ltr; text-align: left; }
        .app .leaflet-container, .app .leaflet-control-container { direction: ltr; }
        .app .install-message { margin: 8px 16px 0; padding: 11px 14px; border: 1px solid #e6dafa; border-radius: 12px; background: #faf7ff; color: #4f2a89; line-height: 1.7; font-size: 13px; }
        .app[dir="rtl"] .modal-description, .app[dir="rtl"] .location-status p { text-align: right; }
        .app .install-app-btn { white-space: nowrap; min-height: 40px; }
        @media (max-width: 740px) {
          .app .navbar { flex-wrap: wrap; gap: 10px; }
          .app .navbar nav { max-width: 100%; overflow-x: auto; }
          .app .install-app-btn { flex: 0 0 auto; }
        }
      `}</style>
      {installMessage && (
        <div className="install-message" role="status" aria-live="polite">
          {installMessage}
          <button type="button" onClick={() => setInstallMessage("")} aria-label={isArabic ? "إغلاق" : "Dismiss"} style={{ marginInlineStart: "12px", border: 0, background: "transparent", color: "inherit", fontWeight: 800, cursor: "pointer" }}>×</button>
        </div>
      )}
      <Navbar />

      <main>
        {currentPage === "home" && <HomePage />}

        {currentPage === "outing" && <OutingPlannerPage />}

        {(currentPage === "places" || currentPage === "favorites") && <ExplorePage />}
      </main>

      {currentPage === "details" && selectedPlace && <PlaceDetailsModal />}

      <CountryPickerModal />
    </div>
    </AppContext.Provider>
  );
}

export default App;