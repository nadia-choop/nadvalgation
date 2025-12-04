import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebase";
import type { Collection as CollectionDto, Location as LocationDto } from "@full-stack/types";

const router: Router = Router();
const collectionsForUser = (userId: string) => db.collection("users").doc(userId).collection("collections");

router.post("/users/:userId/collections", async (req, res) => {
    const { userId } = req.params;
    const { name, description = "" } = (req.body ?? {}) as { name?: string; description?: string };
    if (!name) return res.status(400).json({ error: "name is required" });

    const collection: Omit<CollectionDto, "id"> = { name, description, locations: [] };
    const timestamp = FieldValue.serverTimestamp();
    const docRef = await collectionsForUser(userId).add({
        ...collection,
        createdAt: timestamp,
        updatedAt: timestamp,
    });

    res.status(201).json({ id: docRef.id, ...collection });
});

router.post("/users/:userId/collections/:collectionId/items", async (req, res) => {
    const { userId, collectionId } = req.params;
    const { name, address } = (req.body ?? {}) as { name?: string; address?: string };
    if (!name || !address) {
        return res.status(400).json({ error: "name and address are required" });
    }

    const collectionRef = collectionsForUser(userId).doc(collectionId);
    const location: LocationDto = {
        name,
        address,
        collections: [collectionId],
    };

    try {
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(collectionRef);
            const data = snap.data() as CollectionDto | undefined;
            if (!data) throw new Error("collection not found");
            const existingLocations = Array.isArray(data.locations) ? data.locations : [];

            tx.update(collectionRef, {
                locations: [...existingLocations, location],
                updatedAt: FieldValue.serverTimestamp(),
            });
        });
    } catch (err) {
        if ((err as Error).message === "collection not found") {
            return res.status(404).json({ error: "collection not found" });
        }
        console.error("Error adding location to collection:", err);
        return res.status(500).json({ error: "failed to add location" });
    }

    res.status(201).json({
        collectionId,
        location,
    });
});

export default router;
