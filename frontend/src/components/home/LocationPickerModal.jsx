import { memo, useMemo } from 'react';

const IconMapPin = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const IconNavigation = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775a5.99 5.99 0 01-1.673 2.257l-.825.618-.33 1.98M6.115 5.19a20.998 20.998 0 0111.77 0M6.115 5.19L19.07 18.145M5.93 19.14l1.8 1.8L9.75 19.5h4.5l1.42 1.44 1.8-1.8" />
    </svg>
);

const IconStore = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
);

const IconClose = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LocationPickerModal = ({ visible, onClose, onSelectGPS, onSelectLocation, shops }) => {
    const demoLocations = useMemo(() => {
        if (!shops || shops.length === 0) return [];

        const uniqueMap = new Map();
        shops.forEach(shop => {
            if (shop.location?.coordinates && shop.address) {
                const lat = shop.location.coordinates[1];
                const lng = shop.location.coordinates[0];

                let label = shop.address;
                const addressParts = shop.address.split(',');
                if (addressParts.length > 2) {
                    label = addressParts.slice(-2).join(',').trim();
                }

                const key = label.toLowerCase();
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, { lat, lng, label });
                }
            }
        });

        return Array.from(uniqueMap.values()).slice(0, 5);
    }, [shops]);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] pt-4 pb-10 px-6 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <h2 className="text-[20px] font-black text-slate-900 tracking-tight">Select Location</h2>
                    <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-900 active:scale-90 transition-transform" aria-label="Close">
                        <IconClose />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {/* GPS Option */}
                    <button
                        onClick={() => { onSelectGPS(); onClose(); }}
                        className="w-full flex items-center p-4 bg-amber-50 rounded-2xl mb-6 border border-amber-100 active:scale-[0.98] transition-transform text-left cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white mr-4 shrink-0">
                            <IconNavigation />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="block text-[15px] font-extrabold text-amber-950">Use Current Location</span>
                            <span className="block text-[12px] font-medium text-amber-700 mt-0.5">Using GPS</span>
                        </div>
                    </button>

                    {/* Explore Active Areas */}
                    {demoLocations.length > 0 && (
                        <div>
                            <p className="text-[14px] font-bold text-slate-400 mb-3 ml-1 uppercase tracking-wider">
                                Explore Active Areas
                            </p>
                            <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                                {demoLocations.map((loc, index) => (
                                    <button
                                        key={index}
                                        onClick={() => { onSelectLocation(loc); onClose(); }}
                                        className={`w-full flex items-center p-4 text-left cursor-pointer active:bg-slate-100 transition-colors ${index !== demoLocations.length - 1 ? 'border-b border-slate-200/60' : ''}`}
                                    >
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-sm mr-4 shrink-0">
                                            <IconStore />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-[15px] font-bold text-slate-900 truncate">{loc.label}</span>
                                            <span className="block text-[12px] font-medium text-slate-500 mt-0.5">MUNA is active here</span>
                                        </div>
                                        <IconMapPin />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(LocationPickerModal);
