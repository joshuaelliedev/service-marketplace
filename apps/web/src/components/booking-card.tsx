import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatPeso, formatServiceDate, formatSlotLabel } from "@/lib/format";

type BookingCardProps = {
  referenceNumber?: string;
  paymentMethod?: string;
  serviceTitle: string;
  serviceDateYmd: string;
  slotHalf: string;
  status: string;
  statusLabel: string;
  totalCents: number;
  totalLabel?: string;
  chatHref?: string;
  unreadMessages?: number;
  children?: React.ReactNode;
};

export function BookingCard({
  referenceNumber,
  paymentMethod,
  serviceTitle,
  serviceDateYmd,
  slotHalf,
  status,
  statusLabel,
  totalCents,
  totalLabel = "Total held",
  chatHref,
  unreadMessages = 0,
  children,
}: BookingCardProps) {
  return (
    <article className="booking-card">
      <div className="booking-card__top">
        <div>
          <h3 className="booking-card__title">{serviceTitle}</h3>
          {referenceNumber ? (
            <p className="text-muted" style={{ fontSize: 13, margin: "0.25rem 0" }}>
              {referenceNumber}
              {paymentMethod ? ` · ${paymentMethod}` : ""}
            </p>
          ) : null}
          <p className="booking-card__date">{formatServiceDate(serviceDateYmd)}</p>
          <p className="booking-card__slot">{formatSlotLabel(slotHalf)}</p>
        </div>
        <StatusBadge label={statusLabel} status={status} />
      </div>
      <p className="booking-card__total">
        {totalLabel}: <strong>{formatPeso(totalCents)}</strong>
      </p>
      {chatHref ? (
        <div className="booking-card__chat-row">
          <Link href={chatHref} className="booking-card__chat-link">
            Messages
            {unreadMessages > 0 ? (
              <span className="count-badge" aria-label={`${unreadMessages} unread messages`}>
                {unreadMessages}
              </span>
            ) : null}
          </Link>
        </div>
      ) : null}
      {children ? <div className="booking-card__actions">{children}</div> : null}
    </article>
  );
}
