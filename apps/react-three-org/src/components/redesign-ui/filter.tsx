import { packages, tools } from '@/lib/packages'
import { Package } from '@/lib/packages'
import { SelectBox } from './select-box'

//TODO

export const Filter = ({
  handleSelectAll,
  selectedPackages,
  visibleTypes,
}: {
  handleSelectAll: () => void
  selectedPackages: Package[]
  visibleTypes: { packages: boolean; tools: boolean }
}) => {
  const allVisible = [...(visibleTypes.packages ? packages : []), ...(visibleTypes.tools ? tools : [])]
  const allSelected = allVisible.length > 0 && selectedPackages.length === allVisible.length

  return (
    <div className="col-span-full">
      <div className="w-full items-center justify-between py-4 border-y border-redesign-gray px-4 xl:px-6 flex-wrap hidden md:flex">
        <p>SELECT WHAT POWERS YOUR PROJECT.</p>
        <div className="flex items-center gap-10">
          <p>A - Z</p>
          <div className="flex items-center gap-4">
            <SelectBox selected={allSelected} />
            <p>SELECT ALL</p>
          </div>
        </div>
      </div>
    </div>
  )
}
