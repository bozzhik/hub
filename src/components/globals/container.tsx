import {cn} from '@/lib/utils'

export default function Container({children}: {children: React.ReactNode}) {
  return <main className={cn('px-6 py-10 sm:px-2.5 sm:py-3', 'max-w-5xl w-full mx-auto', 'flex flex-col flex-1 gap-6')}>{children}</main>
}
