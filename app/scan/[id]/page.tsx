"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { 
  Wifi, Key, Check, Copy, MessageSquare, 
  AlertTriangle, Send, MapPin, Phone, Info,
  BookOpen, Utensils, Building2, ChevronRight 
} from "lucide-react";

// --- 1. CONFIGURATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { throw new Error("Supabase Keys Missing"); }

const supabase = createClient(supabaseUrl, supabaseKey);

export default function TenantPage() {
  const params = useParams();
  
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Ticket States
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketSent, setTicketSent] = useState(false);
  const [sendingTicket, setSendingTicket] = useState(false);

  useEffect(() => {
    async function fetchUnit() {
      if (!params.id) return;
      
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
      setTimeout(() => setTicketSent(false), 5000);
    } else {
      alert("Erreur: " + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Chargement...</div>;
  if (!unit) return <div className="min-h-screen flex items-center justify-center font-bold text-red-500">Unité introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-12">
      
      {/* 🖼️ HERO IMAGE */}
      <div className="relative h-72 bg-gray-900 overflow-hidden shadow-2xl rounded-b-[40px]">
         <div className="absolute inset-0 bg-black/40 z-10"></div>
         <img 
           src={unit.properties?.image_url || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800"} 
           className="w-full h-full object-cover"
           alt="Propriété"
         />
         <div className="absolute bottom-0 left-0 w-full p-8 z-20">
            <h1 className="text-3xl font-black text-white leading-tight mb-1">{unit.properties?.property_name}</h1>
            <p className="text-gray-200 font-medium text-lg flex items-center gap-2">
              <MapPin size={16}/> Unité {unit.unit_number}
            </p>
         </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-8 relative z-30 space-y-6">
        
        {/* 1️⃣ ACCÈS (WIFI & CODE) */}
        <div className="space-y-4">
            {/* Wifi */}
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 flex justify-between items-center transition active:scale-[0.98]">
            <div className="flex items-center gap-5">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Wifi size={28}/></div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Wifi</p>
                    <p className="text-2xl font-mono font-black text-gray-800 tracking-tight">{unit.wifi_password || "Open"}</p>
                </div>
            </div>
            <button onClick={() => handleCopy(unit.wifi_password, 'wifi')} className={`p-4 rounded-2xl transition ${copiedWifi ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                {copiedWifi ? <Check size={24}/> : <Copy size={24}/>}
            </button>
            </div>

            {/* Code */}
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 flex justify-between items-center transition active:scale-[0.98]">
            <div className="flex items-center gap-5">
                <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Key size={28}/></div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Entrée</p>
                    <p className="text-2xl font-mono font-black text-gray-800 tracking-tight">{unit.properties?.access_code_main || "N/A"}</p>
                </div>
            </div>
            <button onClick={() => handleCopy(unit.properties?.access_code_main, 'code')} className={`p-4 rounded-2xl transition ${copiedCode ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                {copiedCode ? <Check size={24}/> : <Copy size={24}/>}
            </button>
            </div>
        </div>

        {/* 2️⃣ NOUVEAU: INFO HUB (GUIDE & VILLE) 📘 */}
        <div>
            <div className="flex items-center gap-2 mb-3 px-2 mt-2">
              <div className="w-1 h-5 bg-gray-800 rounded-full"></div>
              <h3 className="text-lg font-black text-gray-800">Infos Pratiques</h3>
           </div>
           
           <div className="grid grid-cols-1 gap-3">
               {/* Guide Locataire */}
               <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition group">
                  <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><BookOpen size={20}/></div>
                      <div className="text-left">
                          <p className="font-bold text-gray-800">Guide Locataire</p>
                          <p className="text-xs text-gray-400">Règlement, Chauffage, Poubelles...</p>
                      </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600"/>
               </button>

               <div className="grid grid-cols-2 gap-3">
                    {/* Services Ville */}
                    <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 hover:bg-gray-50 transition">
                        <div className="bg-green-50 p-3 rounded-xl text-green-600 mb-1"><Building2 size={20}/></div>
                        <p className="font-bold text-gray-800 text-sm">Services Ville</p>
                    </button>
                    {/* Quartier */}
                    <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 hover:bg-gray-50 transition">
                        <div className="bg-pink-50 p-3 rounded-xl text-pink-600 mb-1"><Utensils size={20}/></div>
                        <p className="font-bold text-gray-800 text-sm">Quartier</p>
                    </button>
               </div>
           </div>
        </div>

        {/* 3️⃣ SUPPORT / TICKET */}
        <div className="pt-2">
           <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-1 h-5 bg-purple-600 rounded-full"></div>
              <h3 className="text-lg font-black text-gray-800">Assistance</h3>
           </div>
           
           <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
              {ticketSent ? (
                 <div className="text-center py-6 animate-in zoom-in">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={32} className="text-green-600"/></div>
                    <h4 className="font-bold text-gray-800">Message Reçu !</h4>
                    <p className="text-sm text-gray-500 mt-1">On s'en occupe.</p>
                 </div>
              ) : (
                 <form onSubmit={submitTicket}>
                    <textarea 
                       className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-28 mb-4 transition"
                       placeholder="Un problème ? Décrivez-le ici..."
                       value={ticketMsg}
                       onChange={e => setTicketMsg(e.target.value)}
                    ></textarea>
                    <button disabled={sendingTicket || !ticketMsg.trim()} className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg">
                       {sendingTicket ? "Envoi..." : <><Send size={18}/> Envoyer le message</>}
                    </button>
                 </form>
              )}
           </div>
        </div>

        {/* 4️⃣ URGENCES */}
        <div className="pt-4 pb-6 flex flex-col items-center">
           <a href="tel:911" className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition flex items-center justify-center gap-3">
              <div className="bg-red-200 p-1.5 rounded-full"><AlertTriangle size={16}/></div>
              Urgences (911)
           </a>
        </div>

      </div>

      {/* TOAST */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 z-50 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <Check size={18} className="text-green-400"/>
          <span className="font-bold text-sm">Copié !</span>
      </div>

    </div>
  );
}