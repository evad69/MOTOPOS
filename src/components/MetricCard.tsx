import type { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/Card";
import { SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Renders a dashboard metric card with a muted label and emphasized value. */
export function MetricCard({ label, value, className, style }: MetricCardProps) {
  return (
    <Card className={className} style={style}>
      <div className="text-text-secondary" style={{ fontSize: fontSizes.caption }}>
        {label}
      </div>
      <div
        className="text-text-primary"
        style={{
          marginTop: SPACING.sm,
          fontSize: fontSizes.display,
          fontWeight: fontWeights.bold,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </Card>
  );
}
