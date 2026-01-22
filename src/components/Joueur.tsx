'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface JoueurProps {
  id: number;
  nom: string;
  poste: 'GB' | 'JOUEUR';
  x: number;
  y: number;
  estSurLeBanc: boolean;
  onDelete: (id: number) => void;
  // Modification : onMove prend désormais X et Y absolus
  onMove: (id: number, x: number, y: number) => void;
  limitesRef: React.RefObject<HTMLDivElement>;
}

export default function Joueur({ id, nom, poste, x, y, estSurLeBanc, onDelete, onMove, limitesRef }: JoueurProps) {
  
  // On crée une référence pour notre propre div Joueur
  const elementRef = useRef<HTMLDivElement>(null);
  
  const isGB = poste === 'GB';
  const colorPrimary = isGB ? '#C5A22E' : '#00C75B'; 
  const colorSecondary = '#000000'; 
  const bgClass = isGB ? 'bg-[#C5A22E]' : 'bg-[#00C75B]';
  const textClass = 'text-black'; 
  const borderClass = 'border-black/20';

  return (
    <motion.div
      ref={elementRef} // On attache la ref pour calculer la position réelle
      drag
      dragMomentum={false} 
      dragConstraints={limitesRef} // Le mur visuel
      dragElastic={0} // Le mur rigide
      
      animate={{ x, y }} 
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      initial={false} 

      className="pointer-events-auto touch-none absolute top-1/2 left-1/2 w-14 h-14 -ml-7 -mt-7 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center"
      style={{ zIndex: 100 }}
      
      onDragEnd={() => {
        // C'EST ICI LE CORRECTIF FINAL :
        // Au lieu de prendre la position de la souris, on calcule où l'élément s'est physiquement arrêté.
        if (!elementRef.current || !limitesRef.current) return;

        // 1. Où est le joueur sur l'écran ?
        const playerRect = elementRef.current.getBoundingClientRect();
        // 2. Où est le terrain sur l'écran ?
        const containerRect = limitesRef.current.getBoundingClientRect();

        // 3. Calcul du centre du joueur par rapport au coin haut-gauche du terrain
        const playerCenterX = playerRect.left + playerRect.width / 2 - containerRect.left;
        const playerCenterY = playerRect.top + playerRect.height / 2 - containerRect.top;

        // 4. On remet ça par rapport au centre (0,0) du terrain
        // (car notre système de coordonnées est basé sur le centre)
        const finalX = playerCenterX - (containerRect.width / 2);
        const finalY = playerCenterY - (containerRect.height / 2);

        // 5. On envoie la position EXACTE "collée au mur"
        onMove(id, finalX, finalY);
      }}
      
      onPointerDown={(e) => e.stopPropagation()}
    >
      
      {!estSurLeBanc && (
        <div className="relative flex flex-col items-center group w-full h-full justify-center">
          <div className="relative drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)] transition-transform group-hover:scale-110 duration-200">
             <MaillotRayuresSVG primary={colorPrimary} secondary={colorSecondary} isGB={isGB} />
             <BoutonSupprimer onClick={() => onDelete(id)} />
          </div>
          <span className="absolute top-full mt-1 text-[10px] font-bold text-white bg-black/80 px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm whitespace-nowrap pointer-events-none border border-white/20 z-20">
            {nom}
          </span>
        </div>
      )}

      {estSurLeBanc && (
        <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-md border ${bgClass} ${borderClass} whitespace-nowrap`}>
           <span className={`text-xs font-black ${textClass} text-center uppercase tracking-wide`}>
             {nom}
           </span>
           <button 
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(id); }}
              className="ml-1 w-4 h-4 flex items-center justify-center bg-black/20 hover:bg-black/50 rounded-full text-[8px] text-white transition-colors"
            >
              ✕
           </button>
        </div>
      )}

    </motion.div>
  );
}

const MaillotRayuresSVG = ({ primary, secondary, isGB }: { primary: string, secondary: string, isGB: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-14 h-14" aria-hidden="true" style={{ overflow: 'visible' }}>
    <defs>
      <clipPath id="maillotShape">
        <path d="M20.8 6.6L18.3 4.1C17.9 3.7 17.4 3.5 16.9 3.5H14.5C14.5 3.5 13.8 4.5 12 4.5C10.2 4.5 9.5 3.5 9.5 3.5H7.1C6.6 3.5 6.1 3.7 5.7 4.1L3.2 6.6C2.8 7 2.7 7.6 3 8.1L4.5 11C4.7 11.5 5.2 11.8 5.7 11.7L7 11.4V20C7 20.6 7.4 21 8 21H16C16.6 21 17 20.6 17 20V11.4L18.3 11.7C18.8 11.8 19.3 11.5 19.5 11L21 8.1C21.3 7.6 21.2 7 20.8 6.6Z" />
      </clipPath>
    </defs>
    <path d="M20.8 6.6L18.3 4.1C17.9 3.7 17.4 3.5 16.9 3.5H14.5C14.5 3.5 13.8 4.5 12 4.5C10.2 4.5 9.5 3.5 9.5 3.5H7.1C6.6 3.5 6.1 3.7 5.7 4.1L3.2 6.6C2.8 7 2.7 7.6 3 8.1L4.5 11C4.7 11.5 5.2 11.8 5.7 11.7L7 11.4V20C7 20.6 7.4 21 8 21H16C16.6 21 17 20.6 17 20V11.4L18.3 11.7C18.8 11.8 19.3 11.5 19.5 11L21 8.1C21.3 7.6 21.2 7 20.8 6.6Z" fill={primary} stroke="white" strokeWidth="1" />
    {!isGB && (
      <g clipPath="url(#maillotShape)">
        <rect x="10.5" y="0" width="3" height="24" fill={secondary} />
        <rect x="5.5" y="0" width="2" height="24" fill={secondary} />
        <rect x="16.5" y="0" width="2" height="24" fill={secondary} />
      </g>
    )}
    <path fillOpacity="0.2" fill="black" d="M12 4.5C13.8 4.5 14.5 3.5 14.5 3.5V5C14.5 6.5 13.4 7.5 12 7.5C10.6 7.5 9.5 6.5 9.5 5V3.5C9.5 3.5 10.2 4.5 12 4.5Z" />
  </svg>
);

const BoutonSupprimer = ({ onClick }: { onClick: () => void }) => (
  <button 
    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}
    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] border border-white cursor-pointer z-50 shadow-md transition-all hover:scale-125 hover:bg-red-700 opacity-0 group-hover:opacity-100"
  >
    ✕
  </button>
);