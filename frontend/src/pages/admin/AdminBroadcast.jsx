import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

/* ─── Crisp Icons ─── */
const IconBack = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;

const AUDIENCE_OPTIONS = [
    { value: 'all', label: 'All Users', emoji: '🌍', desc: 'Customers + Vendors' },
    { value: 'customers', label: 'Customers Only', emoji: '🛒', desc: 'All registered customers' },
    { value: 'vendors', label: 'Vendors Only', emoji: '🏪', desc: 'All shop vendors' }
];

const AdminBroadcast = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('all');
    const [sending, setSending] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    if (user?.role !== 'super_admin') {
        navigate('/');
        return null;
    }

    const handleSend = async () => {
        setShowConfirm(false);
        setSending(true);
        setLastResult(null);

        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim(), message: message.trim(), targetAudience })
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || 'Failed to send broadcast');
            } else {
                toast.success(data.message || 'Broadcast sent!');
                setLastResult(data);
                setTitle('');
                setMessage('');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const canSend = title.trim().length > 0 && message.trim().length > 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">

            {/* ─── HEADER ─── */}
            <div className="bg-white px-4 pt-6 pb-4 flex items-center gap-3 shadow-sm sticky top-0 z-50">
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(40); navigate('/admin'); }}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shrink-0"
                >
                    <IconBack />
                </button>
                <div className="flex flex-col">
                    <span className="text-[16px] font-black text-slate-900 tracking-tight leading-none mb-1">Broadcast Notification</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Send push to users</span>
                </div>
            </div>

            <div className="flex-1 px-4 pt-6 max-w-2xl mx-auto w-full space-y-5 pb-10">

                {/* ─── TITLE ─── */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">Notification Title</label>
                    <input
                        type="text"
                        placeholder="e.g. 🎉 Flash Sale is Live!"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        className="w-full text-[15px] font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder:text-slate-300 transition-all"
                    />
                    <span className="text-[10px] font-semibold text-slate-300 mt-2 block text-right">{title.length}/100</span>
                </div>

                {/* ─── MESSAGE ─── */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">Message Body</label>
                    <textarea
                        placeholder="Write your announcement here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={500}
                        rows={4}
                        className="w-full text-[14px] font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder:text-slate-300 transition-all resize-none"
                    />
                    <span className="text-[10px] font-semibold text-slate-300 mt-2 block text-right">{message.length}/500</span>
                </div>

                {/* ─── AUDIENCE SELECTOR ─── */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">Target Audience</label>
                    <div className="space-y-2">
                        {AUDIENCE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { if (navigator.vibrate) navigator.vibrate(20); setTargetAudience(opt.value); }}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                                    targetAudience === opt.value
                                        ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                }`}
                            >
                                <span className="text-2xl">{opt.emoji}</span>
                                <div className="flex flex-col text-left">
                                    <span className={`text-[14px] font-black tracking-tight ${targetAudience === opt.value ? 'text-amber-900' : 'text-slate-800'}`}>{opt.label}</span>
                                    <span className="text-[11px] font-semibold text-slate-400">{opt.desc}</span>
                                </div>
                                {targetAudience === opt.value && (
                                    <div className="ml-auto w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── PREVIEW ─── */}
                {canSend && (
                    <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">Preview</label>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-black text-slate-900 leading-tight">{title}</h4>
                                    <p className="text-[13px] font-semibold text-slate-600 mt-1 leading-snug">{message}</p>
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-2 block">
                                        → {AUDIENCE_OPTIONS.find(o => o.value === targetAudience)?.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── LAST RESULT ─── */}
                {lastResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-[24px] p-5 text-center">
                        <span className="text-3xl block mb-2">✅</span>
                        <p className="text-[14px] font-black text-emerald-800">{lastResult.message}</p>
                        <p className="text-[12px] font-semibold text-emerald-600 mt-1">
                            Sent to {lastResult.recipientCount} users
                        </p>
                    </div>
                )}

                {/* ─── SEND BUTTON ─── */}
                <button
                    onClick={() => { if (navigator.vibrate) navigator.vibrate(30); setShowConfirm(true); }}
                    disabled={!canSend || sending}
                    className={`w-full py-4 rounded-[24px] text-[14px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md ${
                        canSend && !sending
                            ? 'bg-amber-400 text-amber-950 hover:bg-amber-500'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    {sending ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                            Sending...
                        </span>
                    ) : (
                        '📢 Send Broadcast'
                    )}
                </button>
            </div>

            {/* ═══ CONFIRMATION MODAL ═══ */}
            {showConfirm && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowConfirm(false)}>
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
                        <div className="text-5xl mb-4">📢</div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Confirm Broadcast</h3>
                        <p className="text-[13px] font-semibold text-slate-500 mb-2 px-4">
                            This will send a push notification to <strong className="text-slate-800">{AUDIENCE_OPTIONS.find(o => o.value === targetAudience)?.label?.toLowerCase()}</strong>.
                        </p>
                        <p className="text-[12px] font-bold text-rose-500 mb-6">This action cannot be undone.</p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-[13px] font-black active:scale-95 transition-transform">Cancel</button>
                            <button onClick={handleSend} className="flex-1 py-3.5 bg-amber-400 text-amber-950 rounded-2xl text-[13px] font-black shadow-md active:scale-95 transition-transform">Send Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBroadcast;
