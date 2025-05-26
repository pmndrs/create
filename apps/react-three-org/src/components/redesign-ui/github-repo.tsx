import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loading } from '@/loading'

const searchParams = new URLSearchParams(location.search)
const sessionAccessTokenKey = 'access_token'
const sessionAccessToken = sessionStorage.getItem(sessionAccessTokenKey)

export function GithubRepo({ state }: { state: string }) {
    const code = useMemo(() => searchParams.get('code'), [])
    const {
      isPending: isPendingAccessToken,
      error: errorAccessToken,
      data: accessTokenData,
    } = useQuery({
      retry: false,
      enabled: sessionAccessToken == null,
      queryKey: ['oauth', code],
      queryFn: async () => {
        if (code == null) {
          //promise never
          return new Promise<{ token: string }>(() => {})
        }
        const response = await fetch(new URL(`/oauth?code=${code}`, import.meta.env.VITE_SERVER_URL))
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json() as any as { token: string }
      },
    })
    useEffect(() => {
      if (accessTokenData == null) {
        return
      }
      sessionStorage.setItem(sessionAccessTokenKey, accessTokenData.token)
    }, [accessTokenData?.token])
    const accessToken = sessionAccessToken ?? accessTokenData?.token
    const {
      data: repoData,
      isPending: isPendingRepo,
      error: repoError,
    } = useQuery({
      retry: false,
      enabled: accessToken != null,
      queryKey: ['repo', accessToken],
      queryFn: async () => {
        const response = await fetch(new URL('/repo', import.meta.env.VITE_SERVER_URL), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: accessToken!, ...JSON.parse(atob(decodeURIComponent(state))) }),
        })
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json() as any as { url: string }
      },
    })
    useEffect(() => {
      if (repoData?.url == null) {
        return
      }
      setTimeout(() => (location.href = repoData.url), 1000)
    }, [repoData?.url])
    if (code == null) {
      location.href = `https://github.com/login/oauth/authorize?client_id=${
        import.meta.env.VITE_CLIENT_ID
      }&redirect_uri=${import.meta.env.VITE_REDIRECT_URL}&state=${state}&scope=user%20repo%20workflow`
      return null
    }
    if (sessionAccessToken == null && isPendingAccessToken) {
      return <Loading text="Loggin In" />
    }
    if (errorAccessToken != null) {
      return errorAccessToken.message
    }
    if (isPendingRepo) {
      return <Loading text="Creating Repository" />
    }
    if (repoError) {
      return repoError.message
    }
    return <Loading text="Forwarding to Repository" />
  }
  