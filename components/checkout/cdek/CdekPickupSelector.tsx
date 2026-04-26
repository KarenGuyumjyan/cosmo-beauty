'use client';

import type { CdekPickupPoint } from '@/lib/cdek/types';
import CdekPickupMap from './CdekPickupMap';
import CdekPickupList from './CdekPickupList';

type Props = {
  points: CdekPickupPoint[];
  selectedCode: string;
  onSelect: (code: string) => void;
  loading?: boolean;
  error?: string | null;
  hintCenter?: [number, number] | null;
};

export default function CdekPickupSelector({
  points,
  selectedCode,
  onSelect,
  loading,
  error,
  hintCenter,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
      <CdekPickupMap
        points={points}
        selectedCode={selectedCode}
        onSelect={onSelect}
        hintCenter={hintCenter}
      />
      <div className="h-[480px]">
        <CdekPickupList
          points={points}
          selectedCode={selectedCode}
          onSelect={onSelect}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
