import IssuesListeKlient from './IssuesListeKlient'

type GitHubIssue = {
  number: number
  title: string
  state: string
  created_at: string
  html_url: string
  labels: { name: string }[]
}

async function hentAapneIssues(): Promise<GitHubIssue[]> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return []

  const res = await fetch(
    'https://api.github.com/repos/reidarei/Herreklubben/issues?labels=%C3%B8nske&state=open&sort=created&direction=desc&per_page=50',
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
  const aapne = await hentAapneIssues()

  return <IssuesListeKlient aapne={aapne} />
}
