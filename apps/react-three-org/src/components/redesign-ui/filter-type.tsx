import { type Package, PackageIDs, packages, ToolIDs, tools } from '@/lib/packages'
import { SelectBox } from './select-box'
import { useIsMobile } from '@/hooks/use-mobile'

interface FilterTypeProps {
  selectedPackages: PackageIDs[]
  selectedTools: ToolIDs[]
  onSelectAllPackages: (selected: boolean) => void
  onSelectAllTools: (selected: boolean) => void
}

export const FilterType = ({
  selectedPackages,
  selectedTools,
  onSelectAllPackages,
  onSelectAllTools,
}: FilterTypeProps) => {
  const allPackagesSelected = packages.every((pkg) => selectedPackages.includes(pkg.id))
  const allToolsSelected = tools.every((tool) => selectedTools.includes(tool.id))

  return (
    <div className="hidden col-span-2 xl:block xl:sticky top-4 left-0 px-4 xl:px-6" aria-label="Filter options">
      <div className="col-start-1 col-end-3 h-full w-full pt-4 ml-6 md:pt-6 md:ml-0">
        <div className="w-full sticky top-4 flex flex-col gap-4">
          <h2 className="sr-only">Filter Options</h2>
          <p role="heading" aria-level={3}>
            / SELECT ALL
          </p>

          <div className="flex flex-col gap-4 pl-4" role="group" aria-labelledby="packages-group">
            <button
              className="flex items-center gap-4"
              onClick={() => onSelectAllPackages(!allPackagesSelected)}
              aria-pressed={allPackagesSelected}
              aria-label="Select all packages"
              id="packages-group"
            >
              <SelectBox selected={allPackagesSelected} />
              <p>Packages</p>
            </button>
          </div>

          <div className="flex flex-col gap-4 pl-4" role="group" aria-labelledby="tools-group">
            <button
              className="flex items-center gap-4"
              onClick={() => onSelectAllTools(!allToolsSelected)}
              aria-pressed={allToolsSelected}
              aria-label="Select all tools"
              id="tools-group"
            >
              <SelectBox selected={allToolsSelected} />
              <p>Tools</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
