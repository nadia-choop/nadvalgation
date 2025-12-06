import { Router } from "express";
import { Client } from "@googlemaps/google-maps-services-js";

type PlacesTextResult = {
    name?: string;
    formatted_address?: string;
    place_id?: string;
    geometry?: { location?: { lat: number; lng: number } };
    rating?: number;
    photos?: { photo_reference?: string }[];
};

type PlaceDetailsResult = {
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    website?: string;
    rating?: number;
    opening_hours?: { weekday_text?: string[] };
    geometry?: { location?: { lat: number; lng: number } };
    photos?: { photo_reference?: string }[];
};

const router: Router = Router();
const client = new Client();
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

router.get("/places/search", async (req, res) => {
    if (!apiKey) return res.status(500).json({ error: "missing GOOGLE_MAPS_API_KEY" });
    const { query, lat, lng } = req.query as { query?: string; lat?: string; lng?: string };
    if (!query || !lat || !lng) {
        return res.status(400).json({ error: "query, lat, lng are required" });
    }

    try {
        const response = await client.textSearch({
            params: {
                query,
                location: { lat: Number(lat), lng: Number(lng) },
                radius: 3000,
                key: apiKey,
            },
        });

        const results = (response.data.results ?? []).map((r: PlacesTextResult) => ({
            name: r.name ?? "",
            address: r.formatted_address ?? "",
            placeId: r.place_id ?? "",
            lat: r.geometry?.location?.lat,
            lng: r.geometry?.location?.lng,
            rating: r.rating,
            photoRef: r.photos?.[0]?.photo_reference,
        }));

        res.json(results);
    } catch (err) {
        console.error("Places search failed:", err);
        res.status(500).json({ error: "failed to search places" });
    }
});

router.get("/places/:placeId", async (req, res) => {
    if (!apiKey) return res.status(500).json({ error: "missing GOOGLE_MAPS_API_KEY" });
    const { placeId } = req.params;
    try {
        const response = await client.placeDetails({
            params: {
                place_id: placeId,
                fields: [
                    "name",
                    "formatted_address",
                    "geometry",
                    "rating",
                    "formatted_phone_number",
                    "website",
                    "opening_hours",
                    "photos",
                ],
                key: apiKey,
            },
        });

        const r = response.data.result as PlaceDetailsResult | undefined;
        res.json({
            name: r?.name,
            address: r?.formatted_address,
            phone: r?.formatted_phone_number,
            website: r?.website,
            rating: r?.rating,
            hours: r?.opening_hours,
            lat: r?.geometry?.location?.lat,
            lng: r?.geometry?.location?.lng,
            photoRef: r?.photos?.[0]?.photo_reference,
        });
    } catch (err) {
        console.error("Places details failed:", err);
        res.status(500).json({ error: "failed to load place details" });
    }
});

export default router;
