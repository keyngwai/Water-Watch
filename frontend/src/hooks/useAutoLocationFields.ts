import { useState } from 'react';
import { KENYAN_COUNTIES } from '../types';

export async function reverseGeocodeLocation(lat: number, lng: number) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('zoom', '10');
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MajiWatch/1.0 (+https://example.com)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    let county = addr.county || addr.state || addr.region || '';
    const subCounty = addr.city_district || addr.suburb || addr.town || addr.village || '';
    const ward = addr.neighbourhood || addr.hamlet || addr.locality || '';
    const locationName = data.display_name;

    county = county.toLowerCase().replace(/\s+county$/, '').trim();
    const matchedCounty = KENYAN_COUNTIES.find(c =>
      c.toLowerCase().replace(/\s+county$/, '').trim() === county ||
      county.includes(c.toLowerCase().replace(/\s+county$/, '').trim())
    ) || county;

    return { county: matchedCounty, sub_county: subCounty, ward, location_name: locationName };
  } catch {
    return null;
  }
}

export function useAutoLocationFields() {
  const [autoFields, setAutoFields] = useState({ county: '', sub_county: '', ward: '', location_name: '' });

  const handleLocationSelect = async (lat: number, lng: number) => {
    const geo = await reverseGeocodeLocation(lat, lng);
    if (geo) setAutoFields(geo);
    return geo;
  };

  return { autoFields, handleLocationSelect };
}
