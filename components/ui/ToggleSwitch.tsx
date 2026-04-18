'use client'

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-colors duration-200"
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        background: checked ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="block rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: 22,
          height: 22,
          position: 'absolute',
          top: 3,
          left: 3,
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  )
}
