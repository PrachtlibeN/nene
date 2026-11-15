import React from "react";

interface StageBackgroundProps {
  scenarioSlug?: string;
}

export const StageBackgrounds: React.FC<StageBackgroundProps> = ({
  scenarioSlug = "behavioral-interview",
}) => {
  if (scenarioSlug.includes("customer")) {
    return <SceneCustomerServiceLounge />;
  }

  if (scenarioSlug.includes("project") || scenarioSlug.includes("pitch")) {
    return <SceneExecutiveBoardroom />;
  }

  // Default: Tokyo Modern Office with Cherry Blossoms
  return <SceneTokyoModernOffice />;
};

/**
 * Scenario 1: Modern Tokyo Office with Glass Windows & Cherry Blossoms
 */
const SceneTokyoModernOffice: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Sky & Tokyo Cityscape Skyline */}
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DFEAF5" />
            <stop offset="60%" stopColor="#F4EAE6" />
            <stop offset="100%" stopColor="#FDFBF7" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#2B4C7E" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="tokyoTower" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E04F3E" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ECE5DB" />
            <stop offset="100%" stopColor="#DFD6C8" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="1000" height="420" fill="url(#skyGrad)" />

        {/* Distant Mt. Fuji & Tokyo Skyline Silhouette */}
        <path
          d="M 680 280 L 730 200 L 755 200 L 805 280 Z"
          fill="#D6DEE8"
          opacity="0.6"
        />
        <path
          d="M 730 200 L 742 225 L 755 200 Z"
          fill="#FFFFFF"
          opacity="0.8"
        />

        {/* Skyline Buildings */}
        <g fill="#CBD5E1" opacity="0.65">
          <rect x="120" y="220" width="60" height="180" />
          <rect x="200" y="190" width="75" height="210" />
          <rect x="290" y="240" width="55" height="160" />
          <rect x="420" y="180" width="80" height="220" />
          <rect x="520" y="210" width="65" height="190" />
          <rect x="610" y="250" width="50" height="150" />
          <rect x="820" y="200" width="70" height="200" />
          <rect x="910" y="230" width="60" height="170" />
        </g>

        {/* Tokyo Tower Silhouette in Distance */}
        <g opacity="0.75">
          <path
            d="M 370 380 L 377 150 L 383 150 L 390 380 Z"
            fill="url(#tokyoTower)"
          />
          <line
            x1="380"
            y1="150"
            x2="380"
            y2="120"
            stroke="#E04F3E"
            strokeWidth="2"
          />
          <path
            d="M 365 310 L 395 310"
            stroke="#E04F3E"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 370 240 L 390 240"
            stroke="#E04F3E"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Panoramic Window Mullions (Tokyo High-Rise Architecture) */}
        <g stroke="#94A3B8" strokeWidth="4" opacity="0.55">
          <line x1="250" y1="0" x2="250" y2="420" />
          <line x1="500" y1="0" x2="500" y2="420" />
          <line x1="750" y1="0" x2="750" y2="420" />
          <line x1="0" y1="420" x2="1000" y2="420" strokeWidth="6" stroke="#64748B" />
        </g>

        {/* Glass Reflection Highlight */}
        <rect width="1000" height="420" fill="url(#glassGrad)" />

        {/* Subtle Sakura Blossom Branch Silhouetted Outside */}
        <g opacity="0.85">
          <path
            d="M 980 40 Q 920 70 850 65 Q 810 62 760 90"
            stroke="#5C4033"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 870 66 Q 840 100 810 115"
            stroke="#5C4033"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Sakura Petals on Branch */}
          <circle cx="760" cy="90" r="7" fill="#F8B4C0" opacity="0.9" />
          <circle cx="770" cy="85" r="6" fill="#FAD1D8" opacity="0.9" />
          <circle cx="810" cy="115" r="7" fill="#F8B4C0" opacity="0.9" />
          <circle cx="850" cy="65" r="8" fill="#FAD1D8" opacity="0.9" />
          <circle cx="880" cy="60" r="7" fill="#F8B4C0" opacity="0.9" />
          <circle cx="920" cy="70" r="8" fill="#F8B4C0" opacity="0.9" />
        </g>

        {/* Modern Hinoki Wood Floor with Reflection */}
        <rect x="0" y="420" width="1000" height="180" fill="url(#floorGrad)" />
        {/* Floor Panel Lines */}
        <g stroke="#D0C6B8" strokeWidth="1" opacity="0.6">
          <line x1="0" y1="470" x2="1000" y2="470" />
          <line x1="0" y1="530" x2="1000" y2="530" />
        </g>
      </svg>

      {/* Floating Sakura Petals Animation Layers */}
      <div className="absolute top-4 right-1/4 animate-sakura-1 pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#F8B4C0" opacity="0.75">
          <path d="M12 2C9 5 6 9 6 13c0 4 3 7 6 9 3-2 6-5 6-9 0-4-3-8-6-11z" />
        </svg>
      </div>
      <div className="absolute top-12 right-1/3 animate-sakura-2 pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FAD1D8" opacity="0.8">
          <path d="M12 2C9 5 6 9 6 13c0 4 3 7 6 9 3-2 6-5 6-9 0-4-3-8-6-11z" />
        </svg>
      </div>
      <div className="absolute top-2 right-1/2 animate-sakura-3 pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#F8B4C0" opacity="0.7">
          <path d="M12 2C9 5 6 9 6 13c0 4 3 7 6 9 3-2 6-5 6-9 0-4-3-8-6-11z" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Scenario 2: Warm Japanese Customer Service Lounge / Shoji Aesthetic
 */
