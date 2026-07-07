import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const AdminBanners = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({ position: 'top', link: '', image: null, imagePreview: '' });
    const [editingId, setEditingId] = useState(null);

    // Crop Modal States
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [tempImageForCrop, setTempImageForCrop] = useState(null);

    const { data: banners = [], isLoading } = useQuery({
        queryKey: ['admin-banners'],
        queryFn: () => fetch('/api/banners?all=true', { credentials: 'include', 
            
        }).then(r => r.json()),
    });

    const createMutation = useMutation({
        mutationFn: async (fd) => {
            const res = await fetch('/api/banners', { credentials: 'include', 
                method: 'POST',
                body: fd
            });
            if (!res.ok) throw new Error('Failed to create banner');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-banners']);
            setForm({ position: 'top', link: '', image: null, imagePreview: '' });
            toast.success("Banner added successfully");
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await fetch(`/api/banners/${id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update banner');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-banners']);
            setEditingId(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`/api/banners/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete banner');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-banners']);
            toast.success("Banner deleted");
        }
    });

    // Image Upload Handlers
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTempImageForCrop(URL.createObjectURL(file));
            setIsCropModalOpen(true);
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropConfirm = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(tempImageForCrop, croppedAreaPixels);
            const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
            setForm({ ...form, image: croppedImageBlob, imagePreview: croppedImageUrl });
            setIsCropModalOpen(false);
            setTempImageForCrop(null);
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image");
        }
    };

    const handleCropCancel = () => {
        setIsCropModalOpen(false);
        setTempImageForCrop(null);
        document.getElementById('banner-img-input').value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.image) return toast.error("Please select an image");
        
        const fd = new FormData();
        fd.append('image', form.image, 'banner.jpg');
        fd.append('position', form.position);
        if (form.link) fd.append('link', form.link);
        
        createMutation.mutate(fd);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Banners...</div>;

    // Aspect ratio: top banner (360:160 ~ 2.25), mid banner (16:9 ~ 1.77)
    const aspect = form.position === 'top' ? 2.25 : 1.77;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manage Banners</h1>

            {/* Create Banner Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Banner</h2>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Position</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.position}
                            onChange={e => setForm({...form, position: e.target.value, image: null, imagePreview: ''})}
                        >
                            <option value="top">Top Banner (Promo carousel)</option>
                            <option value="mid">Mid Page Banner (Single large)</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Link (Optional)</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="/daily-market or https://..."
                            value={form.link}
                            onChange={e => setForm({...form, link: e.target.value})}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Image File</label>
                        <input 
                            id="banner-img-input"
                            type="file" 
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={handleFileChange}
                        />
                    </div>
                    
                    {form.imagePreview && (
                        <div className="w-24 h-12 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
                            <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                        {createMutation.isPending ? 'Uploading...' : 'Add Banner'}
                    </button>
                </form>
            </div>

            {/* Banners List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map(b => (
                    <div key={b._id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${!b.isActive ? 'border-red-200 opacity-75' : 'border-gray-100'}`}>
                        <div className="h-40 bg-gray-100 w-full relative">
                            <img src={b.image} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${b.position === 'top' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {b.position.toUpperCase()}
                                    </span>
                                    {!b.isActive && <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-md">Hidden</span>}
                                </div>
                                {b.link && <p className="text-[11px] font-bold text-gray-500 truncate max-w-[200px]">🔗 {b.link}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => updateMutation.mutate({ id: b._id, data: { isActive: !b.isActive }})}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${b.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                >
                                    {b.isActive ? 'Hide' : 'Show'}
                                </button>
                                <button 
                                    onClick={() => { if(window.confirm('Delete this banner?')) deleteMutation.mutate(b._id) }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {banners.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-500 font-bold border border-dashed border-gray-200">
                    No banners found. Upload one above!
                </div>
            )}

            {/* ─── CROP MODAL ─── */}
            {isCropModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center justify-between p-4 bg-slate-900 text-white shadow-sm z-10 relative">
                        <button onClick={handleCropCancel} className="text-sm font-bold active:scale-95 transition-transform text-slate-300">Cancel</button>
                        <span className="text-base font-extrabold tracking-tight">Crop Banner</span>
                        <button onClick={handleCropConfirm} className="text-sm font-bold text-amber-400 active:scale-95 transition-transform">Done</button>
                    </div>
                    <div className="flex-1 relative bg-black">
                        {tempImageForCrop && (
                            <Cropper
                                image={tempImageForCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBanners;
