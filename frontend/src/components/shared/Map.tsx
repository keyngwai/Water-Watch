import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Report, STATUS_COLORS } from '../../types';
import { StatusBadge } from './Badges';

// Fix Leaflet's default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored markers based on report status
function createStatusIcon(status: string): L.DivIcon {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#64748b';
  return L.divIcon({
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    className: '',
  });
}

// Component to fly to a location
function FlyTo({ lat, lng, zoom = 13 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
  }, [lat, lng, zoom, map]);
  return null;
}

// ---------------------------------------------------------------------------
// ReportMap: Interactive map for listing reports
// ---------------------------------------------------------------------------
interface ReportMapProps {
  reports: Report[];
  onReportSelect?: (report: Report) => void;
  selectedReport?: Report | null;
  height?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  showRadius?: boolean;
  radiusKm?: number;
}

export function ReportMap({
  reports,
  onReportSelect,
  selectedReport,
  height = '500px',
  centerLat = 1.2921,
  centerLng = 36.8219,
  zoom = 7,
  showRadius = false,
  radiusKm = 10,
}: ReportMapProps) {
  const normalizedReports = reports
    .map((report) => ({
      ...report,
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
    }))
    .filter((report) => Number.isFinite(report.latitude) && Number.isFinite(report.longitude));

  const selectedLat = selectedReport ? Number(selectedReport.latitude) : NaN;
  const selectedLng = selectedReport ? Number(selectedReport.longitude) : NaN;

  return (
    <div style={{ height, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {selectedReport && Number.isFinite(selectedLat) && Number.isFinite(selectedLng) && (
          <FlyTo lat={selectedLat} lng={selectedLng} zoom={14} />
        )}

        {showRadius && (
          <Circle
            center={[centerLat, centerLng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#0369a1', fillColor: '#0369a1', fillOpacity: 0.05 }}
          />
        )}

        {normalizedReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createStatusIcon(report.status)}
            eventHandlers={{
              click: () => onReportSelect?.(report),
            }}
          >
            <Popup maxWidth={280}>
              <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", padding: '4px' }}>
                <div style={{ marginBottom: '6px' }}>
                  <StatusBadge status={report.status} />
                </div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{report.title}</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 8px' }}>
                  {report.location_name || report.county}
                </p>
                <span style={{
                  fontSize: '11px', color: '#94a3b8',
                  fontFamily: 'monospace',
                }}>{report.reference_code}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LocationPicker: Let citizens click the map to set GPS coordinates
// ---------------------------------------------------------------------------
interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLat?: number;
  selectedLng?: number;
  height?: string;
}

function LocationClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, onLocationSelect]);
  return null;
}

export function LocationPicker({ onLocationSelect, selectedLat, selectedLng, height = '300px' }: LocationPickerProps) {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
      <div style={{
        background: '#eff6ff',
        padding: '8px 12px',
        fontSize: '12px',
        color: '#0369a1',
        fontWeight: 500,
        borderBottom: '1px solid #dbeafe',
      }}>
        Click the map to set your location
      </div>
      <div style={{ height }}>
        <MapContainer
          center={[1.2921, 36.8219]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationClickHandler onLocationSelect={onLocationSelect} />
          {selectedLat !== undefined && selectedLng !== undefined && (
            <Marker
              position={[selectedLat, selectedLng]}
              icon={L.divIcon({
                html: `<div style="width:16px;height:16px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
                className: '',
              })}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
