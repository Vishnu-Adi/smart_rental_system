"use client";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AssetRow } from '@/lib/types';

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

const statusToColor = (status: AssetRow['status']): string => {
  switch (status) {
    case 'available':
      return '#22c55e';
    case 'rented':
      return '#3b82f6';
    case 'under_maintenance':
      return '#f59e0b';
    default:
      return '#9ca3af';
  }
};

export function FleetMap({ assets, onSelect }: { assets: AssetRow[]; onSelect?: (a: AssetRow) => void }) {
  // Filter out invalid coordinates
  const validAssets = assets.filter(a => 
    Number(a.current_location_lat) !== 99.99999999 && 
    Number(a.current_location_lon) !== 99.99999999 &&
    !isNaN(Number(a.current_location_lat)) &&
    !isNaN(Number(a.current_location_lon))
  );

  const center: [number, number] = validAssets.length
    ? [Number(validAssets[0].current_location_lat), Number(validAssets[0].current_location_lon)]
    : [20.5937, 78.9629]; // Center of India as default

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border/50">
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution="&copy; OpenStreetMap contributors" 
        />
        {validAssets.map((a, index) => (
          <Marker 
            key={`${a.machine_id}-${index}`} 
            position={[Number(a.current_location_lat), Number(a.current_location_lon)] as [number, number]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="background:${statusToColor(a.status)};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);transition:all 0.2s ease"></div>`
            })}
            eventHandlers={{ 
              click: () => onSelect?.(a),
              mouseover: (e) => {
                e.target.getElement().style.transform = 'scale(1.2)';
              },
              mouseout: (e) => {
                e.target.getElement().style.transform = 'scale(1)';
              }
            }}
          >
            <Popup className="custom-popup">
              <div className="text-sm min-w-[200px]">
                <div className="font-semibold text-base text-gray-900 mb-2">
                  {a.asset_type.charAt(0).toUpperCase() + a.asset_type.slice(1)} #{a.machine_id}
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div><strong>Manufacturer:</strong> {a.manufacturer}</div>
                  <div><strong>Year:</strong> {a.year_of_manufacture}</div>
                  <div><strong>Status:</strong> 
                    <span className={`ml-1 px-2 py-0.5 rounded text-white text-[10px] ${
                      a.status === 'available' ? 'bg-green-500' :
                      a.status === 'rented' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}>
                      {a.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {a.currentRenter && <div><strong>Renter:</strong> {a.currentRenter}</div>}
                  <div><strong>Rate:</strong> {Number(a.rental_price_per_day).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}/day</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}


