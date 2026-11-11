"use client"

import { useEffect, useRef } from "react"

/**
 * Magic UI's Flickering Grid (magicui.design, MIT), copied in and cut down: a canvas of small squares, each
 * flickering to a random opacity, drawn only while on screen. Reduced motion draws one still frame.
 */
export function FlickeringGrid({
  squareSize = 3,
  gridGap = 7,
  flickerChance = 0.25,
  color = "rgb(245, 242, 234)",
  accent = "rgb(242, 169, 59)",
  accentShare = 0.04,
  maxOpacity = 0.32,
  className = "",
}: {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  accent?: string
  accentShare?: number
  maxOpacity?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const box = boxRef.current
    if (!canvas || !box) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let cols = 0
    let rows = 0
    let opac = new Float32Array(0)
    let hue = new Uint8Array(0)
    let dpr = 1
    let raf = 0
    let last = 0
    let visible = true

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = box.getBoundingClientRect()
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      cols = Math.ceil(width / (squareSize + gridGap))
      rows = Math.ceil(height / (squareSize + gridGap))
      opac = new Float32Array(cols * rows)
      hue = new Uint8Array(cols * rows)
      for (let i = 0; i < opac.length; i++) {
        opac[i] = Math.random() * maxOpacity
        hue[i] = Math.random() < accentShare ? 1 : 0
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const s = squareSize * dpr
      const step = (squareSize + gridGap) * dpr
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const k = i * rows + j
          ctx.globalAlpha = hue[k] ? Math.min(1, opac[k] * 2.4) : opac[k]
          ctx.fillStyle = hue[k] ? accent : color
          ctx.fillRect(i * step, j * step, s, s)
        }
      }
      ctx.globalAlpha = 1
    }

    const tick = (t: number) => {
      if (!visible) return
      const dt = (t - last) / 1000
      last = t
      const p = flickerChance * Math.min(dt, 0.1)
      for (let i = 0; i < opac.length; i++) if (Math.random() < p) opac[i] = Math.random() * maxOpacity
      draw()
      raf = requestAnimationFrame(tick)
    }

    setup()
    draw()
    const ro = new ResizeObserver(() => {
      setup()
      draw()
    })
    ro.observe(box)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible && !still) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    })
    io.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [squareSize, gridGap, flickerChance, color, accent, accentShare, maxOpacity])

  return (
    <div ref={boxRef} className={`h-full w-full ${className}`}>
      <canvas ref={canvasRef} className="pointer-events-none block" aria-hidden />
    </div>
  )
}
