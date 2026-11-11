"use client"

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Results } from "@/lib/results"

/**
 * The Hexclave case as three shadcn chart cards. The chart wrapper is the pattern of Rema's ui/chart.tsx
 * (shadcn's ChartContainer shape, Recharts underneath): colours are literal hex because Recharts writes them into
 * SVG attributes. Amber is the old SDK, Paper the new one, green only a build that passed.
 */

const OLD = "#f2a93b"
const NEW = "#f5f2ea"
const GREEN = "#22d47b"
const MUTED = "#5b6573"

type Datum = { name: string; value: number; label: string; color: string }

function HBars({ data, height }: { data: Datum[]; height: number }) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 0 }} barCategoryGap={10}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="name"
            width={128}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#a9b3bf", fontSize: 12 }}
          />
          <Bar dataKey="value" radius={4} isAnimationActive animationDuration={900} background={{ fill: "#1b232c", radius: 4 }}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
            <LabelList dataKey="label" position="right" offset={8} style={{ fill: "#f5f2ea", fontSize: 12, fontWeight: 500 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Big({ value, unit }: { value: string; unit: string }) {
  return (
    <div className="flex items-baseline gap-2 px-6 pb-3 pt-1">
      <span className="display text-[44px] leading-none text-ink">{value}</span>
      <span className="text-[13px] text-ink-muted">{unit}</span>
    </div>
  )
}

const link = "underline underline-offset-2 hover:text-ink"

export function ChartCards({ results }: { results: Results | null }) {
  const moved = results?.outcomes.find((o) => o.key === "moved")?.value ?? 0
  const short: Record<string, string> = { moved: "Built after", red: "Broke after", timeout: "Hit 6 min limit", skipped: "Failed before" }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Installs in one week</CardTitle>
          <CardDescription>npm downloads, Nov 3 to 9, 2026</CardDescription>
        </CardHeader>
        <Big value="41%" unit="still the old name" />
        <CardContent>
          <HBars
            height={96}
            data={[
              { name: "Old name", value: 17866, label: "17,866", color: OLD },
              { name: "New name", value: 26163, label: "26,163", color: NEW },
            ]}
          />
        </CardContent>
        <CardFooter>
          <span className="text-ink">Five months after the rename, 4 in 10 installs still pull the old package.</span>
          <span className="text-ink-muted">
            <a className={link} href="https://www.npmjs.com/package/@stackframe/stack">
              @stackframe/stack
            </a>{" "}
            vs{" "}
            <a className={link} href="https://www.npmjs.com/package/@hexclave/next">
              @hexclave/next
            </a>
          </span>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public repos on the old name</CardTitle>
          <CardDescription>GitHub code search, Nov 11, 2026</CardDescription>
        </CardHeader>
        <Big value="447" unit="repos" />
        <CardContent>
          <HBars
            height={168}
            data={[
              { name: "List it", value: 447, label: "447", color: OLD },
              { name: "Minus 3 copies", value: 444, label: "444", color: OLD },
              { name: "Since Aug 1", value: 50, label: "about 50", color: OLD },
              { name: "Since Oct 1", value: 30, label: "about 30", color: OLD },
            ]}
          />
        </CardContent>
        <CardFooter>
          <span className="text-ink">Since Aug 1 and Oct 1 count repos pushed after those dates: still shipping, never moved.</span>
          <span className="text-ink-muted">First 500 of 826 package.json hits, forks left out. Search stops at 1,000.</span>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tonight&apos;s runs</CardTitle>
          <CardDescription>Each repo built before and after, in a sandbox</CardDescription>
        </CardHeader>
        <Big value={results?.counted ? `${moved} of ${results.counted}` : "1 of 1"} unit="still build after the move" />
        <CardContent>
          {results ? (
            <HBars
              height={Math.max(60, results.outcomes.length * 42)}
              data={results.outcomes.map((o) => ({
                name: short[o.key] ?? o.key,
                value: o.value,
                label: String(o.value),
                color: o.key === "moved" ? GREEN : o.key === "red" ? "#e5484d" : MUTED,
              }))}
            />
          ) : null}
        </CardContent>
        <CardFooter>
          <span className="text-ink">
            Counted only if it built before Upkeep touched it{results ? ` (${results.total} tried)` : ""}. One is Hexclave&apos;s own starter template.
          </span>
          <a className={`${link} text-ink-muted`} href="https://github.com/dshak1/upkeep#results">
            Every row in the results table
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}
