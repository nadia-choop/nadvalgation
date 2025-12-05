import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import type { Collection as CollectionDto, Location as LocationDto } from "@full-stack/types";

const router: Router = Router();
const collectionsForUser = (userId: string) => db.collection("users").doc(userId).collection("collections");
const locationsForCollection = (userId: string, collectionId: string) => 
    collectionsForUser(userId).doc(collectionId).collection("locations");

    //create collection
router.post("/users/:userId/collections", async (req, res) => {
    const { userId } = req.params;
    const { name, description = "" } = (req.body ?? {}) as { name?: string; description?: string };
    if (!name) return res.status(400).json({ error: "name is required" });

    const collection: Omit<CollectionDto, "id"> = { name, description };
    const timestamp = FieldValue.serverTimestamp();
    const docRef = await collectionsForUser(userId).add({
        ...collection,
        createdAt: timestamp,
        updatedAt: timestamp,
    });

    res.status(201).json({ id: docRef.id, ...collection });
});
//add location to items
router.post("/users/:userId/collections/:collectionId/items", async (req, res) => {
    const { userId, collectionId } = req.params;
    const { name, address } = (req.body ?? {}) as { name?: string; address?: string };
    if (!name || !address) {
        return res.status(400).json({ error: "name and address are required" });
    }

    const collectionRef = collectionsForUser(userId).doc(collectionId);
    const location: Omit<LocationDto, "id"> = {
        name,
        address,
        visited: false, //adding status
        rating: null, //adding rating
        comment: null, //adding comment field
    };

    try {
        const locationRef = locationsForCollection(userId, collectionId).doc();
        const locationId = locationRef.id;

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(collectionRef);
            if (!snap.exists) throw new Error("collection not found");

            tx.set(locationRef, {
                ...location,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });

            tx.update(collectionRef, {
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        res.status(201).json({
            collectionId,
            location: { id: locationId, ...location },
        });
    } catch (err) {
        if ((err as Error).message === "collection not found") {
            return res.status(404).json({ error: "collection not found" });
        }
        console.error("Error adding location to collection:", err);
        return res.status(500).json({ error: "failed to add location" });
    }
});

// get all of the collections
router.get("/users/:userId/collections", async (req, res) => {
    const { userId } = req.params;
    const snapshot = await collectionsForUser(userId).get();
    const collections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    res.json(collections);
});

// get one specific collection
router.get("/users/:userId/collections/:collectionId", async (req, res) => {
    const { userId, collectionId } = req.params;
    const doc = await collectionsForUser(userId).doc(collectionId).get();
    if (!doc.exists) return res.status(404).json({ error: "not found" });
    res.json({ id: doc.id, ...doc.data() });
});

// update a specific collection
router.put("/users/:userId/collections/:collectionId", async (req, res) => {
    const {userId, collectionId} = req.params;
    const {name, description} = (req.body ?? {}) as { name?: string; description?: string };
    if (!name) return res.status(400).json({ error: "name is required" });
    const collectionRef = collectionsForUser(userId).doc(collectionId);

    try {
        const snap = await collectionRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: "collection not found" });
        }
        
        await collectionRef.update({
            name,
            description,
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        const updatedSnap = await collectionRef.get();
        res.json({ id: collectionId, ...updatedSnap.data() });
    } catch (err) {
        console.error("Error updating collection:", err);
        return res.status(500).json({ error: "failed to update collection" });
    }
});

// get all locations in a collection
router.get("/users/:userId/collections/:collectionId/items", async (req, res) => {
    const { userId, collectionId } = req.params;
    try {
        const snapshot = await locationsForCollection(userId, collectionId).get();
        const locations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(locations);
    } catch (err) {
        console.error("Error fetching locations:", err);
        return res.status(500).json({ error: "failed to fetch locations" });
    }
});

// get one specific location
router.get("/users/:userId/collections/:collectionId/items/:itemId", async (req, res) => {
    const { userId, collectionId, itemId } = req.params;
    try {
        const doc = await locationsForCollection(userId, collectionId).doc(itemId).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "location not found" });
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
        console.error("Error fetching location:", err);
        return res.status(500).json({ error: "failed to fetch location" });
    }
});

// update a location
router.put("/users/:userId/collections/:collectionId/items/:itemId", async (req, res) => {
    const { userId, collectionId, itemId } = req.params;
    const updateData = (req.body ?? {}) as Partial<Omit<LocationDto, "id">>;
    const { name, address, visited, rating, comment } = (req.body ?? {}) as { 
        name?: string;
        address?: string;
        visited?: boolean; 
        rating?: number | null; 
        comment?: string | null;
    };
    const locationRef = locationsForCollection(userId, collectionId).doc(itemId);

    try {
        const snap = await locationRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: "location not found" });
        }
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim() === "") {
                return res.status(400).json({ error: "name must be a non-empty string" });
            }
            updateData.name = name;
        }
        
        if (address !== undefined) {
            if (typeof address !== "string" || address.trim() === "") {
                return res.status(400).json({ error: "address must be a non-empty string" });
            }
            updateData.address = address;
        }
        if (visited !== undefined) {
            if (typeof visited !== "boolean") {
                return res.status(400).json({ error: "visited must be a boolean" });
            }
            updateData.visited = visited;
        }
        
        if (rating !== undefined) {
            if (rating !== null && (typeof rating !== "number" || rating < 1 || rating > 5)) {
                return res.status(400).json({ error: "rating must be null or a number between 1-5" });
            }
            updateData.rating = rating;
        }
        
        if (comment !== undefined) {
            if (comment !== null && typeof comment !== "string") {
                return res.status(400).json({ error: "comment must be null or a string" });
            }
            updateData.comment = comment;
        }
        
        if (Object.keys(updateData).length === 1) { // Only updatedAt
            return res.status(400).json({ error: "no valid fields to update" });
        }
        await locationRef.update({
            ...updateData,
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        const updatedSnap = await locationRef.get();
        res.json({ id: itemId, ...updatedSnap.data() });
    } catch (err) {
        console.error("Error updating location:", err);
        return res.status(500).json({ error: "failed to update location information!!" });
    }
});

// delete a specific item (location) in a collection
router.delete("/users/:userId/collections/:collectionId/items/:itemId", async (req, res) => {
    const { userId, collectionId, itemId } = req.params;
    const locationRef = locationsForCollection(userId, collectionId).doc(itemId);
    try {
        const snap = await locationRef.get();
        if (!snap.exists) {
            return res.status(404).json({ error: "item not found" });
        }
        await locationRef.delete();
        res.status(204).send();
    } catch (err) {
        console.error("Error deleting item:", err);
        return res.status(500).json({ error: "failed to delete item :o" });
    }
}
);

export default router;

