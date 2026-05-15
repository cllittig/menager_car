"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const OverviewChart = dynamic(
  () =>
    import("@/components/overview-chart").then((m) => ({
      default: m.OverviewChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[350px] w-full rounded-md" aria-hidden />
    ),
  },
);

export function Overview() {
  return <OverviewChart />;
}
