import { PackageIDs, packages, ToolIDs, tools } from '@/lib/packages'
import { useState } from 'react'
import { ProjectConfigurator, FilterType, GithubRepo } from './components/redesign-ui'
import { Toaster } from 'sonner'
import { Hero } from './components/redesign-ui/hero'
import { ListItem } from './components/redesign-ui/list-item'

const searchParams = new URLSearchParams(location.search)
const sessionAccessTokenKey = 'access_token'
const sessionAccessToken = sessionStorage.getItem(sessionAccessTokenKey)

export function App() {
  const [state, setState] = useState(() => searchParams.get('state'))
  const [selectedPackages, setSelectedPackages] = useState<PackageIDs[]>([])
  const [selectedTools, setSelectedTools] = useState<ToolIDs[]>(['triplex'])

  if (state != null) {
    return <GithubRepo state={state} />
  }

  return (
    <main className="min-h-screen text-redesign-white font-mono relative">
      <Hero />
      <div className="w-full xl:grid xl:grid-cols-12 xl:gap-4 relative">
        <FilterType
          selectedPackages={selectedPackages}
          selectedTools={selectedTools}
          onSelectAllPackages={(selected) => {
            setSelectedPackages(selected ? packages.map((pkg) => pkg.id) : [])
          }}
          onSelectAllTools={(selected) => {
            setSelectedTools(selected ? tools.map((tool) => tool.id) : [])
          }}
        />

        <div className="xl:col-start-3 xl:col-end-13">
          {packages.map((pkg) => (
            <ListItem
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
          {tools.map((pkg) => (
            <ListItem
              key={pkg.id}
              package={pkg}
              isSelected={selectedTools.includes(pkg.id)}
              onToggle={() => {
                setSelectedTools((prev) =>
                  prev.includes(pkg.id) ? prev.filter((id) => id !== pkg.id) : [...prev, pkg.id],
                )
              }}
            />
          ))}
        </div>
      </div>
      <ProjectConfigurator
        createGithubRepo={() => {
          const integrations: any = {}
          const selections = [...selectedPackages, ...selectedTools]
          for (const integration of selections) {
            integrations[integration] = true
          }

          setState(btoa(JSON.stringify(integrations)))
        }}
        selections={[...selectedPackages, ...selectedTools]}
      />
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
