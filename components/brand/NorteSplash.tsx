import Image from 'next/image'

/**
 * Shared brand splash used by the loading screen and the login hero.
 * Renders the Norte logo + "NORTE" wordmark centred over the gradient background.
 * Does NOT include the auth card or any interactive elements.
 */
export function NorteSplash() {
  return (
    <div className="flex flex-col items-center gap-2 py-5 text-center">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
        <Image
          src="/logo.png"
          alt="Norte"
          width={64}
          height={64}
          className="h-full w-full object-contain"
        />
      </div>
      <h1 className="text-display-sm font-extrabold tracking-[0.06em] text-white">
        NORTE
      </h1>
    </div>
  )
}
