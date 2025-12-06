import { useState, useEffect } from 'react';
import { LocationCard } from './LocationCard';
import { BACKEND_BASE_PATH } from '../constants/Navigation';

interface Location {
    id: string;
    collectionId: string;
    name: string;
    address: string;
    visited: boolean;
    rating: number | null;
    comment: string | null;
}

const CURRENT_USER_ID = 'test-user';

function LocationList() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${BACKEND_BASE_PATH}/users/${CURRENT_USER_ID}/locations`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch locations');
                }
                
                const data = await response.json();
                setLocations(data);
            } catch (err) {
                console.error('Error fetching locations:', err);
                setError('Unable to load locations');
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    const handleUpdate = async (id: string, updates: Partial<Location>) => {
        const location = locations.find(loc => loc.id === id);
        if (!location) return;

        try {
            // Optimistic update
            setLocations(prevLocations =>
                prevLocations.map(loc =>
                    loc.id === id ? { ...loc, ...updates } : loc
                )
            );

            const response = await fetch(
                `${BACKEND_BASE_PATH}/users/${CURRENT_USER_ID}/collections/${location.collectionId}/items/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updates),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update location');
            }

            const updatedLocation = await response.json();
            setLocations(prevLocations =>
                prevLocations.map(loc =>
                    loc.id === id ? { ...updatedLocation, collectionId: location.collectionId } : loc
                )
            );
        } catch (err) {
            console.error('Error updating location:', err);
            alert('Failed to update location. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        const location = locations.find(loc => loc.id === id);
        if (!location) return;

        if (!confirm('Are you sure you want to delete this location?')) {
            return;
        }

        try {
            // Optimistic update
            setLocations(prevLocations =>
                prevLocations.filter(loc => loc.id !== id)
            );

            const response = await fetch(
                `${BACKEND_BASE_PATH}/users/${CURRENT_USER_ID}/collections/${location.collectionId}/items/${id}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete location');
            }
        } catch (err) {
            console.error('Error deleting location:', err);
            alert('Failed to delete location. Please try again.');
        }
    };

    if (loading) {
        return <p>Loading your saved locations...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    if (locations.length === 0) {
        return <p style={{ color: '#666' }}>No saved locations yet. Search and save some places!</p>;
    }

    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1rem'
        }}>
            {locations.map(location => (
                <LocationCard
                    key={location.id}
                    id={location.id}
                    name={location.name}
                    address={location.address}
                    visited={location.visited}
                    rating={location.rating}
                    comment={location.comment}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
}

export default LocationList;