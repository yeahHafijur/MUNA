import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const IcoBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IcoPhoto = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;

const DailyMarketPost = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const [location, setLocation] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
        durationHours: '24',
        image: null,
        imagePreview: ''
    });

    // Cropper State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (err) => toast.error("Please enable location to post.")
        );
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            if (file) {
                // Instead of saving to formData, open the cropper
                setImageSrc(URL.createObjectURL(file));
                setIsCropping(true);
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
            const croppedFile = new File([croppedImageBlob], 'cropped.jpg', { type: 'image/jpeg' });
            
            setFormData({
                ...formData,
                image: croppedFile,
                imagePreview: URL.createObjectURL(croppedImageBlob)
            });
            setIsCropping(false);
            setImageSrc(null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image");
        }
    };

    const postMutation = useMutation({
        mutationFn: async (fd) => {
            const res = await fetch('/api/live-bazar', { credentials: 'include', 
                method: 'POST',
                body: fd
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            toast.success("Item posted successfully!");
            queryClient.invalidateQueries(['dailyMarketItems']);
            navigate('/daily-market', { replace: true });
        },
        onError: (err) => {
            toast.error("Failed to post: " + err.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!location) {
            toast.error("Waiting for location access...");
            return;
        }
        if (!formData.image) {
            toast.error("A photo is required");
            return;
        }
        
        if (navigator.vibrate) navigator.vibrate(50);

        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('price', formData.price);
        fd.append('description', formData.description);
        fd.append('durationHours', formData.durationHours);
        fd.append('longitude', location.lng);
        fd.append('latitude', location.lat);
        fd.append('image', formData.image);

        postMutation.mutate(fd);
    };

    return (
        /* Fixed Viewport Shell to bypass App.jsx padding */
        <div className="fixed inset-0 z-[100] flex flex-col bg-white font-sans overflow-hidden">
            <header className="shrink-0 h-14 bg-white border-b border-slate-100 flex items-center px-4 z-50">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-800 rounded-full active:bg-slate-100 transition-colors">
                    <IcoBack />
                </button>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight ml-2">Post to Market</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                
                {/* Photo Upload */}
                <div className="w-full">
                    <label className="block w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all relative">
                        {formData.imagePreview ? (
                            <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <IcoPhoto />
                                <span className="text-xs font-bold uppercase tracking-widest mt-3 text-slate-500">Tap to add photo</span>
                            </div>
                        )}
                        <input type="file" name="image" accept="image/*" className="hidden" onChange={handleChange} />
                    </label>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">What are you selling?</label>
                        <input 
                            type="text" 
                            name="title" 
                            required 
                            placeholder="e.g. Fresh Mangoes (1kg)"
                            value={formData.title} 
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Price (₹)</label>
                        <input 
                            type="number" 
                            name="price" 
                            required 
                            placeholder="e.g. 50"
                            value={formData.price} 
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Description (Optional)</label>
                        <textarea 
                            name="description" 
                            placeholder="Condition, pickup location, etc."
                            value={formData.description} 
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 focus:bg-white transition-all resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Duration</label>
                        <select 
                            name="durationHours" 
                            value={formData.durationHours} 
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 focus:bg-white transition-all"
                        >
                            <option value="12">12 Hours</option>
                            <option value="24">24 Hours</option>
                        </select>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 px-1">Item will automatically disappear after this time.</p>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={postMutation.isPending || !location}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[15px] font-black tracking-wide shadow-[0_8px_30px_rgba(15,23,42,0.15)] active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                        {postMutation.isPending ? 'Posting...' : !location ? 'Getting Location...' : 'Post Item Now'}
                    </button>
                </div>
                </form>
            </main>

            {/* Full-Screen Cropper Overlay */}
            {isCropping && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col">
                    <header className="shrink-0 h-14 flex items-center justify-between px-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
                        <button 
                            onClick={() => { setIsCropping(false); setImageSrc(null); }} 
                            className="p-2 -ml-2 text-white rounded-full"
                        >
                            <IcoBack />
                        </button>
                        <h1 className="text-white font-bold tracking-tight">Crop Photo</h1>
                        <button 
                            onClick={handleCropSave}
                            className="text-amber-400 font-bold uppercase tracking-wider text-sm active:opacity-70"
                        >
                            Done
                        </button>
                    </header>
                    <div className="flex-1 relative">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // 1:1 Square
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                objectFit="contain"
                            />
                        )}
                    </div>
                    <div className="h-24 bg-black/90 pb-safe flex items-center justify-center px-8 z-10">
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full accent-amber-400"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyMarketPost;
