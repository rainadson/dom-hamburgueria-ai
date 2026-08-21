import { useEffect, useState } from "react";

type Props = {
  createdAt: string;
};

function parseCreatedAt(createdAt: string) {
  const normalized = createdAt.includes("T")
    ? createdAt
    : createdAt.replace(" ", "T");

  // O Supabase está retornando a data sem timezone.
  // Tratamos o valor como UTC.
  return new Date(`${normalized}Z`).getTime();
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