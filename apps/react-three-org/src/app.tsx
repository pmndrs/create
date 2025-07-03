import { useEffect, useMemo, useState } from 'react'
import { Loading } from './loading.js'
import { useQuery } from '@tanstack/react-query'
import { PackageCard } from '@/components/package-card'
import { ProjectConfigurator } from '@/components/project-configurator'
import { NavBar } from '@/components/nav-bar'
import { packages, addons, PackageIDs, ToolIDs } from '@/lib/packages'
import { BackgroundAnimation } from '@/components/background-animation'
import { CogIcon, PackageIcon } from 'lucide-react'
import { Toaster } from 'sonner'
import { SelectionSection } from './components/selection-section.js'

const searchParams = new URLSearchParams(location.search)
const sessionAccessTokenKey = 'access_token'
const sessionAccessToken = sessionStorage.getItem(sessionAccessTokenKey)

export function App() {
  const [state, setState] = useState(() => searchParams.get('state'))
  const [selectedPackages, setSelectedPackages] = useState<PackageIDs[]>([])
  const [selectedAddons, setSelectedAddons] = useState<ToolIDs[]>([])

  if (state != null) {
    return <GithubRepo state={state} />
  }

  return (
    <main className="relative min-h-screen flex flex-col pb-36">
      <BackgroundAnimation />
      <div className="container mx-auto px-4 py-8 z-10 flex-1">
        <div className="flex flex-col items-center justify-center mb-6 mt-8">
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-4 tracking-tighter">React Three</h1>
          <p className="text-lg md:text-xl text-white/70 text-center max-w-2xl mb-6">
            Building 3D experiences with the React Three Ecosystem
          </p>
          <NavBar />
        </div>

        {/* Visual separator using space instead of a border */}
        <div className="mb-10 mt-8"></div>

        <SelectionSection
          value={selectedPackages}
          icon={PackageIcon}
          label="packages"
          onChange={setSelectedPackages}
          options={packages}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              isSelected={selectedPackages.includes(pkg.id)}
              onToggle={() => {
                setSelectedPackages((prev) =>
                  prev.includes(pkg.id) ? prev.filter((id) => id !== pkg.id) : [...prev, pkg.id],
                )
              }}
            />
          ))}
        </div>

        {/* Visual separator using space instead of a border */}
        <div className="mb-10 mt-8"></div>

        <SelectionSection
          label="addons"
          value={selectedAddons}
          icon={CogIcon}
          onChange={setSelectedAddons}
          options={addons}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {addons.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              isSelected={selectedAddons.includes(pkg.id)}
              onToggle={() => {
                setSelectedAddons((prev) =>
                  prev.includes(pkg.id) ? prev.filter((id) => id !== pkg.id) : [...prev, pkg.id],
                )
              }}
            />
          ))}
        </div>

        <ProjectConfigurator
          createGithubRepo={() => {
            const integrations: any = {}
            const selections = [...selectedPackages, ...selectedAddons]
            for (const integration of selections) {
              integrations[integration] = true
            }

            setState(btoa(JSON.stringify(integrations)))
          }}
          selections={[...selectedPackages, ...selectedAddons]}
        />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
          },
          className: 'font-sans',
          duration: 3000,
        }}
        theme="dark"
        richColors
      />
    </main>
  )
}

function GithubRepo({ state }: { state: string }) {
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
