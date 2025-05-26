import { Package } from '@/lib/packages'
import { cn } from '@/lib/utils'
import { SelectBox } from './select-box'
import { Link } from './link'

interface PackageCardProps {
  package: Package
  isSelected: boolean
  onToggle: () => void
}

export const ListItem = ({ package: pkg, isSelected, onToggle }: PackageCardProps) => {
  return (
    <button
      className={cn('flex items-start border-b border-redesign-gray flex-col md:flex-row w-full text-start')}
      onClick={onToggle}
    >
      <div className="col-span-3 flex-3/10  p-4 xl:px-2 flex flex-row items-center gap-4">
        <SelectBox selected={isSelected} />
        <p className="font-bold">{pkg.name}</p>
      </div>
      <div className="col-span-5 flex flex-col p-4 xl:px-2 flex-5/10">
        <p className="text-redesign-white/50 text-sm">{pkg.description}</p>
      </div>
      <div className="col-span-2 flex flex-col p-4 xl:px-2 justify-center flex-2/10">
        <div className="flex gap-4 justify-end">
          <Link href={pkg.docsUrl} isExternal className="flex items-center gap-1">
            <p>docs</p>
          </Link>
          <Link href={pkg.githubUrl} isExternal className="flex items-center gap-1">
            <p>github</p>
          </Link>
        </div>
      </div>
    </button>
  )
}
