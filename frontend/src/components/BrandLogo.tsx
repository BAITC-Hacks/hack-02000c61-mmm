import { useState } from 'react'

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className = 'h-10 w-10' }: BrandLogoProps) {
  const [logoUnavailable, setLogoUnavailable] = useState(false)

  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-xl border border-emerald-300/20 bg-[#07110f] text-sm font-black text-emerald-200 shadow-glow`}
    >
      {logoUnavailable ? (
        <span>Ö</span>
      ) : (
        <img
          src="/orle-logo.png"
          alt=""
          className="h-full w-full object-contain"
          onError={() => setLogoUnavailable(true)}
        />
      )}
    </span>
  )
}
