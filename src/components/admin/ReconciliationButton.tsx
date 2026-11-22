'use client';

import { useRouter } from 'next/navigation';
import { Tooltip } from 'antd';
import { Scale } from 'lucide-react';
import { focusRing } from '@/components/ui/focus';
import { cx } from '@/lib/cx';
import { useStationStore } from '@/store/station-store';

export interface StationRef {
  id: string;
  name: string;
  location?: string | null;
  companyId?: string;
}

/**
 * Opens a station's reconciliation from the platform, read only: the station
 * becomes the sidebar's station, then its report opens. It wears the sidebar's
 * Reconciliation icon. A button rather than a link, since the station is chosen
 * here and not in the address, so a link opened in a new tab would show
 * another station.
 */
export function ReconciliationButton({ station }: { station: StationRef }) {
  const router = useRouter();
  const { stations, setCurrentStation } = useStationStore();
  const open = () => {
    setCurrentStation(
      stations.find((s) => s.id === station.id) ?? {
        id: station.id,
        companyId: station.companyId ?? '',
        name: station.name,
        location: station.location ?? '',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    );
    router.push('/reconciliation');
  };
  return (
    <Tooltip title="Reconciliation">
      <button
        type="button"
        aria-label={`Reconciliation for ${station.name}`}
        onClick={open}
        className={cx(
          'inline-flex size-8 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-text-secondary hover:bg-surface-muted',
          focusRing,
        )}
      >
        <Scale size={16} aria-hidden />
      </button>
    </Tooltip>
  );
}
