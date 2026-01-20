'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface JoueurProps {
  id: number;
  nom: string;
  numero: string;
  poste: 'GB' | 'JOUEUR';
  x: number;
  y: number;
  estSurLeBanc: boolean; // NOUVELLE PROP
  onDelete: (id: number) => void;
  onMove: (id: number, deltaX: number, deltaY: number) => void;
  limitesRef: React.RefObject<HTMLDivElement>;
}

export default function Joueur({ id, nom, numero, poste, x, y, estSurLeBanc, onDelete, onMove, limitesRef }: JoueurProps) {
  
  // Couleurs selon le poste
  const couleurFond = poste === 'GB' ? 'bg-yellow-400' : 'bg-red-600';
  const couleurTexte = poste === 'GB' ? 'text-black' : 'text-white';
  const borderClass = poste === 'GB' ? 'border-black/20' : 'border-white/20';

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={limitesRef}
      dragElastic={0.1}
      
      // On anime le changement de forme (layout) pour que ce soit fluide
      layout 
      
      // Positionnement
      className="touch-none absolute top-1/2 left-1/2 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center"
      style={{ x: x, y: y, zIndex: 100 }} // zIndex élevé pour passer au dessus des lignes
      
      onDragEnd={(event, info) => {
        setTimeout(() => {
             onMove(id, info.offset.x, info.offset.y);
        }, 50);
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      
      {/* --- CAS 1 : AFFICHAGE "MAILLOT" (SUR LE TERRAIN) --- */}
      {!estSurLeBanc && (
        <>
          <div className={`relative w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-lg ${couleurFond} ${couleurTexte}`}>
            {numero}
            {/* Bouton croix */}
            <BoutonSupprimer onClick={() => onDelete(id)} />
          </div>
          <span className="mt-1 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm whitespace-nowrap pointer-events-none">
            {nom}
          </span>
        </>
      )}

      {/* --- CAS 2 : AFFICHAGE "ÉTIQUETTE" (SUR LE BANC) --- */}
      {estSurLeBanc && (
        <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-md border ${couleurFond} ${borderClass}`}>
           {/* Petit numéro à gauche */}
           <span className={`text-xs font-black ${couleurTexte} opacity-80 border-r ${poste === 'GB' ? 'border-black/20' : 'border-white/30'} pr-2`}>
             {numero}
           </span>
           
           {/* Nom au centre */}
           <span className={`text-xs font-bold ${couleurTexte} whitespace-nowrap min-w-15 text-center`}>
             {nom}
           </span>

           {/* Bouton croix (plus discret) */}
           <button 
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(id);
              }}
              className="ml-1 w-4 h-4 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full text-[8px] text-white"
            >
              ✕
           </button>
        </div>
      )}

    </motion.div>
  );
}

// Petit composant pour la croix du mode Maillot
const BoutonSupprimer = ({ onClick }: { onClick: () => void }) => (
  <button 
    onPointerDown={(e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    }}
    className="absolute -top-2 -right-2 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600 border border-white cursor-pointer z-50 shadow-sm transition-transform hover:scale-110"
  >
    ✕
  </button>
);