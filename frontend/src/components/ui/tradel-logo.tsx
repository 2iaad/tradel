import Image from "next/image"

import { cn } from "@/lib/utils"
import tradelFullIcon from "../../../public/brand/tradel-lockup-4k.png"
import tradelIcon from "../../../public/brand/tradel-mark.png"

type TradelLogoProps = {
  compact?: boolean
  className?: string
  priority?: boolean
}

export function TradelLogo({
  compact = false,
  className,
  priority = false,
}: TradelLogoProps) {
  if (compact) {
    return (
      <Image
        src={tradelIcon}
        alt="Tradel"
        className={cn("scale-[0.93] object-contain", className)}
        priority={priority}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label="Tradel"
      className={cn("relative block shrink-0 overflow-hidden", className)}
    >
      <Image
        src={tradelFullIcon}
        alt=""
        className="absolute left-1/2 top-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2"
        priority={priority}
      />
    </span>
  )
}
