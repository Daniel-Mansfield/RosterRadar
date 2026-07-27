"use client";

import { useEffect, useState, type CSSProperties, type ReactElement } from "react";

import { espnNbaHeadshotUrl, isEspnAthleteId, playerInitials } from "@/nba/headshot";

import styles from "./PlayerAvatar.module.css";

type PlayerAvatarProps = {
  firstName: string;
  lastName: string;
  espnAthleteId?: number | null;
  /**
   * Fixed square edge in px. Ignored when `fill` is true.
   * Prefer `fill` inside playing-card / hero frames.
   */
  size?: number;
  /** Stretch to parent frame (playing-card photo well, dossier hero). */
  fill?: boolean;
  className?: string;
  /** Rounded rect (cards) vs softer dossier chip. */
  shape?: "card" | "rounded";
};

/**
 * Headshot when a curated ESPN id is present; initials on miss/error.
 * Client component so broken CDN images can fall back without a layout hole.
 */
export function PlayerAvatar({
  firstName,
  lastName,
  espnAthleteId = null,
  size = 56,
  fill = false,
  className,
  shape = "card",
}: PlayerAvatarProps): ReactElement {
  const [failed, setFailed] = useState(false);
  const initials = playerInitials(firstName, lastName);
  const showImage = isEspnAthleteId(espnAthleteId) && !failed;
  const label = `${firstName} ${lastName}`;

  useEffect(() => {
    setFailed(false);
  }, [espnAthleteId, firstName, lastName]);

  const frameStyle: CSSProperties | undefined = fill
    ? undefined
    : { width: size, height: size };

  const rootClass = [
    styles.avatar,
    fill ? styles.fill : "",
    shape === "rounded" ? styles.rounded : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClass} style={frameStyle} aria-hidden="true">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- need onError fallback; remote ESPN CDN
        <img
          className={styles.image}
          src={espnNbaHeadshotUrl(espnAthleteId)}
          alt=""
          width={fill ? undefined : size}
          height={fill ? undefined : size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.initials} title={label}>
          {initials}
        </span>
      )}
    </span>
  );
}
