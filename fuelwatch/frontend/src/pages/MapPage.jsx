import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import client from '../api/client.js';
import MapComponent from '../components/map/MapComponent.jsx';
import CityAutocomplete from '../components/common/CityAutocomplete.jsx';
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

// Default view: centre of Regions I, II & CAR (Northern Luzon)
const REGION_CENTER = [121.0000, 17.5000]; // [lng, lat]
const REGION_ZOOM   = 8;

const FIXED_RADIUS_KM = 2; // radius is always 2 km when using location

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

// ─── Location state machine ───────────────────────────────────────────────────
// 'idle' | 'requesting' | 'found' | 'denied'

export default function MapPage() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [stations, setStations]           = useState([]);
  const [fuelProducts, setFuelProducts]   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [selected, setSelected]           = useState(null);

  // ── Location ──────────────────────────────────────────────────────────────
  const [locState, setLocState]           = useState('idle');   // idle|requesting|found|denied
  const [userCoords, setUserCoords]       = useState(null);     // [lng, lat]

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchText, setSearchText]       = useState('');
  /** One major brand at a time; '' = no brand filter (show all in current fetch). */
  const [selectedBrand, setSelectedBrand] = useState('');
  const [radiusKm, setRadiusKm]           = useState(FIXED_RADIUS_KM);
  const [radiusCenter, setRadiusCenter]   = useState(null);
  const [fuelProductId, setFuelProductId] = useState('');
  const [filtersOpen, setFiltersOpen]     = useState(true);

  // City search (map mode — overrides radius when set)
  const [cityInput, setCityInput]         = useState('');
  const [cityFilter, setCityFilter]       = useState('');   // submitted value
  const [stationBounds, setStationBounds] = useState(null); // [[w,s],[e,n]]

  // ── Fetch fuel products once ──────────────────────────────────────────────
  useEffect(() => {
    client.get('/fuel-products')
      .then((r) => setFuelProducts(r.data.fuel_products || []))
      .catch(() => {});
  }, []);

  // ── Auto-detect location on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocState('denied');
      return;
    }
    setLocState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setUserCoords(coords);
        setRadiusCenter(coords);
        setLocState('found');
      },
      () => {
        setLocState('denied');
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // ── Fetch stations whenever fetch params change ───────────────────────────
  useEffect(() => {
    setLoading(true);
    setError('');

    const params = {};

    if (cityFilter) {
      // City search mode — ignore radius
      params.city = cityFilter;
    } else if (radiusCenter) {
      params.lat       = radiusCenter[1];
      params.lng       = radiusCenter[0];
      params.radius_km = radiusKm;
    }

    if (fuelProductId) params.fuel_product_id = fuelProductId;

    stationsApi.getAll(params)
      .then((d) => {
        const list = d.stations || [];
        setStations(list);

        // When a city search returned results, fit the map to those stations
        if (cityFilter && list.length > 0) {
          const lngs = list.map((s) => s.longitude);
          const lats = list.map((s) => s.latitude);
          setStationBounds([
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ]);
        } else {
          setStationBounds(null);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [radiusCenter, radiusKm, fuelProductId, cityFilter]);

  // ── Derive major brands present in the current fetch ─────────────────────
  // Only expose recognised major brands (keys from BRAND_COLORS) in the filter
  // so users aren't shown obscure/unbranded one-off names.
  const brands = useMemo(() => {
    const major = Object.keys(BRAND_COLORS);
    const present = new Set(
      stations
        .map((s) => s.brand)
        .filter(Boolean)
        .map((b) => {
          for (const key of major) {
            if (b.toLowerCase().includes(key.toLowerCase())) return key;
          }
          return null;
        })
        .filter(Boolean)
    );
    return major.filter((b) => present.has(b));
  }, [stations]);

  // Clear selection if that brand no longer appears in the current result set.
  useEffect(() => {
    setSelectedBrand((prev) => (prev && brands.includes(prev) ? prev : ''));
  }, [brands]);

  const brandFilterActive = selectedBrand !== '';

  // ── Client-side filters (search + brand) ──────────────────────────────────
  const visibleStations = useMemo(() => {
    return stations.filter((s) => {
      if (searchText) {
        const q = searchText.toLowerCase();
        if (
          !s.name?.toLowerCase().includes(q) &&
          !s.brand?.toLowerCase().includes(q) &&
          !s.city?.toLowerCase().includes(q) &&
          !s.province?.toLowerCase().includes(q)
        ) return false;
      }
      if (brandFilterActive) {
        const key = selectedBrand.toLowerCase();
        if (!s.brand?.toLowerCase().includes(key)) return false;
      }
      return true;
    });
  }, [stations, searchText, brandFilterActive, selectedBrand]);

  // ── Sorted by distance when a radius centre is active ────────────────────
  const sortedVisible = useMemo(() => {
    if (!radiusCenter) return visibleStations;
    return [...visibleStations].sort((a, b) => {
      const dA = haversine(a.latitude, a.longitude, radiusCenter[1], radiusCenter[0]);
      const dB = haversine(b.latitude, b.longitude, radiusCenter[1], radiusCenter[0]);
      return dA - dB;
    });
  }, [visibleStations, radiusCenter]);

  const selectBrand = useCallback((brand) => {
    setSelectedBrand((prev) => (prev === brand ? '' : brand));
  }, []);

  const clearFilters = () => {
    setSearchText('');
    setSelectedBrand('');
    setFuelProductId('');
    setCityInput('');
    setCityFilter('');
  };

  const handleCitySearch = useCallback((town) => {
    const city = town.trim();
    if (!city) return;
    setCityInput(city);
    setCityFilter(city);
    // Clear location radius when browsing by city
    setRadiusCenter(null);
    setUserCoords(null);
    setLocState('idle');
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setUserCoords(coords);
        setRadiusCenter(coords);
        setLocState('found');
      },
      () => setLocState('denied'),
      { timeout: 10000, maximumAge: 0 },
    );
  };

  const resetToRegion = () => {
    setRadiusCenter(null);
    setUserCoords(null);
    setLocState('idle');
    setSelectedBrand('');
    setSearchText('');
    setFuelProductId('');
    setCityInput('');
    setCityFilter('');
    setStationBounds(null);
  };

  const activeFilterCount =
    (cityFilter ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (fuelProductId ? 1 : 0);

  // ── Derived map props ─────────────────────────────────────────────────────
  const mapCenter = locState === 'found' && userCoords ? userCoords : REGION_CENTER;
  const mapZoom   = locState === 'found' ? 14 : REGION_ZOOM;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ paddingTop: '16px' }}>
      <div className="container">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="section-header" style={{ marginBottom: '12px' }}>
          <div>
            <h1 style={{ marginBottom: '2px' }}>Station Map</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {loading
                ? 'Loading stations…'
                : <>
                    Showing <strong>{visibleStations.length}</strong> of {stations.length} stations
                    {radiusCenter && ` within ${radiusKm} km`}
                  </>
              }
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${filtersOpen ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <Link to="/stations" className="btn btn-secondary btn-sm">List View</Link>
          </div>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {/* ── Location banner ──────────────────────────────────────────── */}
        {locState === 'requesting' && (
          <div className="alert" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LoadingSpinner size="sm" />
            <span>Detecting your location to find nearby stations…</span>
          </div>
        )}
        {locState === 'denied' && (
          <div className="alert" style={{ background: '#fefce8', border: '1px solid #fde68a', color: '#854d0e', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span>Location access was denied. Showing all stations — or <button className="btn btn-sm btn-secondary" onClick={locateMe} style={{ marginLeft: '4px' }}>try again</button></span>
          </div>
        )}

        {/* ── Filter panel ─────────────────────────────────────────────── */}
        {filtersOpen && (
          <div className="card" style={{ marginBottom: '14px', padding: '16px' }}>

            {/* Row 1: City search + clear */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <CityAutocomplete
                value={cityInput}
                onChange={setCityInput}
                onSearch={handleCitySearch}
                placeholder="Search town or city to filter stations…"
              />
              {cityFilter && (
                <button className="btn btn-sm btn-secondary" onClick={() => { setCityInput(''); setCityFilter(''); setStationBounds(null); }}>✕ Clear city</button>
              )}
            </div>

            {/* Row 2: Fuel type */}
            <div style={{ marginBottom: '14px' }}>
              <div style={sectionLabel}>Fuel Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <FilterPill
                  label="All types"
                  active={!fuelProductId}
                  color="#2563eb"
                  onClick={() => setFuelProductId('')}
                />
                {fuelProducts.map((fp) => (
                  <FilterPill
                    key={fp.id}
                    label={fp.name}
                    active={fuelProductId === fp.id}
                    color="#2563eb"
                    onClick={() => setFuelProductId(fuelProductId === fp.id ? '' : fp.id)}
                  />
                ))}
              </div>
            </div>

            {/* Row 3: Brand (single-select; tap again to clear) */}
            <div style={{ marginBottom: '14px' }}>
              <div style={sectionLabel}>Brand</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {brands.map((brand) => (
                  <FilterPill
                    key={brand}
                    label={brand}
                    active={selectedBrand === brand}
                    color={brandColor(brand)}
                    onClick={() => selectBrand(brand)}
                  />
                ))}
              </div>
            </div>

            {/* Row 4: Location */}
            <div>
              <div style={sectionLabel}>Location</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {locState === 'found' ? (
                  <>
                    <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                      📍 Using your location &mdash; showing stations within <strong>2 km</strong>
                    </span>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                      onClick={resetToRegion}
                    >
                      Show all stations
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-sm"
                    style={{ background: '#fff', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', padding: '4px 12px', cursor: 'pointer' }}
                    onClick={locateMe}
                    disabled={locState === 'requesting'}
                  >
                    {locState === 'requesting' ? 'Locating…' : '📍 Use my location (2 km radius)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Map + sidebar grid ───────────────────────────────────────── */}
        <div className="map-layout" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: '14px', alignItems: 'start' }}>

          {/* Map */}
          <div className="card" style={{ padding: '6px', position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.92)', borderRadius: '999px', padding: '6px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                <LoadingSpinner size="sm" /> Loading stations…
              </div>
            )}
            <MapComponent
              stations={visibleStations}
              height="clamp(420px, 68vh, 570px)"
              center={mapCenter}
              zoom={mapZoom}
              onStationClick={(s) => setSelected(s)}
              selectedId={selected?.id}
              radiusCircle={radiusCenter ? { center: radiusCenter, radiusKm } : null}
              userLocation={locState === 'found' ? userCoords : null}
              fitBounds={stationBounds}
            />
          </div>

          {/* Station detail sidebar */}
          {selected && (
            <div className="card" style={{ position: 'sticky', top: '76px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span
                    style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: brandColor(selected.brand), marginRight: '6px' }}
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

              {(selected.city || selected.province) && (
                <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
                  {[selected.city, selected.province].filter(Boolean).join(', ')}
                </p>
              )}
              {selected.address && (
                <p style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>{selected.address}</p>
              )}

              {radiusCenter && (
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

        {/* ── Station list (collapsible) ───────────────────────────────── */}
        <details style={{ marginTop: '20px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>
            Show Station List ({sortedVisible.length})
          </summary>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
            {sortedVisible.map((s) => (
              <Link key={s.id} to={`/stations/${s.id}`} className="card card-hover"
                style={{ padding: '12px', textDecoration: 'none', borderLeft: `4px solid ${brandColor(s.brand)}` }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>{s.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {[s.brand, s.city].filter(Boolean).join(' · ')}
                </div>
                {radiusCenter && (
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

// ─── Shared label style ────────────────────────────────────────────────────────
const sectionLabel = {
  fontSize: '0.78rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  marginBottom: '8px',
};

// ─── Reusable filter pill ──────────────────────────────────────────────────────
function FilterPill({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 14px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        border: `1.5px solid ${active ? color : '#e2e8f0'}`,
        background: active ? color : '#fff',
        color: active ? '#fff' : 'var(--color-text)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}
