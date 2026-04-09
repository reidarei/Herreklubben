'use client'

import { useRouter } from 'next/navigation'

export default function LastMerKnapp({ frem }: { frem: number }) {
  const router = useRouter()

  return (
    <div className="text-center mt-8">
      <button
        onClick={() => router.push(`/?frem=${frem + 12}`, { scroll: false })}
        className="text-sm font-semibold px-5 py-2.5 rounded-xl"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        Last mer
      </button>
    </div>
  )
}
