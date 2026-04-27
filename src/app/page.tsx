import {MorphingSquare} from '~~/index/square'

const GITHUB_URL = 'https://github.com/bozzhik'
const WEBSITE_URL = 'https://bozzhik.com'

const linkClassName = 'font-medium text-zinc-50 hover:text-zinc-400 duration-300'

export default function IndexPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-950 dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl xl:max-w-2xl sm:max-w-none flex-col items-start justify-between py-24 px-16 xl:py-20 sm:px-5 sm:py-14 bg-zinc-950 dark:bg-black">
        <div className="flex flex-col items-start gap-10 text-left">
          <MorphingSquare />

          <div className="space-y-6">
            <h1 className="max-w-md text-3xl font-semibold leading-10 tracking-tight text-zinc-50">Hub and sandbox for experiments and projects.</h1>

            <p className="max-w-md text-lg leading-8 text-zinc-400">
              This hub is a shared entry point for experiments and small production apps. For now,{' '}
              <a href={GITHUB_URL} className={linkClassName}>
                github.com/bozzhik
              </a>{' '}
              and{' '}
              <a href={WEBSITE_URL} className={linkClassName}>
                bozzhik.com
              </a>{' '}
              act as the core references, while this intentionally minimal page is gradually expanded with more project details.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