const SceneCustomerServiceLounge: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shojiBackdrop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F9F5EC" />
            <stop offset="100%" stopColor="#EFE8D8" />
          </linearGradient>
          <linearGradient id="warmLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="woodFloor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DFD1BE" />
            <stop offset="100%" stopColor="#C9B89F" />
          </linearGradient>
        </defs>

        {/* Shoji Wall Backdrop */}
        <rect width="1000" height="430" fill="url(#shojiBackdrop)" />

        {/* Shoji Wood Grid Frame */}
        <g stroke="#9C7A58" strokeWidth="2.5" opacity="0.7">
          {/* Vertical Shoji Stiles */}
          <line x1="80" y1="0" x2="80" y2="430" strokeWidth="4" />
          <line x1="200" y1="0" x2="200" y2="430" />
          <line x1="320" y1="0" x2="320" y2="430" strokeWidth="4" />
          <line x1="440" y1="0" x2="440" y2="430" />
          <line x1="560" y1="0" x2="560" y2="430" strokeWidth="4" />
          <line x1="680" y1="0" x2="680" y2="430" />
          <line x1="800" y1="0" x2="800" y2="430" strokeWidth="4" />
          <line x1="920" y1="0" x2="920" y2="430" />

          {/* Horizontal Shoji Rails */}
          <line x1="0" y1="70" x2="1000" y2="70" />
          <line x1="0" y1="140" x2="1000" y2="140" />
          <line x1="0" y1="210" x2="1000" y2="210" />
          <line x1="0" y1="280" x2="1000" y2="280" />
          <line x1="0" y1="350" x2="1000" y2="350" />
          <line x1="0" y1="430" x2="1000" y2="430" strokeWidth="6" stroke="#684E34" />
        </g>

        {/* Hanging Japanese Washi Lantern (Left) */}
        <g opacity="0.9">
          <line x1="160" y1="0" x2="160" y2="80" stroke="#4A3B32" strokeWidth="2" />
          <rect x="135" y="80" width="50" height="70" rx="8" fill="#FFFBEB" stroke="#B45309" strokeWidth="2" />
          {/* Lantern Ribs */}
          <line x1="135" y1="102" x2="185" y2="102" stroke="#D97706" strokeWidth="1" />
          <line x1="135" y1="125" x2="185" y2="125" stroke="#D97706" strokeWidth="1" />
          <circle cx="160" cy="115" r="28" fill="url(#warmLight)" />
        </g>

        {/* Minimalist Bonsai Plant on Wooden Pedestal (Right) */}
        <g opacity="0.85">
          <rect x="830" y="360" width="100" height="70" fill="#78593F" rx="3" />
          {/* Ceramic Pot */}
          <ellipse cx="880" cy="360" rx="38" ry="12" fill="#3D4A3E" />
          {/* Bonsai Trunk */}
          <path
            d="M 880 355 Q 860 310 885 270 Q 895 250 880 230"
            stroke="#4A3828"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 875 285 Q 840 275 830 260"
            stroke="#4A3828"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          {/* Bonsai Pine Needle Clusters */}
          <circle cx="880" cy="225" r="24" fill="#3B6349" />
          <circle cx="895" cy="220" r="18" fill="#4B7C5B" />
          <circle cx="830" cy="255" r="20" fill="#3B6349" />
          <circle cx="870" cy="265" r="16" fill="#4B7C5B" />
        </g>

        {/* Tatami / Wood Floor */}
        <rect x="0" y="430" width="1000" height="170" fill="url(#woodFloor)" />
        <line x1="0" y1="490" x2="1000" y2="490" stroke="#B3A28B" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

/**
 * Scenario 3: Executive Boardroom (Modern Wood & Minimalist Glass)
 */
const SceneExecutiveBoardroom: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="boardroomWall" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#28323E" />
            <stop offset="50%" stopColor="#1E2630" />
            <stop offset="100%" stopColor="#2D3748" />
          </linearGradient>
          <linearGradient id="boardroomWindow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C4D6E9" />
            <stop offset="100%" stopColor="#EDF2F7" />
          </linearGradient>
          <linearGradient id="tableReflect" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A202C" />
            <stop offset="100%" stopColor="#2D3748" />
          </linearGradient>
        </defs>

        {/* Back Wall */}
        <rect width="1000" height="420" fill="url(#boardroomWall)" />

        {/* Central High-Tech Window Opening to Metropolis */}
        <rect x="180" y="40" width="640" height="340" fill="url(#boardroomWindow)" rx="4" />

        {/* Distant Skyscrapers Vista */}
        <g fill="#A0AEC0" opacity="0.6">
          <rect x="230" y="160" width="70" height="220" />
          <rect x="320" y="110" width="85" height="270" />
          <rect x="430" y="140" width="60" height="240" />
          <rect x="510" y="90" width="90" height="290" />
          <rect x="620" y="170" width="75" height="210" />
          <rect x="715" y="130" width="80" height="250" />
        </g>

        {/* Window Framing */}
        <rect
          x="180"
          y="40"
          width="640"
          height="340"
          fill="none"
          stroke="#4A5568"
          strokeWidth="6"
          rx="4"
        />
        <line x1="500" y1="40" x2="500" y2="380" stroke="#4A5568" strokeWidth="4" />

        {/* Sleek Polished Boardroom Table */}
        <polygon points="50,420 950,420 1000,600 0,600" fill="url(#tableReflect)" />
        {/* Table Accent Line */}
        <line x1="50" y1="422" x2="950" y2="422" stroke="#63B3ED" strokeWidth="2" opacity="0.4" />
      </svg>
    </div>
  );
};
