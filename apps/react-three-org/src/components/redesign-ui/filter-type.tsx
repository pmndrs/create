import { type Package, PackageIDs, packages, ToolIDs, tools } from '@/lib/packages'
import { SelectBox } from './select-box'

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
    <div className="hidden col-span-2 xl:block xl:sticky top-4 left-0 px-4 xl:px-6">
      <div className="col-start-1 col-end-3 h-full w-full pt-4 ml-6 md:pt-6 md:ml-0">
        <div className="w-full sticky top-4 flex flex-col gap-4">
          <p>/ SELECT ALL</p>

          <div className="flex flex-col gap-4 pl-4">
            <button className="flex items-center gap-4" onClick={() => onSelectAllPackages(!allPackagesSelected)}>
              <SelectBox selected={allPackagesSelected} />
              <p>Packages</p>
            </button>
          </div>

          <div className="flex flex-col gap-4 pl-4">
            <button className="flex items-center gap-4" onClick={() => onSelectAllTools(!allToolsSelected)}>
              <SelectBox selected={allToolsSelected} />
              <p>Tools</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
