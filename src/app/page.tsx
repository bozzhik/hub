export default function IndexPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-start justify-between py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-start gap-6 text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">Hub and sandbox for multiple web apps.</h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Next.js front end with Elysia.js services behind one entry point. Track builds on{' '}
            <a href="https://github.com/bozzhik" className="font-medium text-zinc-950 dark:text-zinc-50">
              github.com/bozzhik
            </a>{' '}
            and live endpoints on{' '}
            <a href="https://bozzhik.com" className="font-medium text-zinc-950 dark:text-zinc-50">
              bozzhik.com
            </a>{' '}
            .
          </p>
        </div>
      </main>
    </div>
  )
}
