import React from 'react';

interface IllustrationProps {
  type: 'forest' | 'dragon' | 'space' | 'sea' | 'castle' | 'garden' | 'custom';
  accentColor?: string;
  className?: string;
}

export const StoryIllustration: React.FC<IllustrationProps> = ({
  type,
  accentColor = '#10B981',
  className = '',
}) => {
  switch (type) {
    case 'forest':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="skyForest" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#dcfce7" />
                <stop offset="50%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#a7f3d0" />
              </linearGradient>
              <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <linearGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
            </defs>

            {/* Background Sky */}
            <rect width="800" height="600" fill="url(#skyForest)" />

            {/* Sun */}
            <circle cx="150" cy="120" r="70" fill="url(#sunGrad)" opacity="0.9" />
            <circle cx="150" cy="120" r="85" fill="#fef08a" opacity="0.3" className="animate-pulse" />

            {/* Clouds */}
            <path d="M220 100 Q240 80 270 85 Q300 70 330 90 Q350 90 360 110 Q320 130 220 110 Z" fill="#ffffff" opacity="0.85" />
            <path d="M550 140 Q570 120 600 125 Q630 110 660 130 Q680 130 690 150 Q650 170 550 150 Z" fill="#ffffff" opacity="0.85" />

            {/* Distant Mountains / Trees */}
            <path d="M-50 420 Q150 280 350 380 Q550 300 850 440 L850 600 L-50 600 Z" fill="#15803d" opacity="0.6" />
            
            {/* Front Rolling Hills */}
            <path d="M-20 480 Q200 360 450 460 Q650 390 820 500 L820 600 L-20 600 Z" fill="url(#hillGrad1)" />
            <path d="M-50 520 Q250 440 500 530 Q700 480 850 550 L850 600 L-50 600 Z" fill="url(#hillGrad2)" />

            {/* Cute Pine Trees */}
            <g transform="translate(120, 280)">
              <rect x="35" y="120" width="18" height="45" fill="#78350f" rx="4" />
              <polygon points="44,20 0,80 88,80" fill="#047857" />
              <polygon points="44,50 10,110 78,110" fill="#059669" />
            </g>
            <g transform="translate(620, 240)">
              <rect x="35" y="140" width="20" height="50" fill="#78350f" rx="4" />
              <polygon points="45,30 5,95 85,95" fill="#047857" />
              <polygon points="45,65 12,130 78,130" fill="#059669" />
            </g>

            {/* Flowers & Mushrooms */}
            <g transform="translate(250, 490)">
              <circle cx="20" cy="20" r="12" fill="#ef4444" />
              <circle cx="20" cy="20" r="5" fill="#fef08a" />
              <circle cx="8" cy="20" r="6" fill="#f43f5e" />
              <circle cx="32" cy="20" r="6" fill="#f43f5e" />
              <circle cx="20" cy="8" r="6" fill="#f43f5e" />
              <circle cx="20" cy="32" r="6" fill="#f43f5e" />
            </g>
            <g transform="translate(520, 510)">
              <path d="M20 30 Q20 10 35 10 Q50 10 50 30 Z" fill="#ef4444" />
              <rect x="30" y="30" width="10" height="15" fill="#fef3c7" rx="2" />
              <circle cx="28" cy="18" r="3" fill="#ffffff" />
              <circle cx="42" cy="22" r="2.5" fill="#ffffff" />
            </g>
          </svg>
        </div>
      );

    case 'dragon':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="dragonSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#fef3c7" />
              </linearGradient>
              <linearGradient id="cloudWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#dragonSky)" />

            {/* Rainbow Arc */}
            <path d="M 50 500 A 350 350 0 0 1 750 500" stroke="#f43f5e" strokeWidth="12" fill="none" opacity="0.8" />
            <path d="M 60 500 A 340 340 0 0 1 740 500" stroke="#fb923c" strokeWidth="12" fill="none" opacity="0.8" />
            <path d="M 70 500 A 330 330 0 0 1 730 500" stroke="#facc15" strokeWidth="12" fill="none" opacity="0.8" />
            <path d="M 80 500 A 320 320 0 0 1 720 500" stroke="#4ade80" strokeWidth="12" fill="none" opacity="0.8" />
            <path d="M 90 500 A 310 310 0 0 1 710 500" stroke="#38bdf8" strokeWidth="12" fill="none" opacity="0.8" />

            {/* Fluffy Clouds */}
            <g transform="translate(100, 180)">
              <circle cx="40" cy="40" r="35" fill="url(#cloudWhite)" />
              <circle cx="80" cy="30" r="45" fill="url(#cloudWhite)" />
              <circle cx="130" cy="40" r="35" fill="url(#cloudWhite)" />
              <rect x="40" y="30" width="90" height="45" fill="url(#cloudWhite)" />
            </g>
            <g transform="translate(500, 120)">
              <circle cx="40" cy="40" r="30" fill="url(#cloudWhite)" />
              <circle cx="75" cy="25" r="40" fill="url(#cloudWhite)" />
              <circle cx="120" cy="40" r="30" fill="url(#cloudWhite)" />
              <rect x="40" y="30" width="80" height="40" fill="url(#cloudWhite)" />
            </g>

            {/* Flying Dragon Character Silhouette / Sprite */}
            <g transform="translate(320, 220)">
              {/* Dragon Body */}
              <ellipse cx="80" cy="70" rx="60" ry="40" fill="#3b82f6" />
              {/* Dragon Head */}
              <circle cx="140" cy="45" r="30" fill="#60a5fa" />
              <circle cx="150" cy="40" r="6" fill="#1e293b" />
              <circle cx="152" cy="38" r="2" fill="#ffffff" />
              {/* Cute Horn */}
              <polygon points="135,20 142,5 148,22" fill="#f59e0b" />
              {/* Dragon Wings */}
              <path d="M 60 40 Q 40 -20 90 10 Q 110 -10 120 40 Z" fill="#93c5fd" opacity="0.9" />
              {/* Dragon Tail */}
              <path d="M 25 75 Q -20 80 -10 110 Q 0 110 30 85 Z" fill="#2563eb" />
              <polygon points="-15,115 -25,100 -5,100" fill="#f59e0b" />
            </g>
          </svg>
        </div>
      );

    case 'space':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="spaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0b0f19" />
                <stop offset="50%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#spaceGrad)" />

            {/* Crescent Moon */}
            <path d="M 620 120 A 70 70 0 1 0 710 220 A 80 80 0 1 1 620 120 Z" fill="#fef08a" />

            {/* Twinkling Stars */}
            {[
              { x: 100, y: 80, r: 3 },
              { x: 250, y: 150, r: 4 },
              { x: 400, y: 70, r: 2.5 },
              { x: 520, y: 180, r: 3.5 },
              { x: 150, y: 300, r: 3 },
              { x: 300, y: 250, r: 5 },
              { x: 700, y: 350, r: 3 },
              { x: 80, y: 450, r: 4 },
              { x: 480, y: 420, r: 3 },
            ].map((st, i) => (
              <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#ffffff" opacity={0.8} className="animate-pulse" />
            ))}

            {/* Saturn / Planet */}
            <g transform="translate(180, 180)">
              <ellipse cx="50" cy="50" rx="75" ry="18" fill="none" stroke="#f472b6" strokeWidth="6" transform="rotate(-18 50 50)" opacity="0.8" />
              <circle cx="50" cy="50" r="35" fill="#a855f7" />
              <ellipse cx="50" cy="50" rx="75" ry="18" fill="none" stroke="#fb7185" strokeWidth="4" transform="rotate(-18 50 50)" clipPath="polygon(0 0, 100 0, 100 50, 0 50)" />
            </g>

            {/* Shooting Star */}
            <path d="M 300 80 L 180 180" stroke="url(#sunGrad)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="180" cy="180" r="5" fill="#ffffff" />
          </svg>
        </div>
      );

    case 'sea':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#seaGrad)" />

            {/* Sunlight Rays */}
            <polygon points="100,0 200,0 400,600 250,600" fill="#ffffff" opacity="0.1" />
            <polygon points="350,0 480,0 700,600 520,600" fill="#ffffff" opacity="0.12" />

            {/* Seabed Sand */}
            <path d="M-20 480 Q200 440 450 500 Q650 460 820 520 L820 600 L-20 600 Z" fill="#fde047" opacity="0.85" />

            {/* Corals */}
            <path d="M 120 520 Q 100 420 130 400 Q 150 420 140 520 Z" fill="#f43f5e" />
            <path d="M 140 520 Q 160 380 180 390 Q 190 440 175 520 Z" fill="#ec4899" />
            <path d="M 620 520 Q 600 410 630 390 Q 660 410 650 520 Z" fill="#10b981" />

            {/* Swimming Dolphin */}
            <g transform="translate(340, 220)">
              <path d="M 0 40 Q 60 -10 120 20 Q 160 40 180 30 Q 160 60 110 65 Q 40 70 0 40 Z" fill="#06b6d4" />
              {/* Belly */}
              <path d="M 30 45 Q 80 65 125 45 Q 100 68 30 45 Z" fill="#ecfeff" />
              {/* Fin */}
              <polygon points="70,25 90,-10 105,25" fill="#0891b2" />
              {/* Tail */}
              <polygon points="0,40 -25,20 -15,45 -30,65" fill="#06b6d4" />
              {/* Eye */}
              <circle cx="140" cy="30" r="4" fill="#0f172a" />
              <circle cx="141" cy="29" r="1.5" fill="#ffffff" />
            </g>

            {/* Bubbles */}
            <circle cx="200" cy="300" r="12" fill="#ffffff" opacity="0.4" />
            <circle cx="210" cy="240" r="8" fill="#ffffff" opacity="0.4" />
            <circle cx="550" cy="220" r="15" fill="#ffffff" opacity="0.3" />
            <circle cx="560" cy="160" r="10" fill="#ffffff" opacity="0.3" />
          </svg>
        </div>
      );

    case 'castle':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="castleSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fae8ff" />
                <stop offset="50%" stopColor="#e9d5ff" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#castleSky)" />

            {/* Castle Silhouette */}
            <g transform="translate(200, 180)">
              {/* Base walls */}
              <rect x="80" y="150" width="240" height="150" fill="#8b5cf6" />
              {/* Towers */}
              <rect x="50" y="100" width="60" height="200" fill="#7c3aed" />
              <rect x="290" y="100" width="60" height="200" fill="#7c3aed" />
              <rect x="160" y="60" width="80" height="240" fill="#6d28d9" />
              {/* Roof Cones */}
              <polygon points="50,100 80,30 110,100" fill="#ec4899" />
              <polygon points="290,100 320,30 350,100" fill="#ec4899" />
              <polygon points="160,60 200,-20 240,60" fill="#f43f5e" />
              {/* Flags */}
              <polygon points="200,-20 230,-30 200,-40" fill="#fde047" />
              {/* Door */}
              <path d="M 175 300 Q 175 220 200 220 Q 225 220 225 300 Z" fill="#f59e0b" />
            </g>

            {/* Green Lawn */}
            <path d="M-20 480 Q400 420 820 480 L820 600 L-20 600 Z" fill="#10b981" />
          </svg>
        </div>
      );

    case 'garden':
    default:
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="gardenSky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fed7aa" />
              </linearGradient>
            </defs>
            <rect width="800" height="600" fill="url(#gardenSky)" />

            {/* Lawn */}
            <path d="M-20 420 Q400 350 820 420 L820 600 L-20 600 Z" fill="#84cc16" />

            {/* Flowers */}
            {[100, 220, 380, 520, 680].map((x, i) => (
              <g key={i} transform={`translate(${x}, ${430 + (i % 2) * 20})`}>
                <line x1="20" y1="50" x2="20" y2="20" stroke="#4d7c0f" strokeWidth="4" />
                <circle cx="20" cy="15" r="12" fill={i % 2 === 0 ? '#ef4444' : '#ec4899'} />
                <circle cx="20" cy="15" r="5" fill="#fef08a" />
              </g>
            ))}
          </svg>
        </div>
      );
  }
};
