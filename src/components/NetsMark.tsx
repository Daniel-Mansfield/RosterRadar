import type { ReactElement } from "react";

type NetsMarkProps = {
  className?: string;
  size?: number;
};

/**
 * Brooklyn Nets primary mark (NBA SVG in /public).
 * White-on-black artwork — wrap sits on a black circular plate for dark UI.
 */
export function NetsMark({
  className,
  size = 48,
}: NetsMarkProps): ReactElement {
  return (
    <span className={className} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local SVG brand mark */}
      <img
        src="/nets-logo.svg"
        alt="Brooklyn Nets"
        width={size}
        height={size}
        decoding="async"
      />
    </span>
  );
}
