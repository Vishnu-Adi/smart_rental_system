"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { UsageRow } from '@/lib/types';
import { relativeTimeFromIso } from '@/lib/format';

function statusColor(status: UsageRow['utilization_status']): string {
  switch (status) {
    case 'Normal': return '#22c55e';
    case 'Underutilized': return '#60a5fa';
    case 'Overutilized': return '#ef4444';
    default: return '#9ca3af';
  }
}

// Fix default marker icons in Leaflet with Next
if ((L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function UsageMap({ rows }: { rows: (UsageRow & { idlePct: number; location_lat: number; location_lon: number })[] }) {
  const center: [number, number] = rows.length ? [rows[0].location_lat, rows[0].location_lon] : [20, 0];
  return (
    <div className="w-full h-96 rounded-md overflow-hidden">
      <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {rows.map((r, index) => (
          <Marker key={`${r.machine_id}-${index}`} position={[r.location_lat, r.location_lon] as [number, number]} icon={L.divIcon({
            className: 'usage-marker',
            html: `<div style="background:${statusColor(r.utilization_status)};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,.4)"></div>`
          })}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs">Idle {r.idlePct.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">{relativeTimeFromIso(r.timestamp)}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}


