import { PackageIDs, packages, ToolIDs, tools } from '@/lib/packages'
import { useState } from 'react'
import { ProjectConfigurator, FilterType, GithubRepo, SelectBox } from './components/redesign-ui'
import { Toaster } from 'sonner'
import { Hero } from './components/redesign-ui/hero'
import { ListItem } from './components/redesign-ui/list-item'
import { useIsMobile } from './hooks/use-mobile'

const searchParams = new URLSearchParams(location.search)

export function App() {
  const [state, setState] = useState(() => searchParams.get('state'))
  const [selectedPackages, setSelectedPackages] = useState<PackageIDs[]>([])
  const [selectedTools, setSelectedTools] = useState<ToolIDs[]>(['triplex'])
  const allPackagesSelected = packages.every((pkg) => selectedPackages.includes(pkg.id))
  const allToolsSelected = tools.every((tool) => selectedTools.includes(tool.id))

  const isMobile = useIsMobile()

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

        <div className="xl:col-start-3 xl:col-end-13 divide-y divide-redesign-gray">
          {isMobile && (
            <div className="xl:hidden border-b border-redesign-gray">
              <button
                className="w-full p-4 flex gap-4 justify-between"
                onClick={() => {
                  setSelectedPackages(allPackagesSelected ? [] : packages.map((pkg) => pkg.id))
                }}
                aria-pressed={allPackagesSelected}
                aria-label="All packages"
              >
                <p role="heading" aria-level={3}>
                  / ALL PACKAGES
                </p>
                <SelectBox selected={allPackagesSelected} />
              </button>
            </div>
          )}
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

          {isMobile && (
            <div className="xl:hidden border-b border-redesign-gray">
              <button
                className="w-full p-4 flex gap-4 justify-between"
                onClick={() => {
                  setSelectedTools(allToolsSelected ? [] : tools.map((tool) => tool.id))
                }}
                aria-pressed={allToolsSelected}
                aria-label="All tools"
              >
                <p role="heading" aria-level={3}>
                  / ALL TOOLS
                </p>
                <SelectBox selected={allToolsSelected} />
              </button>
            </div>
          )}
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
