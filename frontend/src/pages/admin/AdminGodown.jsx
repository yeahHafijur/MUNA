import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

/* ─── Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

/* ─── Shared Styles ─── */
const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all";
const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
const btnPrimaryClasses = "px-6 py-2.5 bg-amber-400 text-gray-900 rounded-lg text-sm font-bold active:scale-95 transition-transform shadow-sm hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed";

const AdminGodown = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [godownSearchQuery, setGodownSearchQuery] = useState('');
    const [editingGodownItem, setEditingGodownItem] = useState(null);
    const [godownFormData, setGodownFormData] = useState({ name: '', category: '', price: '', quantity: '', image: null, imagePreview: '', gallery: [], galleryPreviews: [] });
    const [isGodownModalOpen, setIsGodownModalOpen] = useState(false);

    // Crop Modal States
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [tempImageForCrop, setTempImageForCrop] = useState(null);

    useEffect(() => {
        if (user?.role !== 'super_admin') navigate('/');
    }, [token, user, navigate]);

    const { data: allGodownItems = [], isLoading } = useQuery({
        queryKey: ['master-products'],
        queryFn: async () => {
            const res = await fetch('/api/master-products', { credentials: 'include' });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const approvedGodown = allGodownItems.filter(i => i.status !== 'pending');
    const filteredGodown = approvedGodown.filter(i => (i.name || '').toLowerCase().includes((godownSearchQuery || '').toLowerCase()));

    const handleGodownFormChange = (e) => {
        if (e.target.name === 'image') {
            const file = e.target.files[0];
            if (file) {
                setTempImageForCrop(URL.createObjectURL(file));
                setIsCropModalOpen(true);
            }
            e.target.value = ''; // Reset input so same file can be selected again

        } else if (e.target.name === 'gallery') {
            const files = Array.from(e.target.files).slice(0, 4);
            setGodownFormData({ 
                ...godownFormData, 
                gallery: files, 
                galleryPreviews: files.map(f => URL.createObjectURL(f)) 
            });
        } else {
            setGodownFormData({ ...godownFormData, [e.target.name]: e.target.value });
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropConfirm = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(tempImageForCrop, croppedAreaPixels);
            const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
            setGodownFormData({ ...godownFormData, image: croppedImageBlob, imagePreview: croppedImageUrl });
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
    };

    const handleGodownSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', godownFormData.name);
        fd.append('category', godownFormData.category);
        fd.append('price', godownFormData.price || 0);
        fd.append('quantity', godownFormData.quantity || '');
        if (godownFormData.image instanceof Blob || godownFormData.image instanceof File) {
            fd.append('image', godownFormData.image, 'image.jpg');
        }
        godownFormData.gallery.forEach((file, index) => {
            if (file instanceof Blob || file instanceof File) {
                fd.append('gallery', file, `gallery-${index}.jpg`);
            }
        });
        try {
            const url = editingGodownItem ? `/api/master-products/${editingGodownItem._id}` : '/api/master-products';
            const res = await fetch(url, { credentials: 'include',  method: editingGodownItem ? 'PUT' : 'POST', body: fd });
            if (res.ok) {
                setGodownFormData({ name: '', category: '', price: '', quantity: '', image: null, imagePreview: '', gallery: [], galleryPreviews: [] });
                setEditingGodownItem(null);
                queryClient.invalidateQueries({ queryKey: ['master-products'] });
                setIsGodownModalOpen(false);
                toast.success(editingGodownItem ? "Item updated!" : "Item added to godown!");
            } else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error saving item."); }
    };

    const handleGodownEditClick = (item) => {
        setEditingGodownItem(item);
        setGodownFormData({ name: item.name, category: item.category || '', price: item.price || '', quantity: item.quantity || '', image: null, imagePreview: item.image || '', gallery: [], galleryPreviews: item.gallery || [] });
        setIsGodownModalOpen(true);
    };

    const handleDeleteGodownItem = async (id) => {
        if (!window.confirm("Delete this item from Godown?")) return;
        try {
            const res = await fetch(`/api/master-products/${id}`, { method: 'DELETE' });
            if (res.ok) queryClient.invalidateQueries({ queryKey: ['master-products'] });
            else { const d = await res.json(); toast.error(d.message || 'Failed'); }
        } catch (err) { toast.error("Error deleting item."); }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col font-sans">

            {/* ─── NATIVE HEADER ─── */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/admin'); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
                >
                    <IconBack />
                </button>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Master Godown</span>
                <button
                    onClick={() => { setEditingGodownItem(null); setGodownFormData({ name: '', category: '', image: null, imagePreview: '', gallery: [], galleryPreviews: [] }); setIsGodownModalOpen(true); }}
                    className="ml-auto px-4 py-2 bg-amber-400 text-amber-950 rounded-xl text-[12px] font-black shadow-[0_4px_14px_rgba(251,191,36,0.3)] active:scale-95 transition-transform"
                >
                    + Add Item
                </button>
            </div>

            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* Search */}
                <div className="p-4 pb-2">
                    <input type="text" placeholder="Search godown..." className={`${inputClasses} py-2`} value={godownSearchQuery} onChange={(e) => setGodownSearchQuery(e.target.value)} />
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-sm font-bold text-gray-400">Loading inventory...</div>
                ) : approvedGodown.length === 0 ? (
                    <div className="p-12 text-center text-sm font-bold text-gray-400">Godown is empty.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[1px] bg-gray-100 p-[1px]">
                        {filteredGodown.map(item => (
                            <div key={item._id} className="bg-white p-4 pb-10 flex flex-col items-center text-center group hover:bg-amber-50/30 transition-colors relative">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-1 mb-3">
                                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" /> : <span className="text-gray-300 font-black text-2xl">M</span>}
                                </div>
                                <div className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-1">{item.name}</div>
                                <div className="text-[11px] font-extrabold text-green-600 mb-0.5">₹{item.price || 0} {item.quantity ? <span className="text-gray-400 font-normal">/ {item.quantity}</span> : null}</div>
                                {item.category && <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.category}</div>}

                                {/* Actions (Always visible for mobile) */}
                                <div className="absolute inset-x-0 bottom-0 bg-slate-50 border-t border-slate-100 flex transition-opacity">
                                    <button onClick={() => handleGodownEditClick(item)} className="flex-1 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-colors">Edit</button>
                                    <div className="w-[1px] bg-slate-200"></div>
                                    <button onClick={() => handleDeleteGodownItem(item._id)} className="flex-1 py-2 text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── ADD/EDIT GODOWN MODAL ─── */}
            {isGodownModalOpen && !isCropModalOpen && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0"></div>
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingGodownItem ? 'Edit Godown Item' : 'Add to Godown'}</h3>
                            <button onClick={() => setIsGodownModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-transform">✕</button>
                        </div>
                        <form onSubmit={handleGodownSubmit} className="space-y-5">
                            <div className="flex justify-center">
                                <label className="cursor-pointer group">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group-hover:border-amber-400 transition-colors">
                                        {godownFormData.imagePreview ? <img src={godownFormData.imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-400 group-hover:text-amber-500">+ Photo</span>}
                                    </div>
                                    <input type="file" name="image" accept="image/*" onChange={handleGodownFormChange} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <label className={labelClasses}>Gallery Photos (Max 4)</label>
                                <input type="file" name="gallery" accept="image/*" multiple onChange={handleGodownFormChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800" />
                                {godownFormData.galleryPreviews.length > 0 && (
                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                                        {godownFormData.galleryPreviews.map((src, i) => (
                                            <img key={i} src={src} className="h-12 w-12 rounded-lg object-cover shadow-sm border border-slate-200 shrink-0" />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClasses}>Item Name</label>
                                <input type="text" name="name" required className={inputClasses} value={godownFormData.name} onChange={handleGodownFormChange} placeholder="e.g. Aashirvaad Atta 5kg" />
                            </div>
                            <div>
                                <label className={labelClasses}>Category</label>
                                <input type="text" name="category" className={inputClasses} value={godownFormData.category} onChange={handleGodownFormChange} placeholder="e.g. Grocery" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Price (₹)</label>
                                    <input type="number" name="price" className={inputClasses} value={godownFormData.price} onChange={handleGodownFormChange} placeholder="e.g. 199" />
                                </div>
                                <div>
                                    <label className={labelClasses}>Quantity/Unit</label>
                                    <input type="text" name="quantity" className={inputClasses} value={godownFormData.quantity} onChange={handleGodownFormChange} placeholder="e.g. 1 kg" />
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className={`${btnPrimaryClasses} w-full py-3`}>{editingGodownItem ? 'Update Item' : 'Add to Godown'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── CROP MODAL ─── */}
            {isCropModalOpen && (
                <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col font-sans">
                    <div className="bg-slate-900 px-4 py-3 flex items-center justify-between shadow-sm z-10 text-white">
                        <button onClick={handleCropCancel} className="text-sm font-bold active:scale-95 transition-transform text-slate-300">Cancel</button>
                        <span className="text-base font-extrabold tracking-tight">Crop Image</span>
                        <button onClick={handleCropConfirm} className="text-sm font-bold text-amber-400 active:scale-95 transition-transform">Done</button>
                    </div>
                    <div className="flex-1 relative bg-black">
                        {tempImageForCrop && (
                            <Cropper
                                image={tempImageForCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} /* Square Crop */
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

export default AdminGodown;
