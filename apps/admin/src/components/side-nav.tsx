"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export type SideNavItem = {
  href: string;
  label: string;
  badge?: number;
};

export type SideNavSection = {
  title?: string;
  items: SideNavItem[];
};

type SideNavProps = {
  open: boolean;
  onClose: () => void;
  sections: SideNavSection[];
  footer?: React.ReactNode;
};

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="sidenav__badge">{count > 99 ? "99+" : count}</span>;
}

export function SideNav({ open, onClose, sections, footer }: SideNavProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      <button
        type="button"
        className={open ? "sidenav-overlay sidenav-overlay--visible" : "sidenav-overlay"}
        aria-label="Close menu"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside className={open ? "sidenav sidenav--open" : "sidenav"} aria-hidden={!open}>
        <div className="sidenav__header">
          <span className="sidenav__title">Menu</span>
          <button type="button" className="sidenav__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <div className="sidenav__body">
          {sections.map((section) => (
            <div key={section.title ?? section.items[0]?.href} className="sidenav__section">
              {section.title ? <p className="sidenav__section-title">{section.title}</p> : null}
              <nav className="sidenav__nav">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={active ? "sidenav__link sidenav__link--active" : "sidenav__link"}
                      aria-current={active ? "page" : undefined}
                      onClick={onClose}
                    >
                      <span>{item.label}</span>
                      {item.badge !== undefined ? <NavBadge count={item.badge} /> : null}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        {footer ? <div className="sidenav__footer">{footer}</div> : null}
      </aside>
    </>
  );
}
