import Link from "next/link";
import { excerpt, formatPeso } from "@/lib/format";

type ListingCardProps = {
  id: string;
  title: string;
  description?: string;
  basePriceCents: number;
  categoryName?: string;
  isPublished?: boolean;
  href?: string;
};

export function ListingCard({
  id,
  title,
  description,
  basePriceCents,
  categoryName,
  isPublished,
  href,
}: ListingCardProps) {
  const link = href ?? `/listings/${id}`;
  return (
    <article className="listing-card">
      <div className="listing-card__header">
        {categoryName ? <span className="listing-card__category">{categoryName}</span> : null}
        {isPublished === false ? <span className="badge badge--draft">Draft</span> : null}
        {isPublished === true ? <span className="badge badge--published">Published</span> : null}
      </div>
      <h3 className="listing-card__title">
        <Link href={link}>{title}</Link>
      </h3>
      {description ? <p className="listing-card__desc">{excerpt(description, 140)}</p> : null}
      <div className="listing-card__footer">
        <span className="listing-card__price">{formatPeso(basePriceCents)}</span>
        <span className="listing-card__note">+ service fee at checkout</span>
      </div>
      <Link href={link} className="listing-card__cta">
        View details
      </Link>
    </article>
  );
}
