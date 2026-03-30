import { Card } from "@/components/Card";
import { TopBar } from "@/components/TopBar";
import { LAYOUT, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

interface PagePlaceholderProps {
  title: string;
  phaseLabel: string;
}

/** Renders a themed placeholder page with a shared top bar and status card. */
export function PagePlaceholder({ title, phaseLabel }: PagePlaceholderProps) {
  return (
    <>
      <TopBar title={title} />
      <div style={{ margin: "0 auto", maxWidth: LAYOUT.maxContentWidth, padding: SPACING.xl }}>
        <Card>
          <div
            className="text-text-primary"
            style={{ fontSize: fontSizes.section, fontWeight: fontWeights.semibold }}
          >
            {title}
          </div>
          <p
            className="text-text-secondary"
            style={{ marginTop: SPACING.sm, fontSize: fontSizes.body }}
          >
            Coming in {phaseLabel}.
          </p>
        </Card>
      </div>
    </>
  );
}
