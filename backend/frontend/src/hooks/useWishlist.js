const API = "http://localhost:5000/api/wishlist";

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
});

export async function fetchWishlist() {
    const res = await fetch(API, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
}

export async function addToWishlist(propertyId) {
    const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ property_id: propertyId })
    });
    return res.ok;
}

export async function removeFromWishlist(wishlistId) {
    const res = await fetch(`${API}/${wishlistId}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    return res.ok;
}

export async function checkWishlist(propertyId) {
    const res = await fetch(`${API}/check/${propertyId}`, { headers: authHeaders() });
    if (!res.ok) return { inWishlist: false, wishlistId: null };
    return res.json();
}
