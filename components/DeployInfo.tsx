const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'lokal'
const bygget = process.env.BUILD_TIMESTAMP ?? 'ukjent'
const versjon = process.env.APP_VERSION ?? 'v?'

// Negativ marginTop spiser opp mesteparten av sidenes 120px bunnpadding,
// slik at deploy-info havner rett over BottomNav uten å bryte scrollstoppen.
export default function DeployInfo() {
  return (
    <p
      className="text-center text-[10px] select-none"
      style={{
        color: 'var(--text-tertiary)',
        opacity: 0.5,
        marginTop: -96,
        paddingBottom: 4,
      }}
    >
      {versjon} · {sha} · {bygget}
    </p>
  )
}
