import { formaterDato } from '@/lib/dato'

type GitHubIssue = {
  number: number
  title: string
  state: string
  created_at: string
  html_url: string
  labels: { name: string }[]
}

async function hentIssues(): Promise<GitHubIssue[]> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return []

  const res = await fetch(
    'https://api.github.com/repos/reidarei/Herreklubben/issues?labels=%C3%B8nske&state=all&sort=created&direction=desc&per_page=20',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      next: { revalidate: 60 },
    }
  )

  if (!res.ok) return []
  return res.json()
}

export default async function IssuesListe() {
  const issues = await hentIssues()

  if (issues.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>
        Ønsker fra gutta ({issues.filter(i => i.state === 'open').length} åpne)
      </h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {issues.map((issue, i) => {
          const erLukket = issue.state === 'closed'
          return (
            <a
              key={issue.number}
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm"
              style={{
                background: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg)',
                borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
                textDecoration: 'none',
                color: 'inherit',
                opacity: erLukket ? 0.5 : 1,
              }}
            >
              <div className="flex-1 min-w-0 mr-3">
                <p
                  className="font-medium truncate"
                  style={{
                    color: 'var(--text-primary)',
                    textDecoration: erLukket ? 'line-through' : undefined,
                  }}
                >
                  {issue.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  #{issue.number} · {formaterDato(issue.created_at, 'd. MMM yyyy')}
                </p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-md shrink-0"
                style={{
                  background: erLukket ? 'var(--success-subtle)' : 'var(--accent-subtle)',
                  color: erLukket ? 'var(--success)' : 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                {erLukket ? 'Lukket' : 'Åpen'}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
