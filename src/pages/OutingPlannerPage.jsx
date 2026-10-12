import { useAppContext } from "../AppContext.jsx";

export default function OutingPlannerPage() {
  const {
    deleteOutingPlan,
    formatDistance,
    isArabic,
    loadOutingPlan,
    moveOutingStop,
    openOutingDirections,
    outingMessage,
    outingName,
    outingStops,
    removeOutingStop,
    saveOutingPlan,
    savedOutingPlans,
    setOutingMessage,
    setOutingName,
    setOutingStops,
  } = useAppContext();

  return (
    <section id="outing-planner" className="places-section" style={{ marginTop: "28px", scrollMarginTop: "24px" }}>
            <div className="section-header">
              <p>{isArabic ? "خطتك المحفوظة على جهازك" : "SAVED LOCALLY ON THIS DEVICE"}</p>
              <h2>{isArabic ? "خططي لخروجة كاملة" : "Plan an outing"}</h2>
              <p className="places-description">
                {isArabic
                  ? "ضيفي مطعمًا وكافيهًا أو أي أماكن من الكروت، رتّبي زيارتك، واحفظي خطتك في هذا المتصفح من غير حساب أو Firebase."
                  : "Add restaurants, cafés, parks, or other places from the cards, arrange your stops, and save the plan in this browser—no account or Firebase needed."}
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <input
                value={outingName}
                onChange={(event) => setOutingName(event.target.value)}
                placeholder={isArabic ? "اسم الخروجة (اختياري)" : "Outing name (optional)"}
                aria-label={isArabic ? "اسم الخروجة" : "Outing name"}
                style={{ flex: "1 1 240px", minWidth: 0, padding: "13px 15px", borderRadius: "12px", border: "1px solid #e3d9f5", fontSize: "15px", background: "#fff" }}
              />
              <button type="button" className="primary-btn" onClick={saveOutingPlan} disabled={!outingStops.length} style={{ opacity: outingStops.length ? 1 : 0.55 }}>
                💾 {isArabic ? "حفظ الخطة" : "Save plan"}
              </button>
              <button type="button" className="secondary-btn" onClick={() => openOutingDirections()} disabled={!outingStops.length} style={{ opacity: outingStops.length ? 1 : 0.55 }}>
                📍 {isArabic ? "افتح مسار الخروجة" : "Open route"}
              </button>
              <button type="button" className="secondary-btn" onClick={() => { setOutingStops([]); setOutingMessage(isArabic ? "اتمسحت المحطات الحالية." : "Current stops cleared."); }} disabled={!outingStops.length}>
                {isArabic ? "مسح المحطات" : "Clear stops"}
              </button>
            </div>

            {outingMessage && <p role="status" aria-live="polite" style={{ margin: "0 0 14px", color: "#5b2eb8", fontWeight: 650 }}>{outingMessage}</p>}

            {outingStops.length ? (
              <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
                {outingStops.map((place, index) => (
                  <div key={`${place.id}-${index}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px", border: "1px solid #eee7fb", borderRadius: "14px", background: "#fff", flexWrap: "wrap" }}>
                    <span style={{ width: "34px", height: "34px", flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", background: "#6c35de", color: "#fff", fontWeight: 800 }}>{index + 1}</span>
                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <strong style={{ display: "block", color: "#2b2040", overflowWrap: "anywhere" }}>{place.name}</strong>
                      <span style={{ color: "#746a84", fontSize: "12px" }}>{place.address || (isArabic ? "العنوان غير متاح" : "Address unavailable")} · {formatDistance(Number(place.distance) || 0)}</span>
                    </div>
                    <button type="button" className="secondary-btn" onClick={() => moveOutingStop(index, -1)} disabled={index === 0} aria-label={isArabic ? "تحريك للأعلى" : "Move up"} style={{ padding: "8px 10px" }}>↑</button>
                    <button type="button" className="secondary-btn" onClick={() => moveOutingStop(index, 1)} disabled={index === outingStops.length - 1} aria-label={isArabic ? "تحريك للأسفل" : "Move down"} style={{ padding: "8px 10px" }}>↓</button>
                    <button type="button" className="secondary-btn" onClick={() => removeOutingStop(place.id)} style={{ padding: "8px 10px", color: "#a3223b" }}>{isArabic ? "إزالة" : "Remove"}</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#746a84", padding: "14px 0" }}>{isArabic ? "لسه مفيش محطات. افتحي أي كارت مكان واضغطي «إضافة لخطة الخروجة»." : "No stops yet. Open any place card and choose “Add to outing”."}</p>
            )}

            <div style={{ borderTop: "1px solid #eee7fb", paddingTop: "18px", marginTop: "8px" }}>
              <h3 style={{ margin: "0 0 13px", color: "#2b2040" }}>{isArabic ? "الخطط المحفوظة على هذا الجهاز" : "Saved plans on this device"}</h3>
              {savedOutingPlans.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {savedOutingPlans.map((plan) => (
                    <div key={plan.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", border: "1px solid #eee7fb", borderRadius: "13px", padding: "12px", background: "#fbf9ff" }}>
                      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <strong style={{ display: "block", overflowWrap: "anywhere" }}>{plan.name}</strong>
                        <span style={{ fontSize: "12px", color: "#746a84" }}>{isArabic ? `${plan.stops?.length || 0} محطة` : `${plan.stops?.length || 0} stops`}</span>
                      </div>
                      <button type="button" className="primary-btn" onClick={() => loadOutingPlan(plan)}>{isArabic ? "فتح الخطة" : "Load plan"}</button>
                      <button type="button" className="secondary-btn" onClick={() => openOutingDirections(plan.stops || [])}>{isArabic ? "المسار ↗" : "Route ↗"}</button>
                      <button type="button" className="secondary-btn" onClick={() => deleteOutingPlan(plan.id)} style={{ color: "#a3223b" }}>{isArabic ? "حذف" : "Delete"}</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: "#746a84" }}>{isArabic ? "لما تحفظي أول خطة هتظهر هنا." : "Your saved plans will appear here."}</p>
              )}
            </div>
          </section>
  );
}
