import { cn } from "@/lib/utils"

export const Link = ({
  children,
  href,
  isExternal = false,
  'aria-label': ariaLabel,
  className,
}: {
  children: React.ReactNode
  href: string
  isExternal?: boolean
  'aria-label'?: string
  className?: string
}) => {
  const externalProps = isExternal
    ? {
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': ariaLabel || undefined,
      }
    : {}

  return (
    <a className={cn("bg-redesign-dark px-4 py-2 h-fit flex items-center gap-2", className)} href={href} {...externalProps}>
      {children}
    </a>
  )
}
