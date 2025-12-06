import { Location, Collection } from "@full-stack/types";
import { BACKEND_BASE_PATH } from "../constants/Navigation";

// Collections API
export async function getCollections(userId: string): Promise<Collection[]> {
    const response = await fetch(`${BACKEND_BASE_PATH}/users/${userId}/collections`);
    if (!response.ok) throw new Error("Failed to fetch collections");
    return response.json();
}

export async function createCollection(userId: string, name: string, description?: string): Promise<Collection> {
    const response = await fetch(`${BACKEND_BASE_PATH}/users/${userId}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error("Failed to create collection");
    return response.json();
}

// Locations API
export async function addLocationToCollection(
    userId: string,
    collectionId: string,
    name: string,
    address: string
): Promise<Location> {
    const response = await fetch(
        `${BACKEND_BASE_PATH}/users/${userId}/collections/${collectionId}/items`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, address }),
        }
    );
    if (!response.ok) throw new Error("Failed to add location");
    const data = await response.json();
    return data.location;
}

export async function getLocations(userId: string, collectionId: string): Promise<Location[]> {
    const response = await fetch(
        `${BACKEND_BASE_PATH}/users/${userId}/collections/${collectionId}/items`
    );
    if (!response.ok) throw new Error("Failed to fetch locations");
    return response.json();
}

export async function updateLocation(
    userId: string,
    collectionId: string,
    locationId: string,
    updates: Partial<Omit<Location, "id">>
): Promise<void> {
    const response = await fetch(
        `${BACKEND_BASE_PATH}/users/${userId}/collections/${collectionId}/items/${locationId}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        }
    );
    if (!response.ok) throw new Error("Failed to update location");
}

export async function deleteLocation(
    userId: string,
    collectionId: string,
    locationId: string
): Promise<void> {
    const response = await fetch(
        `${BACKEND_BASE_PATH}/users/${userId}/collections/${collectionId}/items/${locationId}`,
        {
            method: "DELETE",
        }
    );
    if (!response.ok) throw new Error("Failed to delete location");
}

