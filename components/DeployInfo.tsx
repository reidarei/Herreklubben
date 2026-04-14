const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'lokal'
const bygget = new Date().toLocaleString('nb-NO', { timeZone: 'Europe/Oslo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function DeployInfo() {
  return (
    <p className="text-center text-[10px] pb-2 select-none" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>
      {sha} · {bygget}
    </p>
  )
}
