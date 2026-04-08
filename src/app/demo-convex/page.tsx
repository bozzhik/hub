import {api} from '@/lib/convex'

import {fetchQuery} from 'convex/nextjs'

export const dynamic = 'force-dynamic'

export default async function IndexPage() {
  const demo = await fetchQuery(api.tables.demo.getRandom, {})

  console.log(demo)

  return <main>{`hello: ${demo?.username ?? 'mom'}`}</main>
}

// 'use client'

// import {useQuery, api} from '@/lib/convex'

// export default function IndexPage() {
//   const demo = useQuery(api.tables.demo.get)

//   return <main>{`hello: ${demo?.[0]?.username ?? 'mom'}`}</main>
// }
