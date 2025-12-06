interface PlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry?: {
        location: {
            lat: number;
            lng: number;
        };
    };
    rating?: number;
}

interface PlacesResponse {
    results: PlaceResult[];
    status: string;
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "AIzaSyAIUbHZxOUrfo8IaUQ-Ifen4K3AHhKUnKI") {
        throw new Error("Google Maps API key not configured. Add VITE_GOOGLE_MAPS_API_KEY to your .env file");
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to search places");
    }

    const data: PlacesResponse = await response.json();
    
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Places API error: ${data.status}`);
    }

    return data.results || [];
}

//google place to location
export function placeToLocation(place: PlaceResult): {
    name: string;
    address: string;
    visited: boolean;
    rating: number | null;
    comment: string | null;
} {
    return {
        name: place.name,
        address: place.formatted_address,
        visited: false,
        rating: place.rating ? Math.round(place.rating) : null,
        comment: null,
    };
}

