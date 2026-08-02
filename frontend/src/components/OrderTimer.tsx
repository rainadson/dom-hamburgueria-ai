import { useEffect, useState } from "react";

type Props = {
  createdAt: string;
};

export default function OrderTimer({ createdAt }: Props) {

  const [time, setTime] = useState("");

  useEffect(() => {

    function update() {

      const start = new Date(createdAt).getTime();
      const now = new Date().getTime();

      const diff = Math.floor((now - start) / 1000);

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