import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import MapComponent from '../components/map/MapComponent.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dO = ((lon2 - lon1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TUGUEGARAO_CENTER = [121.727, 17.6132]; // [lng, lat]

const RADIUS_OPTIONS = [
  { label: 'All', km: 0 },
  { label: '1 km', km: 1 },
  { label: '2 km', km: 2 },
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: '20 km', km: 20 },
];

// Brand colours for pills (must stay in sync with MapComponent)
const BRAND_COLORS = {
  Petron: '#E31837', Shell: '#FFC200', Caltex: '#003087',
  Phoenix: '#FF6600', 'Flying V': '#008000', PTT: '#00A650',
  Seaoil: '#0055AA', Jetti: '#9B1C1C', Total: '#EF3A1D',
  'Clean Fuel': '#059669', Unioil: '#7C3AED',
};

function brandColor(brand) {
  if (!brand) return '#2563eb';
  for (const [k, c] of Object.entries(BRAND_COLORS)) {
    if (brand.toLowerCase().includes(k.toLowerCase())) return c;
  }
  return '#2563eb';
}

export default function MapPage() {
  const [allStations, setAllStations]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selected, setSelected]         = useState(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchText, setSearchText]         = useState('');
  const [activeBrands, setActiveBrands]     = useState(new Set());  // empty = all
  const [radiusKm, setRadiusKm]             = useState(0);
  const [radiusCenter, setRadiusCenter]     = useState(TUGUEGARAO_CENTER); // [lng, lat]
  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [locating, setLocating]             = useState(false);
  const [filtersOpen, setFiltersOpen]       = useState(true);

  // ── Load all stations once ───────────────────────────────────────────────────
  useEffect(() => {
    stationsApi.getAll()
      .then((d) => setAllStations(d.stations))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Derive unique brands ─────────────────────────────────────────────────────
  const brands = useMemo(() => {
    const seen = new Set();
    allStations.forEach((s) => { if (s.brand) seen.add(s.brand); });
    return [...seen].sort();
  }, [allStations]);

  // ── Apply filters ────────────────────────────────────────────────────────────
  const visibleStations = useMemo(() => {
    return allStations.filter((s) => {
      // 1. Text search
      if (searchText) {
        const q = searchText.toLowerCase();
        if (
          !s.name?.toLowerCase().includes(q) &&
          !s.brand?.toLowerCase().includes(q) &&
          !s.barangay?.toLowerCase().includes(q)
        ) return false;
      }

      // 2. Brand filter
      if (activeBrands.size > 0 && !activeBrands.has(s.brand)) return false;

      // 3. Radius filter
      if (radiusKm > 0) {
        const dist = haversine(s.latitude, s.longitude, radiusCenter[1], radiusCenter[0]);
        if (dist > radiusKm) return false;
      }

      return true;
    });
  }, [allStations, searchText, activeBrands, radiusKm, radiusCenter]);

  const toggleBrand = useCallback((brand) => {
    setActiveBrands((prev) => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
      return next;
    });
  }, []);

  const clearFilters = () => {
    setSearchText('');
    setActiveBrands(new Set());
    setRadiusKm(0);
    setRadiusCenter(TUGUEGARAO_CENTER);
    setUsingMyLocation(false);
  };

  const locateMe = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setRadiusCenter(coords);
        setUsingMyLocation(true);
        if (radiusKm === 0) setRadiusKm(5); // default to 5 km when locating
        setLocating(false);
      },
      () => {
        alert('Could not get your location. Check browser permissions.');
        setLocating(false);
      },
    );
  };

  const activeFilterCount =
    (searchText ? 1 : 0) + activeBrands.size + (radiusKm > 0 ? 1 : 0);

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page" style={{ paddingTop: '16px' }}>
      <div className="container">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <div>
            <h1 style={{ marginBottom: '2px' }}>Station Map</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Showing <strong>{visibleStations.length}</strong> of {allStations.length} stations
              {radiusKm > 0 && ` within ${radiusKm} km`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${filtersOpen ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              🔍 Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <Link to="/stations" className="btn btn-secondary btn-sm">📋 List View</Link>
          </div>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {/* ── Filter panel ────────────────────────────────────────────────── */}
        {filtersOpen && (
          <div className="card" style={{ marginBottom: '14px', padding: '16px' }}>

            {/* Row 1: Search + clear */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input
                className="form-control"
                style={{ flex: '1 1 200px', minWidth: '180px' }}
                placeholder="Search name, brand, barangay…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {activeFilterCount > 0 && (
                <button className="btn btn-sm btn-secondary" onClick={clearFilters}>✕ Clear all</button>
              )}
            </div>

            {/* Row 2: Brand pills */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Brand
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {/* "All" pill */}
                <button
                  onClick={() => setActiveBrands(new Set())}
                  style={{
                    padding: '4px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer', border: '1.5px solid',
                    borderColor: activeBrands.size === 0 ? '#2563eb' : '#e2e8f0',
                    background: activeBrands.size === 0 ? '#2563eb' : '#fff',
                    color: activeBrands.size === 0 ? '#fff' : 'var(--color-text)',
                    transition: 'all 0.15s',
                  }}
                >
                  All
                </button>
                {brands.map((brand) => {
                  const active = activeBrands.has(brand);
                  const color  = brandColor(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      style={{
                        padding: '4px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                        cursor: 'pointer', border: `1.5px solid ${active ? color : '#e2e8f0'}`,
                        background: active ? color : '#fff',
                        color: active ? '#fff' : 'var(--color-text)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Radius */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Radius
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Radius buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {RADIUS_OPTIONS.map(({ label, km }) => (
                    <button
                      key={km}
                      onClick={() => setRadiusKm(km)}
                      style={{
                        padding: '4px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                        cursor: 'pointer', border: '1.5px solid',
                        borderColor: radiusKm === km ? '#2563eb' : '#e2e8f0',
                        background: radiusKm === km ? '#2563eb' : '#fff',
                        color: radiusKm === km ? '#fff' : 'var(--color-text)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {radiusKm > 0 && (
                  <>
                    <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Centre:{' '}
                      <span style={{ fontWeight: 600, color: usingMyLocation ? '#059669' : 'var(--color-text)' }}>
                        {usingMyLocation ? '📍 My location' : '🏙 Tuguegarao'}
                      </span>
                    </div>
                    <button
                      className="btn btn-sm"
                      style={{ background: usingMyLocation ? '#059669' : '#fff', color: usingMyLocation ? '#fff' : 'var(--color-text)', border: '1.5px solid', borderColor: usingMyLocation ? '#059669' : '#e2e8f0', fontSize: '0.8rem', padding: '4px 12px' }}
                      onClick={usingMyLocation ? () => { setRadiusCenter(TUGUEGARAO_CENTER); setUsingMyLocation(false); } : locateMe}
                      disabled={locating}
                    >
                      {locating ? 'Locating…' : usingMyLocation ? '✓ Using my location' : '📍 Use my location'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Map + sidebar grid ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: '14px', alignItems: 'start' }}>

          {/* Map */}
          <div className="card" style={{ padding: '6px' }}>
            <MapComponent
              stations={visibleStations}
              height="570px"
              onStationClick={(s) => setSelected(s)}
              selectedId={selected?.id}
              radiusCircle={radiusKm > 0 ? { center: radiusCenter, radiusKm } : null}
              userLocation={usingMyLocation ? radiusCenter : null}
            />
          </div>

          {/* Station detail sidebar */}
          {selected && (
            <div className="card" style={{ position: 'sticky', top: '76px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div
                    style={{
                      display: 'inline-block', width: '10px', height: '10px',
                      borderRadius: '50%', background: brandColor(selected.brand),
                      marginRight: '6px',
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selected.name}</span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.3rem', lineHeight: 1 }}
                >×</button>
              </div>

              {selected.brand && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ background: brandColor(selected.brand), color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: '999px' }}>
                    {selected.brand}
                  </span>
                </div>
              )}
              {selected.barangay && <p style={{ fontSize: '0.83rem', marginTop: '8px' }}>📍 {selected.barangay}</p>}
              {selected.address  && <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>{selected.address}</p>}

              {radiusKm > 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                  📏 {haversine(selected.latitude, selected.longitude, radiusCenter[1], radiusCenter[0]).toFixed(2)} km away
                </p>
              )}

              <div style={{ marginTop: '14px' }}>
                <Link to={`/stations/${selected.id}`} className="btn btn-primary btn-sm btn-full">
                  View Prices →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Fallback list ────────────────────────────────────────────────── */}
        <details style={{ marginTop: '20px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>
            📋 Show Station List ({visibleStations.length})
          </summary>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
            {visibleStations.map((s) => (
              <Link key={s.id} to={`/stations/${s.id}`} className="card card-hover"
                style={{ padding: '12px', textDecoration: 'none', borderLeft: `4px solid ${brandColor(s.brand)}` }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>{s.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {[s.brand, s.barangay].filter(Boolean).join(' · ')}
                </div>
                {radiusKm > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {haversine(s.latitude, s.longitude, radiusCenter[1], radiusCenter[0]).toFixed(1)} km
                  </div>
                )}
              </Link>
            ))}
          </div>
        </details>

      </div>
    </div>
  );
}
