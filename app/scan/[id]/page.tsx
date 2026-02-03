"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { 
  Wifi, Key, Check, Copy, MessageSquare, 
  AlertTriangle, Send, MapPin, BookOpen, 
  Utensils, Building2, ChevronRight, PhoneCall, Trash2, Map
} from "lucide-react";

// --- CONFIGURATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { throw new Error("Supabase Keys Missing"); }
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TenantPage() {
  const params = useParams();
  
  // Data State
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false); // باش نخبيو الفورمولير

  // Ticket Form State
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketSent, setTicketSent] = useState(false);
  const [sendingTicket, setSendingTicket] = useState(false);

  useEffect(() => {
    async function fetchUnit() {
      if (!params.id) return;
      // كنجيبو حتى العنوان (address) من properties
      const { data, error } = await supabase
        .from("units")
        .select("*, properties(*)")
        .eq("qr_code_id", params.id)
        .single();
      
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

    if (type === 'wifi') setCopiedWifi(true);
    else setCopiedCode(true);
    setShowToast(true);

    setTimeout(() => {
      if (type === 'wifi') setCopiedWifi(false);
      else setCopiedCode(false);
    }, 2000);
    setTimeout(() => setShowToast(false), 3000);
  };

  const openMap = () => {
    if (unit?.properties?.address) {
        // كيدي لـ Google Maps بالعنوان
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.properties.address)}`, '_blank');
    }
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    setSendingTicket(true);

    const { error } = await supabase.from("tickets").insert([{
      unit_id: unit.id,
      property_id: unit.property_id,
      description: ticketMsg,
      status: 'pending',
      category: 'general',
      created_at: new Date()
    }]);

    setSendingTicket(false);
    if (!error) {
      setTicketSent(true);
      setTicketMsg("");
      setTimeout(() => {
          setTicketSent(false);
          setShowTicketForm(false); // نسدو الفورمولير من بعد الارسال
      }, 3000);
    } else {
      alert("Erreur: " + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 bg-gray-100">Chargement...</div>;
  if (!unit) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500 bg-gray-100">Unité introuvable.</div>;

  return (
    // 🎨 LAYOUT FIX: Centered Container like a Mobile App
    // هاد الخلفية الرمادية والـ Box فالوسط هو اللي غايحل مشكل الفراغ
    <div className="min-h-screen bg-[#eef2f6] flex justify-center sm:py-8 font-sans">
      
      <div className="w-full max-w-[420px] bg-white sm:rounded-[35px] shadow-2xl overflow-hidden min-h-screen sm:min-h-0 relative flex flex-col">
        
        {/* 1️⃣ HEADER: REAL PHOTO & WELCOME */}
        <div className="relative h-72">
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
           <img 
             src={unit.properties?.image_url || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800"} 
             className="w-full h-full object-cover"
             alt="Immeuble"
           />
           <div className="absolute bottom-0 left-0 w-full p-6 z-20">
              <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
                Locataire
              </span>
              <h1 className="text-3xl font-black text-white leading-tight mb-1">Bienvenue chez vous !</h1>
              <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-white font-bold text-lg">{unit.properties?.property_name}</p>
                    <p className="text-gray-300 text-sm flex items-center gap-1">Unité {unit.unit_number}</p>
                  </div>
                  {/* 📍 زر الخريطة */}
                  <button onClick={openMap} className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2.5 rounded-full text-white border border-white/30 transition shadow-lg active:scale-90">
                      <Map size={20} />
                  </button>
              </div>
           </div>
        </div>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] rounded-t-[30px] -mt-6 relative z-30 px-5 pt-8 pb-8 space-y-6">

          {/* 2️⃣ ACCESS CARDS (WIFI & DOOR) */}
          <div className="space-y-3">
              {/* WIFI - Enhanced with Network Name */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5"><Wifi size={80}/></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0"><Wifi size={24}/></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Réseau Wi-Fi (SSID)</p>
                        {/* Placeholder Name if not in DB, assume generic */}
                        <p className="font-bold text-gray-800 truncate mb-2">{unit.properties?.property_name}_Wifi</p> 
                        
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 pr-3">
                            <code className="text-lg font-black text-gray-800 font-mono truncate mr-2">{unit.wifi_password || "Open"}</code>
                            <button onClick={() => handleCopy(unit.wifi_password, 'wifi')} className="text-blue-600 hover:text-blue-700 p-1">
                                {copiedWifi ? <Check size={18}/> : <Copy size={18}/>}
                            </button>
                        </div>
                    </div>
                </div>
              </div>

              {/* DOOR CODE */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Key size={24}/></div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Code Entrée</p>
                        <p className="text-xl font-black text-gray-800 font-mono">{unit.properties?.access_code_main || "Wait..."}</p>
                    </div>
                </div>
                <button onClick={() => handleCopy(unit.properties?.access_code_main, 'code')} className={`p-3 rounded-xl transition ${copiedCode ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                    {copiedCode ? <Check size={20}/> : <Copy size={20}/>}
                </button>
              </div>
          </div>

          {/* 3️⃣ WIDGET POUBELLES (NEW) 🗑️ */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-white p-2.5 rounded-full shadow-sm text-emerald-600">
                  <Trash2 size={20} />
              </div>
              <div>
                  <p className="text-xs text-emerald-800 font-bold uppercase">Prochaine Collecte</p>
                  <p className="text-sm font-bold text-gray-700">Demain : Recyclage ♻️</p>
              </div>
          </div>

          {/* 4️⃣ ACTION BUTTONS GRID */}
          <div className="grid grid-cols-2 gap-3">
               <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2 hover:bg-gray-50 transition active:scale-95">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><BookOpen size={20}/></div>
                  <span className="font-bold text-gray-700 text-xs">Guide Maison</span>
               </button>
               <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2 hover:bg-gray-50 transition active:scale-95">
                  <div className="bg-pink-50 p-3 rounded-xl text-pink-600"><Utensils size={20}/></div>
                  <span className="font-bold text-gray-700 text-xs">Quartier</span>
               </button>
          </div>

          {/* 5️⃣ ASSISTANCE (ACCORDION STYLE - خبينا الفورمولير) */}
          <div className="pt-2">
             {!showTicketForm ? (
                 <button 
                    onClick={() => setShowTicketForm(true)}
                    className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between group active:scale-[0.98] transition"
                 >
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg"><MessageSquare size={18}/></div>
                        <div className="text-left">
                            <p className="font-bold text-sm">Signaler un problème</p>
                            <p className="text-[10px] text-gray-300">Fuite, Chauffage, Bruit...</p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-white transition"/>
                 </button>
             ) : (
                 <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-black text-gray-800">Nouveau Ticket</h3>
                        <button onClick={() => setShowTicketForm(false)} className="text-xs font-bold text-red-500">Annuler</button>
                    </div>
                    {ticketSent ? (
                       <div className="text-center py-6 bg-green-50 rounded-xl">
                           <Check size={32} className="text-green-600 mx-auto mb-2"/>
                           <p className="font-bold text-green-800 text-sm">Message Envoyé !</p>
                       </div>
                    ) : (
                       <form onSubmit={submitTicket}>
                          <textarea 
                             autoFocus
                             className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none h-24 mb-3 resize-none"
                             placeholder="Décrivez le problème ici..."
                             value={ticketMsg}
                             onChange={e => setTicketMsg(e.target.value)}
                          ></textarea>
                          <button disabled={sendingTicket || !ticketMsg.trim()} className="w-full bg-black text-white font-bold py-3 rounded-xl text-sm flex justify-center items-center gap-2 hover:bg-gray-800">
                             {sendingTicket ? "Envoi..." : <><Send size={14}/> Envoyer le signalement</>}
                          </button>
                       </form>
                    )}
                 </div>
             )}
          </div>

          {/* 6️⃣ EMERGENCY FOOTER (SPLIT - فرقناهم) 🆘 */}
          <div className="grid grid-cols-2 gap-3 pt-2 pb-6">
             <a href="tel:+15550000000" className="flex flex-col items-center justify-center gap-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-xs border border-gray-200 hover:bg-gray-200 transition">
                <PhoneCall size={16}/> 
                <span>Manager</span>
             </a>
             <a href="tel:911" className="flex flex-col items-center justify-center gap-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold text-xs border border-red-100 hover:bg-red-100 transition">
                <AlertTriangle size={16}/> 
                <span>Urgence 911</span>
             </a>
          </div>

        </div>

        {/* TOAST NOTIFICATION */}
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 pointer-events-none z-50 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Check size={16} className="text-green-400"/>
            <span className="text-xs font-bold">Copié !</span>
        </div>

      </div>
    </div>
  );
}