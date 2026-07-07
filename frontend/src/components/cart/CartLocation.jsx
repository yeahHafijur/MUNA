const CartLocation = ({
    locationReady,
    user,
    selectedSavedLoc,
    handleSelectSavedLocation,
    handleGetLocation,
    locating,
    distance,
    deliveryFee,
    showSavePrompt,
    locationName,
    setLocationName,
    savingLocation,
    handleSaveLocation
}) => {
    return (
        <section className={`bg-white rounded-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden transition-all ${locationReady ? 'ring-2 ring-emerald-200' : 'ring-2 ring-amber-200'}`}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${locationReady ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-900 animate-pulse'}`}>{locationReady ? '✓' : '2'}</span>
                    Delivery Location
                </h3>
                {locationReady && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">✅ Verified</span>}
            </div>

            <div className="px-4 pb-4 space-y-3">
                {/* Alert when no location */}
                {!locationReady && (
                    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-3 text-[12px] font-bold text-amber-800">
                        <span className="text-lg">📍</span>
                        Select your location to place order
                    </div>
                )}

                {/* Saved locations */}
                {user?.savedLocations?.length > 0 && (
                    <div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Saved</div>
                        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
                            {user.savedLocations.map(loc => (
                                <button key={loc._id} onClick={() => handleSelectSavedLocation(loc)}
                                    className={`shrink-0 px-3.5 py-2.5 rounded-xl text-[12px] font-bold border transition-all active:scale-95 ${selectedSavedLoc === loc._id ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                    📍 {loc.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* GPS Button */}
                <button onClick={handleGetLocation} disabled={locating}
                    className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] ${locationReady && !selectedSavedLoc ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="text-left">
                        <div className={`text-[13px] font-extrabold ${locationReady && !selectedSavedLoc ? 'text-emerald-800' : 'text-blue-800'}`}>
                            {locating ? 'Detecting location...' : locationReady && !selectedSavedLoc ? 'GPS Location Acquired' : 'Use Current GPS Location'}
                        </div>
                        <div className={`text-[11px] font-medium mt-0.5 ${locationReady && !selectedSavedLoc ? 'text-emerald-600' : 'text-blue-500'}`}>
                            {locationReady && !selectedSavedLoc ? `${distance} km away • ₹${deliveryFee} delivery` : 'Tap to detect your location automatically'}
                        </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${locationReady && !selectedSavedLoc ? 'bg-emerald-500' : 'bg-blue-500'} ${locating ? 'animate-pulse' : ''}`}>
                        {locationReady && !selectedSavedLoc
                            ? <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            : <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                        }
                    </div>
                </button>

                {/* Save New Location Prompt */}
                {showSavePrompt && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 animate-fade-in mt-3">
                        <div className="text-[11px] font-bold text-emerald-800 mb-2 flex items-center justify-between">
                            Save this location for faster checkout next time!
                            <button onClick={() => setShowSavePrompt(false)} className="text-emerald-600 hover:text-emerald-900 font-bold">×</button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="e.g. Home, Office"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-300"
                            />
                            <button
                                onClick={handleSaveLocation}
                                disabled={savingLocation || !locationName}
                                className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[13px] font-bold active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {savingLocation ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CartLocation;
