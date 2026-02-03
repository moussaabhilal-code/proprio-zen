"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Wifi, Key, MapPin, Smartphone } from "lucide-react"; 
import { useParams } from "next/navigation"; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export default function PrintUnitPage() {
  const params = useParams(); 
  const [unit, setUnit] = useState<any>(null);

  useEffect(() => {
    async function fetchUnit() {
      if (!params.id) return;
      const { data } = await supabase
        .from("units")
        .select("*, properties(*)")
        .eq("id", params.id)
        .single();
      
      if (data) {
        setUnit(data);
        setTimeout(() => window.print(), 800); 
      }
    }
    fetchUnit();
  }, [params.id]);

  if (!unit) return <div className="p-10 text-center font-bold">Chargement...</div>;

  const scanUrl = `${window.location.origin}/scan/${unit.qr_code_id}`;
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(scanUrl)}`;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      
      {/* --- DESIGN CARTE PRO --- */}
      <div className="w-[400px] border-[6px] border-black rounded-[30px] overflow-hidden relative">
        
        {/* Header Noir */}
        <div className="bg-black text-white p-6 text-center">
           <div className="uppercase tracking-[0.2em] text-[10px] font-bold mb-1 opacity-80">Bienvenue chez vous</div>
           <h1 className="text-3xl font-black">{unit.properties?.property_name}</h1>
           <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mt-1">
              <MapPin size={12}/> Unité {unit.unit_number}
           </div>
        </div>

        {/* Corps Blanc avec QR */}
        <div className="bg-white p-8 flex flex-col items-center">
           <p className="text-center text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Scannez pour accéder</p>
           
           <div className="border-4 border-black p-2 rounded-2xl mb-6">
             <img src={qrApi} alt="QR Code" className="w-56 h-56" />
           </div>

           {/* Infos Wifi & Code */}
           <div className="w-full grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                 <Wifi size={20} className="mx-auto mb-1 text-black"/>
                 <p className="text-[10px] text-gray-400 uppercase font-bold">Wifi</p>
                 <p className="text-sm font-black text-gray-900 truncate">{unit.wifi_password || "-"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center">
                 <Key size={20} className="mx-auto mb-1 text-black"/>
                 <p className="text-[10px] text-gray-400 uppercase font-bold">Code</p>
                 <p className="text-sm font-black text-gray-900 truncate">{unit.properties?.access_code_main || "-"}</p>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 text-center border-t border-gray-200">
           <p className="text-[10px] text-gray-500 font-mono flex items-center justify-center gap-1">
             <Smartphone size={10}/>
             Proprio Zen • Support 24/7
           </p>
        </div>

      </div>

    </div>
  );
}