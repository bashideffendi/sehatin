"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { Card, Kicker } from "@/components/ui";
import { getCoachInsight, type Insight } from "@/lib/coach-insight";

interface Props {
  targetKcal: number | null;
}

/** Coach insight strip — ink card with sun-bg icon. */
export function CoachInsight({ targetKcal }: Props) {
  const [insight, setInsight] = useState<Insight | null>(null);

  useEffect(() => {
    setInsight(getCoachInsight(targetKcal));
  }, [targetKcal]);

  if (!insight) return null;

  const iconBg = {
    forest: "bg-forest-50 text-forest",
    clay: "bg-clay-50 text-clay",
    sun: "bg-sun-50 text-sun-700",
    sky: "bg-sky-50 text-sky",
  }[insight.tone];

  return (
    <Card surface="ink" radius="lg" shadow="paper-2" className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[12px] ${iconBg}`}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <Kicker tone="paper">Coach</Kicker>
          <div className="mt-1 text-paper font-bold tracking-tight">
            {insight.title}
          </div>
          <p className="mt-1 text-[13px] text-paper/80 leading-relaxed">
            {insight.body}
          </p>
          {insight.cta && (
            <Link
              href={insight.cta.href}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-sun hover:text-sun/90"
            >
              {insight.cta.label}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
