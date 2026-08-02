interface Props {
    status: string;
}

export default function StatusBadge({ status }: Props) {

    const map = {
        PENDING: {
            label: "Pending",
            className: "pending",
        },

        PREPARING: {
            label: "Preparing",
            className: "preparing",
        },

        READY: {
            label: "Ready",
            className: "ready",
        },

        DELIVERED: {
            label: "Delivered",
            className: "delivered",
        },

        CANCELLED: {
            label: "Cancelled",
            className: "cancelled",
        },
    };

    const current =
        map[status as keyof typeof map] || {
            label: status,
            className: "pending",
        };

    return (
        <span className={`status-badge ${current.className}`}>
            {current.label}
        </span>
    );
}