"use client";
import { Camera, Search, ScanLine, Mic } from "lucide-react";
import { Card, Kicker } from "@/components/ui";

interface QuickActionsProps {
  onFoto: () => void;
  onCari: () => void;
  onScan?: () => void;
  onVoice?: () => void;
}

const SCAN_COMING_SOON = "Scan barcode — segera. Sumber: OpenFoodFacts Indonesia (197 produk kemasan terdaftar).";
const VOICE_COMING_SOON = "Voice quick-add — segera. Cth: \"2 piring nasi sama es teh\" → AI parse + auto-catat.";

export function LogQuickActions({
  onFoto,
  onCari,
  onScan,
  onVoice,
}: QuickActionsProps) {
  return (
    <Card radius="lg" shadow="paper-1" className="p-4 sm:p-5">
      <Kicker>Cepat catat</Kicker>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <QuickActionCard
          icon={<Camera className="w-5 h-5" />}
          tone="clay"
          label="Foto piring"
          sub="AI identifikasi makanan"
          onClick={onFoto}
        />
        <QuickActionCard
          icon={<Search className="w-5 h-5" />}
          tone="forest"
          label="Cari TKPI"
          sub="2.015 bahan + produk"
          onClick={onCari}
        />
        <QuickActionCard
          icon={<ScanLine className="w-5 h-5" />}
          tone="sky"
          label="Scan barcode"
          sub="OFF Indonesia"
          onClick={() => (onScan ? onScan() : alert(SCAN_COMING_SOON))}
          comingSoon={!onScan}
        />
        <QuickActionCard
          icon={<Mic className="w-5 h-5" />}
          tone="sun"
          label="Voice"
          sub={'"2 piring nasi"'}
          onClick={() => (onVoice ? onVoice() : alert(VOICE_COMING_SOON))}
          comingSoon={!onVoice}
        />
      </div>
    </Card>
  );
}

function QuickActionCard({
  icon,
  tone,
  label,
  sub,
  onClick,
  comingSoon,
}: {
  icon: React.ReactNode;
  tone: "forest" | "clay" | "sky" | "sun";
  label: string;
  sub: string;
  onClick: () => void;
  comingSoon?: boolean;
}) {
  const toneBg = {
    forest: "bg-forest-50 text-forest",
    clay: "bg-clay-50 text-clay",
    sky: "bg-sky-50 text-sky",
    sun: "bg-sun-50 text-sun-700",
  }[tone];
  return (
    <button
      onClick={onClick}
      className="relative text-left p-3 rounded-[14px] bg-surface border border-hairline hover:border-hairline-2 hover:shadow-[var(--shadow-paper-1)] transition-all"
    >
      <div
        className={`inline-flex items-center justify-center w-9 h-9 rounded-[10px] ${toneBg} mb-2`}
      >
        {icon}
      </div>
      <div className="text-[12.5px] font-bold tracking-tight">{label}</div>
      <div className="text-[10.5px] text-muted mt-0.5">{sub}</div>
      {comingSoon && (
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-muted">
          segera
        </span>
      )}
    </button>
  );
}
