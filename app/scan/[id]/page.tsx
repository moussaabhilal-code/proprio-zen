"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { 
  Wifi, Key, Check, Copy, MessageSquare, 
  AlertTriangle, BookOpen, Utensils, 
  ChevronRight, PhoneCall, Trash2, Menu, X, 
  Coffee, ShoppingCart, Pill, Bus, Camera, Youtube, PlayCircle
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Supabase Keys Missing");
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TenantPage() {
  const params = useParams();
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showVideos, setShowVideos] = useState(false); // 🆕 Youtube Modal

  // Ticket Form
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketCategory, setTicketCategory] = useState("maintenance");
  const [ticketSent, setTicketSent] = useState(false);
  const [sendingTicket, setSendingTicket] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 🆕 File State
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ♻️ LOGIC ZBEL (Hardcoded مؤقتاً)
  const getNextCollection = () => {
    const day = new Date().getDay(); 
    const isRecycleWeek = day % 2 === 0; 
    return isRecycleWeek 
      ? { type: "Recyclage", icon: "♻️", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" }
      : { type: "Déchets", icon: "⚫", color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-200" };
  };
  const trashInfo = getNextCollection();

  // 📺 VIDEOS DATA (Youtube Links)
  const videoGuides = [
     { title: "Changer une ampoule", url: "https://www.youtube.com/watch?v=xyz", duration: "2 min" },
     { title: "Déboucher l'évier", url: "https://www.youtube.com/watch?v=abc", duration: "5 min" },
     { title: "Reset du Chauffage", url: "https://www.youtube.com/watch?v=123", duration: "1 min" },
  ];

  // 📍 SIDEBAR DATA (Mock Data - No API Cost)
  const localSpots = [
     { name: "Café du Coin", type: "Café", icon: <Coffee size={18}/>, desc: "2 min à pied" },
     { name: "Supermarché Metro", type: "Courses", icon: <ShoppingCart size={18}/>, desc: "Ouvert jsq 22h" },
     { name: "Pharmacie Jean Coutu", type: "Santé", icon: <Pill size={18}/>, desc: "Service de garde" },
     { name: "Arrêt Bus 45", type: "Transport", icon: <Bus size={18}/>, desc: "Vers Métro" },
  ];

  useEffect(() => {
    async function fetchUnit() {
      if (!params.id) return;
      const { data, error } = await supabase.from("units").select("*, properties(*)").eq("qr_code_id", params.id).single();
      if (error) console.error(error);
      setUnit(data);
      setLoading(false);
    }
    fetchUnit();
  }, [params.id]);

  const handleCopy = (text: string, type: 'wifi' | 'code') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    if (type === 'wifi') setCopiedWifi(true); else setCopiedCode(true);
    setShowToast(true);
    setTimeout(() => { if (type === 'wifi') setCopiedWifi(false); else setCopiedCode(false); }, 2000);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 📸 UPLOAD FUNCTION
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('ticket-photos').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('ticket-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    setSendingTicket(true);

    try {
      let imageUrl = null;
      if (selectedFile) {
         imageUrl = await uploadImage(selectedFile);
      }

      const { error } = await supabase.from("tickets").insert([{
        unit_id: unit.id,
        property_id: unit.property_id, // ⚠️ خاصك تكون زدتي هاد العمود ف Supabase
        description: ticketMsg,
        category: ticketCategory,
        photo_url: imageUrl, // ⚠️ خاصك تكون زدتي هاد العمود (text) ف Supabase
        status: 'pending',
        created_at: new Date()
      }]);

      if (error) throw error;

      setTicketSent(true);
      setTicketMsg("");
      setSelectedFile(null);
      setTimeout(() => { setTicketSent(false); setShowTicketForm(false); }, 3000);

    } catch (error: any) {
      alert("Erreur: " + error.message);
    } finally {
      setSendingTicket(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 bg-gray-100">Chargement...</div>;
  if (!unit) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500 bg-gray-100">Unité introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#eef2f6] flex justify-center sm:py-8 font-sans overflow-x-hidden">
      
      {/* 🍔 SIDEBAR (Static Data - No API Cost) */}
      <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)}></div>
         <div className="absolute right-0 h-full w-3/4 max-w-xs bg-white shadow-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black text-gray-800">Quartier</h2>
               <button onClick={() => setShowSidebar(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
               {localSpots.map((spot, i) => (
                 <div key={i} className="bg-gray-50 p-4 rounded-xl flex items-center gap-4 hover:bg-gray-100 transition">
                    <div className="bg-white p-2 rounded-lg text-black shadow-sm">{spot.icon}</div>
                    <div><p className="font-bold text-gray-800">{spot.name}</p><p className="text-xs text-gray-500">{spot.desc}</p></div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* 📺 VIDEO MODAL */}
      {showVideos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowVideos(false)}></div>
           <div className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10 animate-in zoom-in">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-xl">Guides Dépanage 🛠️</h3>
                 <button onClick={() => setShowVideos(false)}><X/></button>
              </div>
              <div className="space-y-3">
                 {videoGuides.map((vid, i) => (
                    <a key={i} href={vid.url} target="_blank" className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
                       <PlayCircle size={32} className="text-red-600"/>
                       <div><p className="font-bold text-sm text-gray-800">{vid.title}</p><p className="text-xs text-gray-500">{vid.duration}</p></div>
                    </a>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="w-full max-w-[420px] bg-white sm:rounded-[35px] shadow-2xl overflow-hidden min-h-screen sm:min-h-0 relative flex flex-col">
        
        {/* HEADER */}
        <div className="relative h-72">
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
           <img src={unit.properties?.image_url || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800"} className="w-full h-full object-cover"/>
           <div className="absolute bottom-0 left-0 w-full p-6 z-20">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-3 inline-block">Locataire</span>
              <h1 className="text-3xl font-black text-white leading-tight mb-1">Bienvenue chez vous !</h1>
              <div className="flex items-center justify-between mt-2">
                  <div><p className="text-white font-bold text-lg">{unit.properties?.property_name}</p><p className="text-gray-300 text-sm">Unité {unit.unit_number}</p></div>
                  <button onClick={() => setShowSidebar(true)} className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition shadow-lg"><Menu size={20}/></button>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] rounded-t-[30px] -mt-6 relative z-30 px-5 pt-8 pb-8 space-y-6">

          {/* WIFI & CODE (Keep same as before) */}
          <div className="space-y-3">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0"><Wifi size={24}/></div>
                  <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Wi-Fi</p>
                      <p className="font-bold text-gray-800 truncate mb-2">{unit.properties?.property_name}_Guest</p>
                      <div className="flex justify-between bg-gray-50 rounded-lg p-2 pr-3">
                          <code className="text-lg font-black text-gray-800">{unit.wifi_password || "Open"}</code>
                          <button onClick={() => handleCopy(unit.wifi_password, 'wifi')} className="text-blue-600">{copiedWifi ? <Check size={18}/> : <Copy size={18}/>}</button>
                      </div>
                  </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Key size={24}/></div>
                    <div><p className="text-[10px] text-gray-400 font-bold uppercase">Code Entrée</p><p className="text-xl font-black text-gray-800">{unit.properties?.access_code_main || "..."}</p></div>
                </div>
                <button onClick={() => handleCopy(unit.properties?.access_code_main, 'code')} className="bg-gray-50 p-3 rounded-xl">{copiedCode ? <Check size={20} className="text-green-500"/> : <Copy size={20}/>}</button>
              </div>
          </div>

          {/* TRASH WIDGET */}
          <div className={`p-4 rounded-2xl flex items-center gap-4 border ${trashInfo.bg} ${trashInfo.border}`}>
              <div className="bg-white p-2.5 rounded-full shadow-sm text-lg">{trashInfo.icon}</div>
              <div><p className={`text-xs font-bold uppercase ${trashInfo.color}`}>Prochaine Collecte</p><p className="text-sm font-bold text-gray-700">Demain : {trashInfo.type}</p></div>
          </div>

          {/* ACTION GRID (With Video Guide) */}
          <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setShowVideos(true)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2 hover:bg-gray-50 active:scale-95">
                  <div className="bg-red-50 p-3 rounded-xl text-red-600"><Youtube size={20}/></div>
                  <span className="font-bold text-gray-700 text-xs">Vidéos Dépanage</span>
               </button>
               <button onClick={() => setShowSidebar(true)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2 hover:bg-gray-50 active:scale-95">
                  <div className="bg-pink-50 p-3 rounded-xl text-pink-600"><Utensils size={20}/></div>
                  <span className="font-bold text-gray-700 text-xs">Guide Quartier</span>
               </button>
          </div>

          {/* TICKET FORM (With Photo Upload) */}
          <div className="pt-2">
             {!showTicketForm ? (
                 <button onClick={() => setShowTicketForm(true)} className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between group active:scale-[0.98]">
                    <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-lg"><MessageSquare size={18}/></div><div className="text-left"><p className="font-bold text-sm">Signaler un problème</p></div></div>
                    <ChevronRight className="text-gray-400 group-hover:text-white"/>
                 </button>
             ) : (
                 <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-black text-gray-800">Nouveau Ticket</h3><button onClick={() => setShowTicketForm(false)} className="text-xs font-bold text-red-500">Annuler</button></div>
                    {ticketSent ? (
                       <div className="text-center py-8 bg-green-50 rounded-xl"><Check size={40} className="text-green-600 mx-auto mb-3"/><p className="font-bold text-green-800">Envoyé !</p></div>
                    ) : (
                       <form onSubmit={submitTicket} className="space-y-3">
                          <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-700 outline-none">
                             <option value="maintenance">🛠️ Maintenance</option><option value="plomberie">💧 Plomberie</option><option value="electricite">⚡ Électricité</option>
                          </select>
                          <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-black outline-none h-24 resize-none" placeholder="Décrivez le problème..." value={ticketMsg} onChange={e => setTicketMsg(e.target.value)}></textarea>
                          
                          {/* 📸 PHOTO INPUT */}
                          <div className="flex items-center gap-2">
                              <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${selectedFile ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  <Camera size={16}/> {selectedFile ? "Photo ajoutée !" : "Ajouter une photo"}
                              </button>
                              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                          </div>

                          <button disabled={sendingTicket || !ticketMsg.trim()} className="w-full bg-black text-white font-bold py-3 rounded-xl text-sm flex justify-center items-center gap-2">
                             {sendingTicket ? "Envoi..." : "Envoyer le signalement"}
                          </button>
                       </form>
                    )}
                 </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 pb-6">
             <a href="tel:+15550000000" className="flex flex-col items-center justify-center gap-1 bg-gray-200 text-gray-800 py-4 rounded-xl font-bold text-xs"><PhoneCall size={18}/><span>Manager</span></a>
             <a href="tel:911" className="flex flex-col items-center justify-center gap-1 bg-red-100 text-red-700 py-4 rounded-xl font-bold text-xs"><AlertTriangle size={18}/><span>Urgence 911</span></a>
          </div>

        </div>
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 pointer-events-none z-50 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}><Check size={12}/><span className="text-xs font-bold">Copié !</span></div>
      </div>
    </div>
  );
}