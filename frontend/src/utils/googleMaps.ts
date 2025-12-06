//gen search url

export function getGoogleMapsSearchUrl(address: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
