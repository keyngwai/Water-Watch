import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { reportsApi, getApiError } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';

const LocationPicker = lazy(() =>
  import('../../components/shared/Map').then((m) => ({ default: m.LocationPicker }))
);
import { IssueCategory, SeverityLevel, CATEGORY_LABELS, KENYAN_COUNTIES } from '../../types';

const CATEGORIES: IssueCategory[] = [
  'broken_borehole', 'contaminated_water', 'illegal_connection',
  'water_shortage', 'unfair_pricing', 'pipe_burst', 'no_water_supply', 'other',
];

const SEVERITIES: { value: SeverityLevel; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Minor inconvenience' },
  { value: 'medium', label: 'Medium', desc: 'Affects daily use' },
  { value: 'high', label: 'High', desc: 'Serious impact on community' },
  { value: 'critical', label: 'Critical', desc: 'Health emergency, immediate action needed' },
];

export default function SubmitReport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    category: '' as IssueCategory | '',
    severity: 'medium' as SeverityLevel,
    title: '',
    description: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    location_name: '',
    county: user?.county || '',
    sub_county: '',
    ward: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const reverseGeocodeLocation = async (lat: number, lng: number) => {
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

      // Nominatim uses different keys depending on location; we try a few
      let county = addr.county || addr.state || addr.region || '';
      const subCounty = addr.city_district || addr.suburb || addr.town || addr.village || '';
      const ward = addr.neighbourhood || addr.hamlet || addr.locality || '';
      const locationName = data.display_name;

      // Normalize county name and match against Kenyan counties
      county = county.toLowerCase().replace(/\s+county$/, '').trim();
      const matchedCounty = KENYAN_COUNTIES.find(c =>
        c.toLowerCase().replace(/\s+county$/, '').trim() === county ||
        county.includes(c.toLowerCase().replace(/\s+county$/, '').trim())
      ) || county; // fallback to original if no match

      return { county: matchedCounty, sub_county: subCounty, ward, location_name: locationName };
    } catch {
      return null;
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Set GPS coordinates
      setForm((f) => ({ ...f, latitude: lat, longitude: lng }));

      // Reverse geocode to fill location fields
      const geo = await reverseGeocodeLocation(lat, lng);
      if (geo) {
        setForm((f) => ({
          ...f,
          county: geo.county ?? f.county,
          sub_county: geo.sub_county ?? f.sub_county,
          ward: geo.ward ?? f.ward,
          location_name: geo.location_name ?? f.location_name,
        }));
      }

      toast.success('Location set from GPS!');
    } catch (err) {
      console.error('Geolocation error:', err);
      toast.error('Could not get your location. Please check permissions or click the map instead.');
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
    const geo = await reverseGeocodeLocation(lat, lng);
    if (geo) {
      setForm((f) => ({
        ...f,
        county: geo.county ?? f.county,
        sub_county: geo.sub_county ?? f.sub_county,
        ward: geo.ward ?? f.ward,
        location_name: geo.location_name ?? f.location_name,
      }));
    }
    toast.success('Location set from map.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.county) {
      setForm((f) => ({ ...f, county: f.county || user.county || '' }));
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!form.category) return toast.error('Please select an issue category.');
    if (!form.title.trim()) return toast.error('Please provide a title.');
    if (!form.latitude || !form.longitude) return toast.error('Please set the issue location on the map.');
    if (!form.county) return toast.error('Please select a county.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== undefined && val !== '') formData.append(key, String(val));
      });
      images.forEach((img) => formData.append('images', img));

      const report = await reportsApi.create(formData);

      // Ensure any open admin views refresh to show the new report
      queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });

      toast.success(`Report ${report.reference_code} submitted!`);
      navigate(`/reports/${report.id}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isStepValid = (s: number) => {
    if (s === 1) return form.category !== '' && form.title.trim().length >= 5;
    if (s === 2) return !!form.latitude && !!form.longitude && !!form.county;
    return true;
  };

  return (
    <Layout title="Report Water Issue">
      {/* Progress Steps */}
      <div style={styles.steps}>
        {['Issue details', 'Location'].map((label, i) => (
          <div key={i} style={styles.stepItem} onClick={() => isStepValid(i) && setStep(i + 1)}>
            <div style={{
              ...styles.stepCircle,
              background: step > i + 1 ? '#10b981' : step === i + 1 ? '#0369a1' : '#e2e8f0',
              color: step > i + 1 || step === i + 1 ? 'white' : '#94a3b8',
            }}>
              {step > i + 1 ? 'Done' : i + 1}
            </div>
            <span style={{
              fontSize: '13px',
              color: step === i + 1 ? '#0369a1' : '#94a3b8',
              fontWeight: step === i + 1 ? 600 : 400,
            }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {/* Step 1: Category, severity, title, description */}
        {step === 1 && (
          <div>
            <h2 style={styles.stepTitle}>What type of issue are you reporting?</h2>
            <div style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setForm((f) => ({ ...f, category: cat }))}
                  style={{
                    ...styles.categoryBtn,
                    borderColor: form.category === cat ? '#0369a1' : '#e2e8f0',
                    background: form.category === cat ? '#eff6ff' : 'white',
                    color: form.category === cat ? '#0369a1' : '#475569',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <label style={styles.label}>Severity Level</label>
            <div style={styles.severityGrid}>
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setForm((f) => ({ ...f, severity: s.value }))}
                  style={{
                    ...styles.severityBtn,
                    borderColor: form.severity === s.value ? '#0369a1' : '#e2e8f0',
                    background: form.severity === s.value ? '#eff6ff' : 'white',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{s.label}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{s.desc}</span>
                </button>
              ))}
            </div>

            <label style={styles.label}>Report Title <span style={styles.required}>*</span></label>
            <input
              id="report-title"
              name="title"
              style={styles.input}
              placeholder="e.g., Borehole at Kibera has been non-functional for 3 weeks"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={255}
            />
            <span style={styles.charCount}>{form.title.length}/255</span>

            <label style={styles.label}>Full Description (optional)</label>
            <textarea
              id="report-description"
              name="description"
              style={{ ...styles.input, minHeight: '150px', resize: 'vertical' }}
              placeholder="Describe the issue in detail: when did it start, who is affected, what you have observed..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={5000}
            />
            <span style={styles.charCount}>{form.description.length}/5000</span>

            <label style={styles.label}>Photos (optional, max 5)</label>
            <div
              style={styles.uploadZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Click to upload photos — JPEG, PNG, WebP up to 10MB each
              </p>
            </div>
            {previews.length > 0 && (
              <div style={styles.previewGrid}>
                {previews.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt={`Preview ${i + 1}`} style={styles.previewImg} />
                    <button
                      style={styles.removeImg}
                      onClick={() => {
                        setImages((imgs) => imgs.filter((_, j) => j !== i));
                        setPreviews((ps) => ps.filter((_, j) => j !== i));
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <h2 style={styles.stepTitle}>Where is the issue located?</h2>
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={handleUseCurrentLocation}
                style={styles.gpsBtn}
                type="button"
              >
                Use my current location
              </button>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Or click on the map below to set the location manually
              </p>
            </div>
            <Suspense fallback={<div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '12px', color: '#64748b' }}>Loading map...</div>}>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                selectedLat={form.latitude}
                selectedLng={form.longitude}
                height="320px"
              />
            </Suspense>
            {form.latitude && (
              <p style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', fontFamily: 'monospace' }}>
                Location set: {form.latitude.toFixed(6)}, {form.longitude!.toFixed(6)}
              </p>
            )}

            <div style={styles.fieldRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>County <span style={styles.required}>*</span></label>
                <select
                  id="report-county"
                  name="county"
                  style={styles.input}
                  value={form.county}
                  onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                >
                  <option value="">Select County</option>
                  {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label} htmlFor="report-sub_county">Sub-County</label>
                <input
                  id="report-sub_county"
                  name="sub_county"
                  style={styles.input}
                  placeholder="e.g., Westlands"
                  value={form.sub_county}
                  onChange={(e) => setForm((f) => ({ ...f, sub_county: e.target.value }))}
                />
              </div>
            </div>

            <label style={styles.label} htmlFor="report-location_name">Location Name</label>
            <input
              id="report-location_name"
              name="location_name"
              style={styles.input}
              placeholder="e.g., Near Kibera Primary School, Pipeline Road"
              value={form.location_name}
              onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))}
            />
          </div>
        )}

        {/* Navigation */}
        <div style={styles.navButtons}>
          {step > 1 && (
            <button style={styles.backBtn} onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          )}
          {step < 2 ? (
            <button
              style={{ ...styles.nextBtn, opacity: isStepValid(step) ? 1 : 0.5 }}
              onClick={() => isStepValid(step) && setStep((s) => s + 1)}
              disabled={!isStepValid(step)}
            >
              Continue →
            </button>
          ) : (
            <button
              style={{ ...styles.nextBtn, background: '#10b981' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  steps: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    marginBottom: '32px',
    background: 'white',
    borderRadius: '12px',
    padding: '20px 24px',
    border: '1px solid #e2e8f0',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    cursor: 'pointer',
  },
  stepCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '32px',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '24px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
    marginBottom: '24px',
  },
  categoryBtn: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '2px solid',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  severityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginBottom: '24px',
  },
  severityBtn: {
    padding: '12px',
    borderRadius: '10px',
    border: '2px solid',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    textAlign: 'left',
    transition: 'all 0.15s',
    background: 'white',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  },
  required: { color: '#ef4444' },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: '#fafafa',
  },
  charCount: { fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '-12px', marginBottom: '16px' },
  uploadZone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'border-color 0.15s',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
    marginBottom: '16px',
  },
  previewImg: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  removeImg: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldRow: { display: 'flex', gap: '16px' },
  reviewBox: {
    background: '#f8fafc',
    borderRadius: '10px',
    padding: '16px 20px',
    border: '1px solid #e2e8f0',
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #f1f5f9',
  },
  backBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#475569',
  },
  nextBtn: {
    padding: '10px 28px',
    borderRadius: '8px',
    border: 'none',
    background: '#0369a1',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    marginLeft: 'auto',
  },
  gpsBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1.5px solid #0369a1',
    background: '#eff6ff',
    color: '#0369a1',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    transition: 'all 0.15s',
  },
};
