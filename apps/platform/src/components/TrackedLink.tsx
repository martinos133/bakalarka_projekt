'use client'

import { useRouter } from 'next/navigation'
import { trackClick } from '@/lib/trackClick'

interface TrackedLinkProps {
  href: string
  targetType: string
  targetId: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export default function TrackedLink({ href, targetType, targetId, children, className, ...props }: TrackedLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    trackClick(targetType, targetId)
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  )
}
