import type { HTMLAttributes } from "react"

import { cn } from "@/lib/cn"

/** shadcn/ui's Card, copied in and set to Upkeep's tokens. */
export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col rounded-[14px] border border-hairline bg-paper-raised text-ink shadow-[0_1px_0_rgb(255_255_255/0.03)_inset]", className)} {...p} />
)
export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn("flex flex-col gap-1 p-6 pb-2", className)} {...p} />
export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn("text-[15px] font-semibold leading-none", className)} {...p} />
export const CardDescription = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn("text-[13px] text-ink-muted", className)} {...p} />
export const CardContent = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn("px-6 pb-2", className)} {...p} />
export const CardFooter = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col items-start gap-1.5 border-t border-hairline px-6 py-4 text-[13px] leading-[1.5]", className)} {...p} />
)
