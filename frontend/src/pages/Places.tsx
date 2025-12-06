import { useEffect, useMemo, useState } from "react";
import { BACKEND_BASE_PATH } from "../constants/Navigation";
import { getCollections, createCollection, addLocationToCollection } from "../utils/api";

type PlaceSummary = {
    name: string;
    address: string;
    placeId: string;
    lat?: number;
    lng?: number;
    rating?: number;
    photoRef?: string;
};

type PlaceDetail = PlaceSummary & {
    phone?: string;
    website?: string;
    hours?: { weekday_text?: string[] };
};

const staticMapKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const defaultCoords = { lat: 37.7749, lng: -122.4194 }; // fallback to SF if geolocation denied
const CURRENT_USER_ID = "test-user";

const PlacesPage = () => {
    const [query, setQuery] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [results, setResults] = useState<PlaceSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selected, setSelected] = useState<PlaceSummary | null>(null);
    const [detail, setDetail] = useState<PlaceDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    // Get user location once, with fallback
    useEffect(() => {
        if (!navigator.geolocation) {
            setCoords(defaultCoords);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setCoords(defaultCoords),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query.trim() || !coords) {
            setResults([]);
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const url = new URL(`${BACKEND_BASE_PATH}/places/search`);
                url.searchParams.set("query", query.trim());
                url.searchParams.set("lat", coords.lat.toString());
                url.searchParams.set("lng", coords.lng.toString());
                const response = await fetch(url.toString(), { signal: controller.signal });
                if (!response.ok) throw new Error("Search request failed");
                const data = (await response.json()) as PlaceSummary[];
                setResults(data);
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setError("Unable to load results");
                }
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, coords]);

    // Load details when a result is selected
    useEffect(() => {
        if (!selected) {
            setDetail(null);
            return;
        }
        const controller = new AbortController();
        (async () => {
            setDetailLoading(true);
            setDetailError(null);
            try {
                const response = await fetch(`${BACKEND_BASE_PATH}/places/${selected.placeId}`, {
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error("Details request failed");
                const data = (await response.json()) as PlaceDetail;
                setDetail({ ...selected, ...data });
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setDetailError("Unable to load details");
                }
            } finally {
            setDetailLoading(false);
            }
        })();

        return () => controller.abort();
    }, [selected]);

    // reset save state when selecting a new place
    useEffect(() => {
        setSaved(false);
        setSaveMessage(null);
    }, [detail?.placeId]);

    const ensureDefaultCollection = async (): Promise<string> => {
        const collections = await getCollections(CURRENT_USER_ID);
        if (collections.length > 0) return collections[0].id;
        const created = await createCollection(CURRENT_USER_ID, "Saved Places", "Places I want to visit");
        return created.id;
    };

    const handleSave = async () => {
        if (!detail) return;
        setSaving(true);
        setSaveMessage(null);
        try {
            const collectionId = await ensureDefaultCollection();
            await addLocationToCollection(CURRENT_USER_ID, collectionId, detail.name, detail.address);
            setSaveMessage("Saved to your list");
            setSaved(true);
        } catch (err) {
            console.error("Error saving place:", err);
            setSaveMessage("Failed to save place");
            setSaved(false);
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    const previewImage = useMemo(() => {
        if (!staticMapKey || !detail) return null;
        if (detail.photoRef) {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=500&photo_reference=${detail.photoRef}&key=${staticMapKey}`;
        }
        if (detail.lat && detail.lng) {
            return `https://maps.googleapis.com/maps/api/staticmap?center=${detail.lat},${detail.lng}&zoom=15&size=500x260&markers=${detail.lat},${detail.lng}&key=${staticMapKey}`;
        }
        return null;
    }, [detail]);

    return (
        <div className="places-page" style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
            <h1 style={{ marginBottom: "0.5rem" }}>Find places nearby</h1>
            <p style={{ marginBottom: "1rem", color: "#555" }}>
                Search for a category (e.g., "coffee", "museum"). Results use your location or fall back to San Francisco.
            </p>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places..."
                style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid #ccc", marginBottom: "0.75rem" }}
            />
            {loading && <p>Searching...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "1rem" }}>
                <div>
                    <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Results</h2>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid #eee", borderRadius: 8 }}>
                        {results.map((r) => (
                            <li
                                key={r.placeId}
                                onClick={() => setSelected(r)}
                                style={{
                                    padding: "0.75rem",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f2f2f2",
                                    background: selected?.placeId === r.placeId ? "#f5f8ff" : "white",
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>{r.name}</div>
                                <div style={{ fontSize: "0.9rem", color: "#555" }}>{r.address}</div>
                                {r.rating && <div style={{ fontSize: "0.85rem", color: "#222" }}>Rating: {r.rating}</div>}
                            </li>
                        ))}
                        {!results.length && !loading && <li style={{ padding: "0.75rem", color: "#666" }}>No results yet</li>}
                    </ul>
                </div>

                <div>
                    <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Details</h2>
                    {!selected && <p style={{ color: "#666" }}>Select a place to see details</p>}
                    {detailLoading && <p>Loading details...</p>}
                    {detailError && <p style={{ color: "red" }}>{detailError}</p>}
                    {detail && (
                        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
                            <h3 style={{ marginTop: 0 }}>{detail.name}</h3>
                            <p style={{ margin: "0 0 0.25rem 0" }}>{detail.address}</p>
                            {detail.rating && <p style={{ margin: "0 0 0.25rem 0" }}>Rating: {detail.rating}</p>}
                            {detail.phone && <p style={{ margin: "0 0 0.25rem 0" }}>Phone: {detail.phone}</p>}
                            {detail.website && (
                                <p style={{ margin: "0 0 0.25rem 0" }}>
                                    Website:{" "}
                                    <a href={detail.website} target="_blank" rel="noreferrer">
                                        {detail.website}
                                    </a>
                                </p>
                            )}
                            {detail.hours?.weekday_text && (
                                <div style={{ margin: "0.25rem 0" }}>
                                    <div style={{ fontWeight: 600 }}>Hours</div>
                                    {detail.hours.weekday_text.map((h) => (
                                        <div key={h} style={{ fontSize: "0.9rem" }}>
                                            {h}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt={detail.name}
                                    style={{ width: "100%", borderRadius: 8, marginTop: "0.5rem" }}
                                />
                            ) : (
                                <p style={{ color: "#666" }}>Add VITE_GOOGLE_MAPS_KEY to show a map or photo preview.</p>
                            )}
                            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: "0.6rem 1rem",
                                        borderRadius: 8,
                                        border: "none",
                                        background: saved ? "#60a5fa" : saving ? "#9aa3af" : "#2563eb",
                                        color: "white",
                                        cursor: saving ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {saving ? "Saving..." : saved ? "Remove from my list" : "Save to my list"}
                                </button>
                                {saveMessage && <span style={{ color: "#111", fontSize: "0.9rem" }}>{saveMessage}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlacesPage;
