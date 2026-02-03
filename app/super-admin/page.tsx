"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Building, Wifi, Save, Copy, Layers, Repeat,
  CheckCircle, AlertTriangle, Database, ArrowRight, History, Hash, Key, Lock, ShieldAlert
} from "lucide-react";

// 1. Initialisation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { throw new Error("Supabase Keys Missing"); }
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SuperAdminPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual');

  // Data
  const [properties, setProperties] = useState<any[]>([]);
  const [recentUnits, setRecentUnits] = useState<any[]>([]);
  
  // Selection
  const [selectedPropId, setSelectedPropId] = useState("");

  // States: Manual
  const [manualData, setManualData] = useState({
    unit_number: "",
    wifi_ssid: "",
    wifi_password: "",
    access_code: "" // 👈 خانة جديدة (Interphone/Smart Lock)
  });
  const [keepValues, setKeepValues] = useState(true);
  
  // States: Bulk
  const [bulkData, setBulkData] = useState({
    start: 101,
    end: 120,
    wifi_ssid: "",
    wifi_password: "",
    access_code: "" // 👈 خانة جديدة للكل
  });

  // UI Feedback
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await fetchProperties();
        await fetchRecentUnits();
      }
      setLoading(false);
    }
    init();
  }, []);

  const fetchProperties = async () => {
    const { data } = await supabase.from("properties").select("*").order("property_name");
    if (data) setProperties(data);
  };

  const fetchRecentUnits = async () => {
    const { data } = await supabase
      .from("units")
      .select("*, properties(property_name)")
      .order("created_at", { ascending: false })
      .limit(7);
    if (data) setRecentUnits(data);
  };

  // 🛡️ دالة التحقق من التكرار (Anti-Doublon)
  const checkDuplicate = async (unitNum: string) => {
    const { data } = await supabase
      .from("units")
      .select("id")
      .eq("property_id", selectedPropId)
      .eq("unit_number", unitNum)
      .maybeSingle(); // maybeSingle ما كيرجعش error إيلا مالقاش
    
    return !!data; // كترجع true إيلا لقاتو
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- MANUAL SUBMIT ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropId || !manualData.unit_number) {
      showToast("❌ Manque d'infos (Immeuble ou Numéro)", 'error');
      return;
    }

    // 1. Check Doublon
    const exists = await checkDuplicate(manualData.unit_number);
    if (exists) {
      // 🚨 ALERTE ROUGE
      showToast(`⚠️ Attention: L'unité ${manualData.unit_number} existe déjà !`, 'error');
      return; // Stop
    }

    // 2. Insert
    const { error } = await supabase.from("units").insert([{
      property_id: selectedPropId,
      unit_number: manualData.unit_number,
      wifi_ssid: manualData.wifi_ssid,
      wifi_password: manualData.wifi_password,
      access_code: manualData.access_code // 👈 تخزين الكود
    }]);

    if (error) {
      showToast("Erreur: " + error.message, 'error');
    } else {
      // ✅ SUCCÈS
      fetchRecentUnits();
      showToast(`✅ Unité ${manualData.unit_number} ajoutée avec succès !`, 'success');
      
      if (keepValues) {
        // خوي الرقم، خلي الويفي والكود
        setManualData({ ...manualData, unit_number: "" });
      } else {
        setManualData({ unit_number: "", wifi_ssid: "", wifi_password: "", access_code: "" });
      }
    }
  };

  // --- BULK SUBMIT ---
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropId) { showToast("Choisis l'immeuble !", 'error'); return; }
    
    const start = parseInt(bulkData.start.toString());
    const end = parseInt(bulkData.end.toString());
    
    if (end < start) { showToast("Erreur: La fin est avant le début !", 'error'); return; }
    if ((end - start) > 100) { showToast("Max 100 unités à la fois.", 'error'); return; }

    // هنا صعيب نديرو checkDuplicate لكل وحدة قبل ما نصيفطو، 
    // غانعتمدو على Supabase يرجع error إيلا كان constraint unique
    // أو نقدرو نصيفطو ونشوفو
    
    const unitsToInsert = [];
    for (let i = start; i <= end; i++) {
      unitsToInsert.push({
        property_id: selectedPropId,
        unit_number: i.toString(),
        wifi_ssid: bulkData.wifi_ssid,
        wifi_password: bulkData.wifi_password,
        access_code: bulkData.access_code
      });
    }

    const { error } = await supabase.from("units").insert(unitsToInsert);

    if (error) {
      if (error.code === '23505') { // Unique Violation Code
         showToast("⚠️ Erreur: Certaines unités existent déjà dans la plage !", 'error');
      } else {
         showToast("Erreur Bulk: " + error.message, 'error');
      }
    } else {
      showToast(`🚀 ${unitsToInsert.length} unités créées (De ${start} à ${end}).`, 'success');
      fetchRecentUnits();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold bg-slate-900 text-white">Chargement Usine...</div>;
  if (!session) return <div className="h-screen flex items-center justify-center text-red-500 font-bold bg-slate-900">⛔ Accès Interdit</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6">
      
      {/* HEADER */}
      <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
           <h1 className="text-3xl font-black text-white flex items-center gap-3"><Database className="text-blue-500"/> Super-Console</h1>
           <p className="text-slate-500 text-sm mt-1 font-mono">Système d'Injection V3.0 • Ready for Production</p>
        </div>
        
        <div className="bg-slate-900 p-1.5 rounded-xl flex border border-slate-800">
          <button onClick={() => setMode('manual')} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${mode === 'manual' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white'}`}>
             <Layers size={14}/> Saisie Unitaire
          </button>
          <button onClick={() => setMode('bulk')} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${mode === 'bulk' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-slate-400 hover:text-white'}`}>
             <Repeat size={14}/> Générateur (Bulk)
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE (INPUTS) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* IMMEUBLE SELECTOR */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
             <label className="text-xs font-bold text-blue-400 uppercase mb-3 block flex items-center gap-2"><Building size={14}/> Immeuble Cible</label>
             <select 
                className="w-full bg-slate-950 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                value={selectedPropId}
                onChange={e => setSelectedPropId(e.target.value)}
             >
                <option value="">-- Choisir un immeuble --</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
             </select>
          </div>

          {/* MODE: MANUAL */}
          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl relative animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-white">Ajout Unitaire</h3>
                   <label className="flex items-center gap-3 cursor-pointer bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 hover:border-blue-500/50 transition">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${keepValues ? 'bg-blue-600 border-blue-600' : 'border-slate-500'}`}>
                         {keepValues && <CheckCircle size={14} className="text-white"/>}
                      </div>
                      <input type="checkbox" className="hidden" checked={keepValues} onChange={e => setKeepValues(e.target.checked)} />
                      <span className="text-xs font-bold text-slate-300">Garder les infos</span>
                   </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2"><Hash size={14}/> Numéro Unité</label>
                      <input autoFocus className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-3xl font-black focus:border-blue-500 outline-none text-white tracking-widest placeholder-slate-800" placeholder="101" value={manualData.unit_number} onChange={e => setManualData({...manualData, unit_number: e.target.value})} />
                   </div>
                   
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2"><Wifi size={14}/> Nom Wifi (SSID)</label>
                      <input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl font-medium focus:border-blue-500 outline-none" placeholder="Residence_Wifi" value={manualData.wifi_ssid} onChange={e => setManualData({...manualData, wifi_ssid: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2"><Lock size={14}/> Mot de passe Wifi</label>
                      <input className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl font-mono focus:border-blue-500 outline-none" placeholder="Pass123" value={manualData.wifi_password} onChange={e => setManualData({...manualData, wifi_password: e.target.value})} />
                   </div>

                   {/* 👇 NEW FIELD: CODE D'ENTRÉE */}
                   <div className="md:col-span-2">
                      <label className="text-xs font-bold text-yellow-500 uppercase mb-2 block flex items-center gap-2"><Key size={14}/> Code d'entrée / Interphone</label>
                      <input className="w-full bg-slate-950 border border-yellow-900/30 p-3 rounded-xl font-mono text-yellow-100 focus:border-yellow-500 outline-none" placeholder="Ex: #1234 (Laisser vide si code immeuble par défaut)" value={manualData.access_code} onChange={e => setManualData({...manualData, access_code: e.target.value})} />
                   </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-xl text-lg shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2 active:scale-[0.98]">
                   <Save size={20}/> Enregistrer l'Unité
                </button>
            </form>
          )}

          {/* MODE: BULK */}
          {mode === 'bulk' && (
             <form onSubmit={handleBulkSubmit} className="bg-slate-900 p-8 rounded-2xl border border-purple-900/30 shadow-2xl relative animate-in fade-in">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Repeat size={100} className="text-purple-500"/></div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Repeat className="text-purple-500"/> Générateur de Plage</h3>

                <div className="flex items-end gap-4 mb-8">
                   <div className="flex-1">
                      <label className="text-xs font-bold text-purple-400 uppercase mb-2 block">De (Start)</label>
                      <input type="number" className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-2xl font-black focus:border-purple-500 outline-none" value={bulkData.start} onChange={e => setBulkData({...bulkData, start: parseInt(e.target.value)})} />
                   </div>
                   <div className="pb-6 text-slate-600"><ArrowRight/></div>
                   <div className="flex-1">
                      <label className="text-xs font-bold text-purple-400 uppercase mb-2 block">À (End)</label>
                      <input type="number" className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-2xl font-black focus:border-purple-500 outline-none" value={bulkData.end} onChange={e => setBulkData({...bulkData, end: parseInt(e.target.value)})} />
                   </div>
                </div>

                <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/20 mb-8 grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-bold text-purple-300 uppercase mb-1 block">Nom Wifi (Commun)</label>
                      <input className="w-full bg-slate-950 border border-purple-500/30 p-2 rounded-lg text-sm" value={bulkData.wifi_ssid} onChange={e => setBulkData({...bulkData, wifi_ssid: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-purple-300 uppercase mb-1 block">Pass Wifi (Commun)</label>
                      <input className="w-full bg-slate-950 border border-purple-500/30 p-2 rounded-lg text-sm font-mono" value={bulkData.wifi_password} onChange={e => setBulkData({...bulkData, wifi_password: e.target.value})} />
                   </div>
                   <div className="col-span-2">
                      <label className="text-[10px] font-bold text-purple-300 uppercase mb-1 block flex items-center gap-1"><Key size={10}/> Code Entrée (Commun)</label>
                      <input className="w-full bg-slate-950 border border-purple-500/30 p-2 rounded-lg text-sm font-mono" value={bulkData.access_code} onChange={e => setBulkData({...bulkData, access_code: e.target.value})} placeholder="Optionnel"/>
                   </div>
                </div>

                <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-xl text-lg shadow-lg shadow-purple-900/20 transition flex items-center justify-center gap-2 active:scale-[0.98]">
                   <Layers size={20}/> Générer {bulkData.end - bulkData.start + 1} Unités
                </button>
             </form>
          )}

        </div>

        {/* COLONNE DROITE (LOG) */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
              <History size={16}/> Activité Récente
           </div>
           
           <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              {recentUnits.length === 0 ? (
                 <div className="p-8 text-center text-slate-600 text-sm">Aucune activité.</div>
              ) : (
                 <div className="divide-y divide-slate-800">
                    {recentUnits.map((unit) => (
                       <div key={unit.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition animate-in slide-in-from-right-2">
                          <div>
                             <div className="font-black text-white text-lg flex items-center gap-2">
                                Unité {unit.unit_number}
                                {unit.access_code && <Key size={10} className="text-yellow-500"/>}
                             </div>
                             <div className="text-[10px] text-slate-400 font-medium">{unit.properties?.property_name}</div>
                          </div>
                          <div className="text-right">
                             <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20">Ajouté</span>
                             <div className="text-[10px] text-slate-600 mt-1 font-mono">{new Date(unit.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

      </main>

      {/* ✨ TOAST NOTIFICATION SYSTEM ✨ */}
      {toast && (
         <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
             <div className="bg-white/20 p-1 rounded-full">
                {toast.type === 'success' ? <CheckCircle size={20}/> : <ShieldAlert size={20}/>}
             </div>
             <div>
                <p className="font-bold">{toast.type === 'success' ? 'Succès' : 'Erreur'}</p>
                <p className="text-xs opacity-90">{toast.msg}</p>
             </div>
         </div>
      )}

    </div>
  );
}