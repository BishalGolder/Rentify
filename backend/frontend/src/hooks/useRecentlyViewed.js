const STORAGE_KEY = "rentify_recently_viewed";
const MAX_ITEMS = 10;

// Stores a small snapshot per property (not the full object) so the list
// still renders something useful even if the property is later deleted.
export function addRecentlyViewed(property) {
    if (!property?.id) return;

    const existing = getRecentlyViewed();
    const snapshot = {
        id: property.id,
        title: property.title,
        location: property.location,
        price: property.price,
        image: property.image_urls?.[0] || property.image || null,
        viewed_at: new Date().toISOString()
    };

    const deduped = existing.filter((p) => p.id !== property.id);
    const updated = [snapshot, ...deduped].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getRecentlyViewed() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function clearRecentlyViewed() {
    localStorage.removeItem(STORAGE_KEY);
}
