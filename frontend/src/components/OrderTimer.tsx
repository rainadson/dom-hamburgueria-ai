import { useEffect, useState } from "react";

type Props = {
  createdAt: string;
};

function parseCreatedAt(createdAt: string) {
  const normalized = createdAt.trim().replace(" ", "T");

  // Timestamps do Supabase normalmente já incluem UTC (Z ou +00:00).
  // Só acrescentamos Z quando o campo vier sem informação de fuso.
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const timestamp = new Date(
    hasTimezone ? normalized : `${normalized}Z`
  ).getTime();

  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

export default function OrderTimer({
  createdAt,
}: Props) {

  const [time, setTime] = useState("00:00");

  useEffect(() => {

    function update() {

      const start = parseCreatedAt(createdAt);
      const now = Date.now();

      const diff = Math.max(
        0,
        Math.floor((now - start) / 1000)
      );

      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      setTime(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);

  }, [createdAt]);

  return <span>{time}</span>;
}
