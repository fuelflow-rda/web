"use client";

import { Dropdown } from "antd";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { RelaiLockup } from "@/components/brand";
import { NavItem } from "@/components/ui/NavItem";
import { focusRing } from "@/components/ui/focus";
import { initialsOf } from "@/components/ui/Avatar";
import { cx } from "@/lib/cx";
import type { AuthUser } from "@/store/auth-store";
import { activeItem, ROLE_LABEL, type NavGroup, type ShellArea } from "./nav";

export interface SidebarStation {
  id: string;
  name: string;
}

export interface SidebarProps {
  area: ShellArea;
  groups: NavGroup[];
  pathname: string;
  user: AuthUser;
  companyName?: string | null;
  stations: SidebarStation[];
  currentStationId?: string | null;
  onStationChange: (id: string) => void;
  counts: { review?: number; unread?: number };
  onSignOut: () => void;
  /** Called after a link is followed, so the phone drawer can close. */
  onNavigate?: () => void;
}

/**
 * The Night sidebar from the Pencil "Sidebar / Company" and "Sidebar /
 * Platform admin" components: lockup, station switcher (company area only),
 * grouped navigation, and the signed-in person at the foot.
 */
export function Sidebar({
  area,
  groups,
  pathname,
  user,
  companyName,
  stations,
  currentStationId,
  onStationChange,
  counts,
  onSignOut,
  onNavigate,
}: SidebarProps) {
  const active = activeItem(groups, pathname);
  const current = stations.find((s) => s.id === currentStationId) ?? null;
  const role = ROLE_LABEL[user.role];
  const subtitle =
    area === "company" && companyName && user.role !== "SUPERADMIN"
      ? `${role} · ${companyName}`
      : role;

  return (
    <nav
      aria-label="Main"
      className="flex h-full w-(--size-sidebar-width) flex-col gap-6 bg-sidebar-bg px-4 pt-6 pb-5"
    >
      <div className="flex items-center gap-2.5 px-2">
        <span className="text-sidebar-text">
          <RelaiLockup />
        </span>
        {area === "platform" ? (
          <span className="rounded-badge bg-sidebar-line px-1.5 py-px type-overline text-10 text-sidebar-text">
            Admin
          </span>
        ) : null}
      </div>

      {area === "company" ? (
        <StationSwitcher
          stations={stations}
          current={current}
          onChange={onStationChange}
        />
      ) : null}

      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-1">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1.5 type-overline text-10 text-sidebar-text-muted">
              {group.label}
            </div>
            {group.items.map((item) => (
              <div
                key={`${item.href}-${item.label}`}
                onClickCapture={onNavigate}
              >
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={active === item}
                  count={item.count ? counts[item.count] : undefined}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-sidebar-line px-2 pt-3.5">
        <span
          aria-hidden
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-sidebar-line bg-sidebar-avatar text-12 font-semibold text-sidebar-text"
        >
          {initialsOf(user.name || user.email)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-13 font-semibold text-sidebar-text">
            {user.name || user.email}
          </span>
          <span className="truncate text-12 text-sidebar-text-muted">
            {subtitle}
          </span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className={cx(
            "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-sidebar-text-muted transition-colors hover:bg-sidebar-surface hover:text-sidebar-text",
            focusRing,
          )}
        >
          <LogOut size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}

function StationSwitcher({
  stations,
  current,
  onChange,
}: {
  stations: SidebarStation[];
  current: SidebarStation | null;
  onChange: (id: string) => void;
}) {
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="type-overline text-10 text-sidebar-text-muted">
          Station
        </span>
        <span className="truncate text-14 font-semibold text-sidebar-text">
          {current?.name ??
            (stations.length ? "Choose a station" : "No stations yet")}
        </span>
      </span>
      {stations.length > 1 ? (
        <ChevronsUpDown
          size={16}
          aria-hidden
          className="shrink-0 text-sidebar-text-muted"
        />
      ) : null}
    </>
  );
  const box =
    "flex w-full items-center gap-2.5 rounded-control border border-sidebar-line bg-sidebar-surface px-3 py-2.5";

  // One station (a station manager, most often): nothing to switch.
  if (stations.length <= 1) return <div className={box}>{body}</div>;

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items: stations.map((s) => ({ key: s.id, label: s.name })),
        selectable: true,
        selectedKeys: current ? [current.id] : [],
        onClick: ({ key }) => onChange(String(key)),
      }}
    >
      <button
        type="button"
        aria-label={`Station: ${current?.name ?? "none chosen"}. Change station`}
        className={cx(
          box,
          "cursor-pointer transition-colors hover:border-sidebar-text-muted",
          focusRing,
        )}
      >
        {body}
      </button>
    </Dropdown>
  );
}
