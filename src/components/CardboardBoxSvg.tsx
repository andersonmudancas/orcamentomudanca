import React from 'react';

export const CardboardBoxSvg: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
      <div className="flex justify-center items-center py-2">
        <svg
          viewBox="0 0 340 240"
          className="w-full max-w-[280px] h-auto drop-shadow-sm select-none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Desenho da caixa de papelão com medidas de 50cm de comprimento, 30cm de largura e 32cm de altura"
        >
          {/* Top Face */}
          <polygon
            points="70,50 220,50 255,18 105,18"
            fill="#e2c596"
            stroke="#8a6736"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Front Face */}
          <rect
            x="70"
            y="50"
            width="150"
            height="115"
            fill="#f5deb3"
            stroke="#8a6736"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Side Right Face */}
          <polygon
            points="220,50 255,18 255,133 220,165"
            fill="#d6b27e"
            stroke="#8a6736"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Tape / Seam detail */}
          <polygon
            points="140,50 150,50 175,18 165,18"
            fill="#cb9f5b"
            opacity="0.75"
          />
          <rect
            x="140"
            y="50"
            width="10"
            height="115"
            fill="#cb9f5b"
            opacity="0.6"
          />

          {/* Handling icon */}
          <path
            d="M 125 105 L 125 130 M 130 115 L 120 115"
            stroke="#8a6736"
            strokeWidth="2"
            opacity="0.4"
          />
          <rect
            x="165"
            y="108"
            width="25"
            height="20"
            rx="2"
            fill="none"
            stroke="#8a6736"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {/* Dimension: Comprimento 50 cm (Base frontal) */}
          <line x1="70" y1="188" x2="220" y2="188" stroke="#0284c7" strokeWidth="2" />
          <line x1="70" y1="181" x2="70" y2="195" stroke="#0284c7" strokeWidth="2" />
          <line x1="220" y1="181" x2="220" y2="195" stroke="#0284c7" strokeWidth="2" />
          <text
            x="145"
            y="207"
            textAnchor="middle"
            fontSize="14"
            fill="#0284c7"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            50 cm (Comprimento)
          </text>

          {/* Dimension: Altura 32 cm (Lado esquerdo) */}
          <line x1="48" y1="50" x2="48" y2="165" stroke="#0284c7" strokeWidth="2" />
          <line x1="41" y1="50" x2="55" y2="50" stroke="#0284c7" strokeWidth="2" />
          <line x1="41" y1="165" x2="55" y2="165" stroke="#0284c7" strokeWidth="2" />
          <text
            x="32"
            y="112"
            textAnchor="middle"
            fontSize="13"
            fill="#0284c7"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            transform="rotate(-90 32 112)"
          >
            32 cm (Altura)
          </text>

          {/* Dimension: Largura 30 cm (Profundidade superior lateral) */}
          <line x1="228" y1="46" x2="262" y2="14" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="3,3" />
          <text
            x="285"
            y="75"
            textAnchor="middle"
            fontSize="13"
            fill="#0284c7"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            30 cm
          </text>
          <text
            x="285"
            y="92"
            textAnchor="middle"
            fontSize="11"
            fill="#0284c7"
            fontFamily="Arial, sans-serif"
          >
            (Largura)
          </text>
        </svg>
      </div>

      <div className="flex justify-center items-center gap-3 sm:gap-6 flex-wrap mt-2 text-xs sm:text-sm text-slate-700 bg-white py-2 px-3 rounded-lg border border-slate-200">
        <span className="flex items-center gap-1 font-medium">
          📏 Comprimento: <strong className="text-sky-700 font-bold">50 cm</strong>
        </span>
        <span className="flex items-center gap-1 font-medium">
          📏 Largura: <strong className="text-sky-700 font-bold">30 cm</strong>
        </span>
        <span className="flex items-center gap-1 font-medium">
          📏 Altura: <strong className="text-sky-700 font-bold">32 cm</strong>
        </span>
      </div>
    </div>
  );
};
