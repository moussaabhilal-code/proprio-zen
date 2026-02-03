import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex flex-col items-center justify-center p-6 text-white text-center font-sans">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl">
        <h1 className="text-4xl font-black tracking-tighter mb-2">PROPRIO ZEN</h1>
        <p className="text-blue-200 text-sm uppercase tracking-widest mb-8">La Conciergerie Digitale</p>
        
        <div className="space-y-4">
          <Link 
            href="/admin" 
            className="block w-full bg-white text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 transition shadow-lg transform hover:scale-105"
          >
            🔐 Espace Propriétaire (Admin)
          </Link>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink-0 mx-4 text-white/50 text-xs">Vous êtes locataire ?</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>

          <div className="bg-blue-900/50 p-4 rounded-xl border border-blue-400/30">
            <p className="text-xs text-blue-200 mb-2">Scannez le QR Code dans votre appartement pour accéder aux infos.</p>
            <span className="text-2xl">📸</span>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-blue-300/50">Proprio Zen v1.0 • Made with ❤️</p>
    </div>
  );
}