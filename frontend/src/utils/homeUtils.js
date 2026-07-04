/* ─── Category Style Mapper ─── */
export const getCategoryIcon = (cat) => {
    const l = cat.toLowerCase();
    if (l.includes('grocery') || l.includes('kirana')) return { emoji: '🥬', bg: 'bg-green-50' };
    if (l.includes('fruit') || l.includes('veg')) return { emoji: '🍎', bg: 'bg-red-50' };
    if (l.includes('dairy') || l.includes('milk')) return { emoji: '🥛', bg: 'bg-blue-50' };
    if (l.includes('meat') || l.includes('egg')) return { emoji: '🥩', bg: 'bg-orange-50' };
    if (l.includes('personal') || l.includes('pharm')) return { emoji: '🧴', bg: 'bg-teal-50' };
    if (l.includes('all')) return { emoji: '🏪', bg: 'bg-gray-100' };
    return { emoji: '🛍️', bg: 'bg-purple-50' };
};

/* ─── Haversine ─── */
export const haversine = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
