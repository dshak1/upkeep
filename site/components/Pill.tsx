import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/cn"

type Kind = "utility" | "setup" | "social"
type Tone = "ink" | "paper" | "veil" | "accent"

const EASE = "cubic-bezier(.25, 1, .5, 1)"
const OVERSHOOT = "cubic-bezier(.3, 1.8, .55, 1)"

const ROLE: Record<Kind, string> = {
  utility: "h-[38px] gap-1.5 rounded-full px-[18px] text-[15px] leading-[22px] font-medium",
  setup: "h-10 gap-1.5 rounded-full pl-3 pr-3.5 text-[16px] leading-[1.2] font-[450]",
  social: "h-[60px] gap-4 rounded-full pl-3 pr-8 text-[17px] font-medium hover:scale-[1.045] active:scale-[.98]",
}

const TONE: Record<Tone, string> = {
  ink: "bg-ink text-paper hover:bg-ink/85",
  paper:
    "bg-paper text-ink shadow-[0_0_0_1px_rgb(15_23_42/0.06),0_2px_4px_rgb(15_23_42/0.06),0_12px_14px_-8px_rgb(15_23_42/0.16)] hover:shadow-[0_0_0_1px_rgb(15_23_42/0.08),0_4px_8px_rgb(15_23_42/0.08),0_14px_14px_-6px_rgb(15_23_42/0.2)]",
  veil: "bg-paper/80 text-ink hover:bg-paper",
  accent: "bg-accent text-white hover:bg-[#5580ff]",
}

/** Photon's hairline and glow, on the setup kind only. */
const SETUP_EDGE =
  "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3),inset_0_-8px_12px_0_rgb(255_255_255/0.22)]"

const MOTION: Record<Kind, CSSProperties> = {
  utility: { transition: `background-color .3s ${EASE}, box-shadow .3s ${EASE}` },
  setup: { transition: `background-color .2s ${EASE}, box-shadow .3s ${EASE}` },
  social: { transition: `transform .55s ${OVERSHOOT}, box-shadow .35s ${EASE}` },
}

type Common = {
  kind?: Kind
  tone?: Tone
  /** An 18 px glyph left of the label. */
  icon?: ReactNode
  /** A glyph right of the label (the setup pill's copy mark). */
  trailing?: ReactNode
  className?: string
  children: ReactNode
}

type LinkProps = Common & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & { href: string }
type ButtonProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined }

export function Pill(props: LinkProps | ButtonProps) {
  const { kind = "utility", tone = "ink", icon, trailing, className, children, style, ...rest } = props
  const classes = cn(
    "group inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none",
    ROLE[kind],
    TONE[tone],
    kind === "setup" && (tone === "ink" || tone === "accent") ? SETUP_EDGE : "",
    className,
  )
  const body = (
    <>
      {icon ? <span className="flex size-[18px] flex-none items-center justify-center">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
      {trailing ? <span className="flex size-[18px] flex-none items-center justify-center">{trailing}</span> : null}
    </>
  )
  const merged = { ...MOTION[kind], ...style }
  if (typeof rest.href === "string") {
    const a = rest as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a {...a} data-pill={kind} className={classes} style={merged}>
        {body}
      </a>
    )
  }
  const b = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type="button" {...b} data-pill={kind} className={classes} style={merged}>
      {body}
    </button>
  )
}
