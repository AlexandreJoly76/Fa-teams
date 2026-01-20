'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import Terrain from '@/components/Terrain';
import Joueur from '@/components/Joueur';
import { supabase } from '@/lib/supabaseClient';

interface Player {
  id: number;
  nom: string;
  prenom: string;
  categorie: string;
  numero: string;
  poste: 'GB' | 'JOUEUR';
  x: number;
  y: number;
  est_sur_terrain: boolean;
}

// Petite flèche SVG pour les selecteurs (Design Pro)
const ChevronDown = () => (
  <svg className="w-4 h-4 text-club-gold pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
);

export default function Home() {
  const [joueurs, setJoueurs] = useState<Player[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categorieActuelle, setCategorieActuelle] = useState('Seniors A');
  const categoriesDispo = ['Seniors A', 'Seniors B', 'Seniors 31','U15-U14', 'U13-U12','U13-U12 2','U7','U9','U11'];
  
  // Formulaire
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauPrenom, setNouveauPrenom] = useState('');
  const [nouveauNumero, setNouveauNumero] = useState('');
  const [nouveauPoste, setNouveauPoste] = useState<'GB' | 'JOUEUR'>('JOUEUR');

  // REFS
  const terrainRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // --- LOGIQUE DE TRI ---
  const SEUIL_BANC = 1000;
  const joueursTitulaires = joueurs.filter(j => j.est_sur_terrain && j.y < SEUIL_BANC);
  const joueursRemplacants = joueurs.filter(j => j.est_sur_terrain && j.y >= SEUIL_BANC);
  const joueursReserve = joueurs.filter(j => !j.est_sur_terrain);

  // --- AUTH & LOAD ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkUser();
  }, []);

  useEffect(() => {
    const chargerJoueurs = async () => {
      setIsLoaded(false);
      const { data, error } = await supabase
        .from('joueurs')
        .select('*')
        .eq('categorie', categorieActuelle)
        .order('nom', { ascending: true });

      if (error) console.error(error);
      else if (data) setJoueurs(data as Player[]);
      setIsLoaded(true);
    };
    chargerJoueurs();
  }, [categorieActuelle]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    window.location.reload();
  };

  // --- ACTIONS ---
  const ajouterJoueur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauNom.trim()) return;
    const nouveauJoueur = { nom: nouveauNom, prenom: nouveauPrenom, numero: nouveauNumero, poste: nouveauPoste, categorie: categorieActuelle, x: 0, y: 0, est_sur_terrain: false };
    const { data } = await supabase.from('joueurs').insert([nouveauJoueur]).select();
    if (data) {
      setJoueurs([...joueurs, data[0] as Player]);
      setNouveauNom(''); setNouveauPrenom(''); setNouveauNumero('');
    }
  };

  const supprimerDefinitivement = async (id: number) => {
    if(!confirm("Supprimer définitivement ?")) return;
    setJoueurs(joueurs.filter((j) => j.id !== id));
    await supabase.from('joueurs').delete().eq('id', id);
  };

  const entrerSurTerrain = async (player: Player) => {
    const updated = { ...player, est_sur_terrain: true, x: 0, y: 0 };
    setJoueurs(joueurs.map(j => j.id === player.id ? updated : j));
    await supabase.from('joueurs').update({ est_sur_terrain: true, x: 0, y: 0 }).eq('id', player.id);
  };

  const entrerSurBanc = async (player: Player) => {
    const updated = { ...player, est_sur_terrain: true, x: 0, y: 1000 };
    setJoueurs(joueurs.map(j => j.id === player.id ? updated : j));
    await supabase.from('joueurs').update({ est_sur_terrain: true, x: 0, y: 1000 }).eq('id', player.id);
  };

  const sortirDeLaFeuille = async (id: number) => {
    const player = joueurs.find(j => j.id === id);
    if (!player) return;
    setJoueurs(joueurs.map(j => j.id === id ? { ...j, est_sur_terrain: false } : j));
    await supabase.from('joueurs').update({ est_sur_terrain: false }).eq('id', id);
  };

  const deplacerJoueur = async (id: number, deltaX: number, deltaY: number) => {
    const joueursMisAJour = joueurs.map(j => {
      if (j.id === id) return { ...j, x: j.x + deltaX, y: j.y + deltaY };
      return j;
    });
    setJoueurs(joueursMisAJour);
    const joueurBouge = joueursMisAJour.find(j => j.id === id);
    if (joueurBouge) await supabase.from('joueurs').update({ x: joueurBouge.x, y: joueurBouge.y }).eq('id', id);
  };

  const telechargerImage = async () => {
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#000000' });
      const link = document.createElement('a');
      link.download = `compo-${categorieActuelle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); }
  };

  return (
    <main className="flex min-h-screen flex-col bg-club-black text-white relative">
      
      {/* HEADER FIXE : Meilleure gestion du selecteur */}
      <header className="w-full p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-900 border-b border-club-gold/30 z-20">
        <h1 className="text-xl md:text-2xl font-black text-club-green uppercase tracking-wider text-center md:text-left">
          FA Roumois <span className="text-white text-sm font-normal normal-case ml-2 block sm:inline">Coach Assistant</span>
        </h1>
        
        <div className="flex gap-4 items-center justify-center w-full md:w-auto">
            
            {/* SELECTEUR D'ÉQUIPE : Wrapper Relative + Appearance None */}
            <div className="relative">
                <select 
                    value={categorieActuelle} 
                    onChange={(e) => setCategorieActuelle(e.target.value)} 
                    // 'appearance-none' enlève le style par défaut (et le bug d'affichage)
                    className="appearance-none bg-neutral-800 text-club-gold font-bold py-2 pl-3 pr-8 rounded border border-neutral-600 text-base focus:border-club-green outline-none shadow-sm cursor-pointer"
                >
                    {categoriesDispo.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {/* Notre flèche personnalisée positionnée par dessus */}
                <ChevronDown />
            </div>

            {isAdmin ? (
                <button onClick={handleLogout} className="text-red-500 text-xs font-bold border border-red-900 bg-red-900/20 px-3 py-2 rounded-full whitespace-nowrap">Déconnexion</button>
            ) : (
                <Link href="/login" className="text-club-green text-xs font-bold border border-club-green bg-club-green/10 px-3 py-2 rounded-full whitespace-nowrap">Accès Coach</Link>
            )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* --- SIDEBAR GAUCHE (CORRIGÉE : INPUTS EMPILÉS) --- */}
        <aside className="w-full lg:w-1/4 bg-neutral-900/50 border-r border-club-gold/20 p-4 flex flex-col gap-4 overflow-y-auto max-h-[40vh] lg:max-h-full">
            
            {/* FORMULAIRE AJOUT */}
            {isAdmin && (
                <div className="bg-neutral-800 p-3 rounded-lg border border-club-green/30 shadow-lg">
                    <h3 className="text-club-green text-xs font-bold uppercase mb-2">Nouveau Joueur</h3>
                    <form onSubmit={ajouterJoueur} className="flex flex-col gap-3">
                        
                        {/* Ligne 1 : Nom (100% width) */}
                        <div className="w-full">
                            <input 
                                type="text" 
                                placeholder="Nom" 
                                value={nouveauNom} 
                                onChange={(e) => setNouveauNom(e.target.value)} 
                                className="w-full px-3 py-2 rounded bg-white text-black text-base outline-none border-2 border-transparent focus:border-club-green" 
                            />
                        </div>
                        
                        {/* Ligne 2 : Prénom (100% width) */}
                        <div className="w-full">
                            <input 
                                type="text" 
                                placeholder="Prénom" 
                                value={nouveauPrenom} 
                                onChange={(e) => setNouveauPrenom(e.target.value)} 
                                className="w-full px-3 py-2 rounded bg-white text-black text-base outline-none border-2 border-transparent focus:border-club-green" 
                            />
                        </div>
                        
                        {/* Ligne 3 : Numéro + Poste + Bouton */}
                        <div className="flex gap-2 w-full">
                            <input 
                                type="number" 
                                placeholder="N°" 
                                value={nouveauNumero} 
                                onChange={(e) => setNouveauNumero(e.target.value)} 
                                className="w-16 px-2 py-2 rounded bg-white text-black text-base outline-none text-center" 
                            />
                            
                            {/* Selecteur Poste : Wrapper Relative pour icône */}
                            <div className="relative flex-1">
                                <select 
                                    value={nouveauPoste} 
                                    onChange={(e) => setNouveauPoste(e.target.value as never)} 
                                    className="appearance-none w-full px-2 py-2 pr-8 rounded bg-white text-black text-base cursor-pointer outline-none border-2 border-transparent focus:border-club-green"
                                >
                                    <option value="JOUEUR">Joueur</option>
                                    <option value="GB">Gardien</option>
                                </select>
                                {/* Flèche noire pour le fond blanc */}
                                <svg className="w-4 h-4 text-black pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>

                            <button 
                                type="submit" 
                                className="bg-club-green text-black w-12 rounded font-bold text-lg hover:bg-white transition flex items-center justify-center"
                            >
                                +
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex-1">
                <h3 className="text-club-gold text-xs font-bold uppercase mb-3 flex justify-between">
                    Réserve <span className="bg-club-gold/20 text-club-gold px-2 py-0.5 rounded-full text-[10px]">{joueursReserve.length}</span>
                </h3>
                <div className="flex flex-col gap-2 pb-10">
                    {joueursReserve.map(j => (
                        <div key={j.id} onClick={() => isAdmin && entrerSurTerrain(j)} className={`group flex items-center justify-between bg-neutral-800 p-2 rounded border border-neutral-700 transition relative ${isAdmin ? 'cursor-pointer hover:bg-neutral-700 hover:border-club-green/50' : 'opacity-70'}`}>
                            <div className="flex items-center gap-2 pointer-events-none">
                                <span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${j.poste === 'GB' ? 'bg-yellow-400 text-black' : 'bg-neutral-600 text-white'}`}>{j.numero}</span>
                                <span className="text-sm font-bold text-gray-200">{j.nom.charAt(0)}.{j.prenom}</span>
                            </div>
                            {isAdmin && (
                                <div className="flex gap-1 z-10">
                                    <button onClick={(e) => { e.stopPropagation(); entrerSurBanc(j); }} className="text-gray-500 hover:text-club-gold hover:bg-yellow-900/20 p-2 rounded-full transition" title="Mettre sur le banc">🪑</button>
                                    <button onClick={(e) => { e.stopPropagation(); supprimerDefinitivement(j.id); }} className="text-gray-500 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-full transition" title="Supprimer">🗑️</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </aside>

        {/* --- ZONE PRINCIPALE --- */}
        <section className="flex-1 flex flex-col items-center justify-start p-4 bg-club-black/80 relative overflow-y-auto">
            
             <div className="absolute top-4 right-4 z-10">
                <button onClick={telechargerImage} className="text-club-gold text-xs hover:text-yellow-200 underline flex items-center gap-1 font-bold bg-neutral-900/80 px-3 py-1 rounded-full border border-club-gold/30">📸 Télécharger la compo !</button>
             </div>

            {/* ZONE DE CAPTURE */}
            <div 
                ref={exportRef} 
                className="flex flex-col items-center p-4 bg-club-black rounded-xl"
            >
                {/* TERRAIN */}
                <div className="mt-4 mb-4 scale-90 sm:scale-100 origin-top">
                    {!isLoaded && <div className="text-club-green font-bold animate-pulse mb-4">Chargement...</div>}
                    
                    <Terrain ref={terrainRef}>
                        {joueursTitulaires.map((joueur) => (
                            <Joueur 
                                key={joueur.id} 
                                id={joueur.id} 
                                nom={`${joueur.nom} ${joueur.prenom ? joueur.prenom.charAt(0)+'.' : ''}`}
                                numero={joueur.numero}
                                poste={joueur.poste}
                                x={joueur.x}
                                y={joueur.y}
                                estSurLeBanc={false} 
                                limitesRef={terrainRef as React.RefObject<HTMLDivElement>}
                                onDelete={isAdmin ? sortirDeLaFeuille : () => {}} 
                                onMove={isAdmin ? deplacerJoueur : () => {}}
                            />
                        ))}
                    </Terrain>
                </div>

                {/* BANC DES REMPLAÇANTS */}
                <div className="w-full max-w-112.5 bg-neutral-900 p-4 rounded-xl border border-white/20">
                    <h3 className="text-white/50 text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-club-gold"></span> 
                        Remplaçants
                    </h3>

                    <div className="flex flex-wrap gap-2 justify-center">
                        {joueursRemplacants.length === 0 && <p className="text-gray-600 text-xs italic">Banc vide</p>}

                        {joueursRemplacants.map(j => (
                            <div key={j.id} className="flex items-center gap-2 bg-neutral-800 px-3 py-2 rounded-lg border border-white/20 shadow-sm">
                                <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${j.poste === 'GB' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'}`}>
                                    {j.numero}
                                </span>
                                <span className="text-xs font-bold text-white">{j.nom.charAt(0)}.{j.prenom }</span>
                                
                                {isAdmin && (
                                    <div className="flex ml-2 border-l border-white/10 pl-2 gap-2">
                                        <button onClick={() => entrerSurTerrain(j)} className="text-club-green hover:scale-125 transition" title="Faire entrer">⬆️</button>
                                        <button onClick={() => sortirDeLaFeuille(j.id)} className="text-gray-500 hover:text-red-400 hover:scale-125 transition" title="Retirer">✕</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <p className="mt-4 text-gray-500 text-xs text-center max-w-md">
                {isAdmin ? "Sidebar = Réserve. Clic carte = Titulaire. Clic 🪑 = Remplaçant (en bas)." : ""}
            </p>
        </section>

      </div>
    </main>
  );
}