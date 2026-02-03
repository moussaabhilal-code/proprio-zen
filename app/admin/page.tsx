"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
// ✅ تأكدنا أن Download كاينة
import { 
  LogOut, MessageSquare, Building, Eye, Wifi, Key, 
  Edit2, Save, X, QrCode, Printer, Download 
} from "lucide-react";

// 1. Initialisation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { throw new Error("Supabase Keys Missing"); }

const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [tickets, setTickets] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  // UI
  const [activeTab, setActiveTab] = useState<'tickets' | 'units'>('tickets');
  const [filter, setFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // Modals
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrUnit, setQrUnit] = useState<any>(null);

  // Print State
  const [isPrinting, setIsPrinting] = useState(false);
  const [origin, setOrigin] = useState(""); 

  // Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined') {
        setOrigin(window.location.origin);
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await Promise.all([fetchTickets(), fetchUnits()]);
      }
      setLoading(false);
    }
    init();
  }, []);

  // Fetchers
  const fetchTickets = async () => {
    const { data } = await supabase.from("tickets").select(`*, units(unit_number, properties(property_name))`).order('created_at', { ascending: false });
    if (data) setTickets(data);
  };

  const fetchUnits = async () => {
    const { data } = await supabase.from("units").select(`*, properties(*)`).order('created_at');
    if (data) setUnits(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else window.location.reload();
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase.from("tickets").update({ status: newStatus }).eq('id', ticketId);
    if (!error) {
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } else {
      alert("Erreur: " + error.message);
    }
  };

  const sendReply = async (ticket: any) => {
    if (!replyText) return;
    await supabase.from("tickets").update({ admin_reply: replyText, status: 'solved' }).eq('id', ticket.id);
    alert("✅ Réponse envoyée !");
    setReplyText("");
    setSelectedTicket(null);
    fetchTickets();
  };

  const saveUnitChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    await supabase.from("units").update({ wifi_password: editingUnit.wifi_password }).eq('id', editingUnit.id);
    if (editingUnit.properties) {
       await supabase.from("properties").update({ access_code_main: editingUnit.properties.access_code_main }).eq('id', editingUnit.properties.id);
    }
    alert("✅ Modifications enregistrées !");
    setEditingUnit(null);
    fetchUnits();
  };

  const handlePrintAll = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
    }, 2500); // كنتسناو 2.5 ثانية
  };

  const downloadSingleQR = async (unit: any) => {
    const scanUrl = `${origin}/scan/${unit.qr_code_id}`;
    const qrApi = `https://quickchart.io/qr?text=${encodeURIComponent(scanUrl)}&size=1000`;
    
    const response = await fetch(qrApi);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-Unite-${unit.unit_number}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600 animate-pulse">Chargement...</div>;

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
          <div className="flex justify-center mb-6"><div className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl">P</div></div>
          <h1 className="text-2xl font-black text-center text-gray-800 mb-2">Espace Propriétaire</h1>
          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            <input className="w-full p-4 border rounded-xl bg-gray-50" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="w-full p-4 border rounded-xl bg-gray-50" type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 shadow-lg">Connexion</button>
          </form>
        </div>
      </div>
  );

  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans">
      
      {/* 🛑 DASHBOARD WRAPPER */}
      {/* التغيير الكبير: print:hidden كتمنع الداشبورد يبان فالطباعة نهائياً */}
      <div className={`pb-10 ${isPrinting ? "hidden" : "block"} print:hidden`}>
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-black text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">P</div>
              <span className="font-bold text-gray-800 hidden sm:inline">Proprio Zen</span>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-500'}`}>
                <MessageSquare size={14}/> Tickets {pendingCount > 0 && <span className="bg-red-500 text-white px-1.5 rounded-md text-[10px]">{pendingCount}</span>}
              </button>
              <button onClick={() => setActiveTab('units')} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === 'units' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-500'}`}>
                <Building size={14}/> Unités
              </button>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold text-gray-400 hover:text-red-500 p-2"><LogOut size={16}/></button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          
          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">En cours</p>
               <span className="text-3xl font-black text-red-500">{pendingCount + inProgressCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Résolus</p>
               <span className="text-3xl font-black text-green-500">{tickets.filter(t => t.status === 'solved').length}</span>
            </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Unités</p>
               <span className="text-3xl font-black text-gray-800">{units.length}</span>
            </div>
          </div>

          {/* TICKETS TAB */}
          {activeTab === 'tickets' && (
            <div className="animate-in fade-in">
               <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === 'all' ? 'bg-black text-white' : 'bg-white border text-gray-600'}`}>Tous</button>
                  <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === 'pending' ? 'bg-red-500 text-white' : 'bg-white border text-gray-600'}`}>🔴 En attente</button>
                  <button onClick={() => setFilter('in_progress')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === 'in_progress' ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600'}`}>🟠 En cours</button>
                  <button onClick={() => setFilter('solved')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === 'solved' ? 'bg-green-500 text-white' : 'bg-white border text-gray-600'}`}>✅ Résolus</button>
               </div>
               <div className="space-y-3">
                 {tickets.filter(t => filter === 'all' || t.status === filter).map(ticket => (
                   <div key={ticket.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-3">
                            <select 
                              value={ticket.status} 
                              onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase rounded-lg px-2 py-1.5 border-none outline-none cursor-pointer ${ticket.status === 'pending' ? 'bg-red-100 text-red-700' : ''} ${ticket.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : ''} ${ticket.status === 'solved' ? 'bg-green-100 text-green-700' : ''}`}
                            >
                              <option value="pending">🔴 En attente</option>
                              <option value="in_progress">🟠 En cours</option>
                              <option value="solved">✅ Résolu</option>
                            </select>
                            <span className="text-sm font-bold text-gray-800">Unité {ticket.units?.unit_number}</span>
                         </div>
                         <span className="text-[10px] text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg mb-3">"{ticket.description}"</p>
                      <div className="flex justify-between items-center">
                         <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{ticket.category}</div>
                         {selectedTicket === ticket.id ? (
                            <div className="flex gap-2 w-full max-w-sm ml-4">
                               <input className="flex-1 border rounded-lg px-3 py-1 text-sm outline-none ring-2 ring-blue-500" autoFocus placeholder="Votre réponse..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                               <button onClick={() => sendReply(ticket)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700">Envoyer</button>
                            </div>
                         ) : (
                            <button onClick={() => setSelectedTicket(ticket.id)} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline"><MessageSquare size={14}/> Répondre</button>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* UNITS TAB */}
          {activeTab === 'units' && (
            <div className="animate-in fade-in">
               <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-black text-gray-800">Gestion des Unités</h1>
                  <button 
                    onClick={handlePrintAll} 
                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-800 shadow-lg shadow-gray-200 transition transform active:scale-95"
                  >
                    {isPrinting ? "Préparation..." : <><Printer size={16}/> Imprimer tous les QR</>}
                  </button>
               </div>
              
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {units.map(unit => (
                  <div key={unit.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group relative hover:shadow-lg transition">
                      <div className="absolute top-3 right-3 z-10 flex gap-2">
                        <button onClick={() => setQrUnit(unit)} className="bg-white/90 p-2 rounded-full shadow-sm hover:bg-black hover:text-white transition" title="Code QR"><QrCode size={16}/></button>
                        <button onClick={() => setEditingUnit(JSON.parse(JSON.stringify(unit)))} className="bg-white/90 p-2 rounded-full shadow-sm hover:bg-blue-600 hover:text-white transition" title="Modifier"><Edit2 size={16}/></button>
                      </div>
                      <div className="h-28 bg-gray-200 relative">
                        <img src={unit.properties?.image_url || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800"} className="w-full h-full object-cover opacity-90" />
                        <div className="absolute bottom-2 left-3 text-white font-black text-lg drop-shadow-md">Unité {unit.unit_number}</div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-gray-50 p-2 rounded-lg"><p className="text-[10px] text-gray-400 font-bold uppercase"><Wifi size={10} className="inline mr-1"/> Wifi</p><p className="font-mono text-xs font-bold truncate">{unit.wifi_password || "..."}</p></div>
                            <div className="bg-gray-50 p-2 rounded-lg"><p className="text-[10px] text-gray-400 font-bold uppercase"><Key size={10} className="inline mr-1"/> Code</p><p className="font-mono text-xs font-bold truncate">{unit.properties?.access_code_main || "..."}</p></div>
                        </div>
                        <button onClick={() => setPreviewUrl(`${origin}/scan/${unit.qr_code_id}`)} className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200"><Eye size={14}/> Aperçu Locataire</button>
                      </div>
                  </div>
                ))}
               </div>
            </div>
          )}
        </main>

        {/* MODALS */}
        {editingUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">Modifier Unité</h3><button onClick={() => setEditingUnit(null)}><X size={20}/></button></div>
                <form onSubmit={saveUnitChanges} className="space-y-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Wifi</label><input className="w-full p-3 border rounded-xl bg-gray-50" value={editingUnit.wifi_password || ''} onChange={e => setEditingUnit({...editingUnit, wifi_password: e.target.value})} /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Code Entrée</label><input className="w-full p-3 border rounded-xl bg-gray-50" value={editingUnit.properties?.access_code_main || ''} onChange={e => setEditingUnit({...editingUnit, properties: {...editingUnit.properties, access_code_main: e.target.value}})} /></div>
                  <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex justify-center gap-2"><Save size={18}/> Enregistrer</button>
                </form>
            </div>
          </div>
        )}

        {qrUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center animate-in zoom-in-95 relative">
                <button onClick={() => setQrUnit(null)} className="absolute top-4 right-4 bg-gray-100 p-1 rounded-full"><X size={20}/></button>
                <h3 className="text-2xl font-black text-gray-800 mb-1">Scan Me</h3>
                <p className="text-sm text-gray-500 mb-6">Unité {qrUnit.unit_number}</p>
                <div className="bg-white p-2 rounded-2xl inline-block mb-6 border-4 border-black">
                  {origin && (
                     <img 
                       src={`https://quickchart.io/qr?text=${encodeURIComponent(`${origin}/scan/${qrUnit.qr_code_id}`)}&size=300`} 
                       alt="QR" 
                       className="w-48 h-48" 
                     />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => downloadSingleQR(qrUnit)} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs hover:bg-gray-200"><Download size={16}/> Télécharger</button>
                   <a href={`/admin/print/${qrUnit.id}`} target="_blank" className="flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold text-xs hover:bg-gray-800"><Printer size={16}/> Imprimer (PDF)</a>
                </div>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative animate-in slide-in-from-bottom-10">
                <button onClick={() => setPreviewUrl(null)} className="absolute -top-10 right-0 text-white font-bold flex items-center gap-1"><X size={20}/> Fermer</button>
                <div className="w-[320px] h-[650px] bg-white rounded-[40px] border-[12px] border-gray-900 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-10"></div>
                  <iframe src={previewUrl} className="w-full h-full bg-gray-100" title="Preview" />
                </div>
            </div>
          </div>
        )}
      </div>

      {/* 🖨️ MODE IMPRESSION COLLECTIVE */}
      {/* ⚠️ هنا القفل الصحيح: print:block كيبان فالورقة فقط، و className "block" كيخليه يبان فالشاشة ملي نكليكيو */}
      <div className={`${isPrinting ? "block" : "hidden"} print:block bg-white p-6 absolute top-0 left-0 w-full min-h-screen z-[9999]`}>
           <div className="fixed top-4 right-4 print:hidden">
              <button onClick={() => setIsPrinting(false)} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-xl hover:bg-red-700 flex items-center gap-2"><X size={20}/> Fermer l'impression</button>
           </div>
           <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-3xl font-black mb-1">Proprio Zen</h1>
              <p className="text-sm text-gray-500">Impression globale • {units.length} Unités</p>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              {units.map(unit => (
                 <div key={unit.id} className="rounded-2xl p-4 flex flex-row items-center gap-4 break-inside-avoid" style={{ border: '3px solid black', pageBreakInside: 'avoid' }}>
                    <div className="flex-shrink-0 border border-gray-200 p-1 rounded-lg">
                      {origin && (
                        <img 
                          src={`https://quickchart.io/qr?text=${encodeURIComponent(`${origin}/scan/${unit.qr_code_id}`)}&size=300`} 
                          className="w-32 h-32" 
                          alt="QR"
                          style={{ minWidth: '128px', minHeight: '128px', background: '#f0f0f0' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h2 className="text-xl font-black truncate">Unité {unit.unit_number}</h2>
                       <p className="text-xs text-gray-500 mb-3 truncate">{unit.properties?.property_name}</p>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded"><Wifi size={12}/> <span className="font-mono text-xs font-bold truncate">{unit.wifi_password || 'N/A'}</span></div>
                          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded"><Key size={12}/> <span className="font-mono text-xs font-bold truncate">{unit.properties?.access_code_main || 'N/A'}</span></div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
      </div>

    </div>
  );
}
// Vercel Deploy Test