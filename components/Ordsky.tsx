export default function Ordsky({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const rod = '#8b1f1f'
  const amber = '#b87820'
  const graa = '#4a4a4a'
  const lysGraa = '#363636'
  const font = "var(--font-barlow), 'Arial Black', Arial, sans-serif"

  return (
    <svg
      viewBox="0 0 520 300"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* === STORE ORD === */}
      {/* SVEISEBLIND — bunnen venstre, størst */}
      <text x="4" y="284" fontSize="60" fontWeight="900" fill={rod} fontFamily={font} letterSpacing="-1">SVEISEBLIND</text>

      {/* DRITINGS — bunn høyre, størst */}
      <text x="240" y="298" fontSize="56" fontWeight="900" fill={rod} fontFamily={font} letterSpacing="-1">DRITINGS</text>

      {/* KANAKKAS — topp venstre, stor */}
      <text x="40" y="88" fontSize="44" fontWeight="900" fill={rod} fontFamily={font}>KANAKKAS</text>

      {/* DRITA — høyre midten, stor */}
      <text x="406" y="148" fontSize="44" fontWeight="900" fill={rod} fontFamily={font}>DRITA</text>

      {/* === MELLOMSTORE ORD === */}
      {/* BRISEN — øvre høyre, amber */}
      <text x="322" y="82" fontSize="32" fontWeight="800" fill={amber} fontFamily={font} letterSpacing="1">BRISEN</text>

      {/* PÅ EN SNURR — bunn midten */}
      <text x="168" y="256" fontSize="34" fontWeight="900" fill={rod} fontFamily={font}>PÅ EN SNURR</text>

      {/* MØKINGS — midten venstre */}
      <text x="90" y="148" fontSize="30" fontWeight="800" fill={graa} fontFamily={font}>MØKINGS</text>

      {/* SVINGSTANG — midten */}
      <text x="186" y="136" fontSize="26" fontWeight="800" fill={graa} fontFamily={font}>SVINGSTANG</text>

      {/* AMØBE — midten høyre */}
      <text x="318" y="136" fontSize="26" fontWeight="800" fill={graa} fontFamily={font}>AMØBE</text>

      {/* DILL — høyre */}
      <text x="400" y="174" fontSize="26" fontWeight="800" fill={graa} fontFamily={font}>DILL</text>

      {/* FULL — høyre */}
      <text x="394" y="106" fontSize="28" fontWeight="900" fill={rod} fontFamily={font}>FULL</text>

      {/* GLADFULL — bunn midten */}
      <text x="148" y="232" fontSize="24" fontWeight="800" fill={graa} fontFamily={font}>GLADFULL</text>

      {/* BEDUGG ET — bunn venstre midten */}
      <text x="32" y="240" fontSize="20" fontWeight="700" fill={graa} fontFamily={font}>BEDUGG ET</text>

      {/* === SMÅ ORD (klyngen i midten) === */}
      <text x="196" y="156" fontSize="14" fontWeight="700" fill={lysGraa} fontFamily={font}>PANSERDRITA</text>
      <text x="182" y="172" fontSize="12" fontWeight="600" fill={lysGraa} fontFamily={font}>MILD</text>
      <text x="220" y="172" fontSize="11" fontWeight="600" fill={lysGraa} fontFamily={font}>SHITFACED</text>
      <text x="196" y="184" fontSize="11" fontWeight="600" fill={lysGraa} fontFamily={font}>SNITINGS</text>
      <text x="234" y="184" fontSize="11" fontWeight="600" fill={lysGraa} fontFamily={font}>SØRPE FULL</text>
      <text x="228" y="196" fontSize="11" fontWeight="600" fill={lysGraa} fontFamily={font}>GOKANAKKAS!</text>
      <text x="196" y="196" fontSize="10" fontWeight="600" fill={lysGraa} fontFamily={font}>MOPED</text>
      <text x="166" y="184" fontSize="10" fontWeight="600" fill={lysGraa} fontFamily={font}>SYLLEFULL</text>
      <text x="166" y="196" fontSize="10" fontWeight="600" fill={lysGraa} fontFamily={font}>WAWWIN</text>
      <text x="290" y="172" fontSize="11" fontWeight="600" fill={lysGraa} fontFamily={font}>NEDSNØD</text>
      <text x="290" y="184" fontSize="10" fontWeight="600" fill={lysGraa} fontFamily={font}>SOWLETDRITA</text>
    </svg>
  )
}
