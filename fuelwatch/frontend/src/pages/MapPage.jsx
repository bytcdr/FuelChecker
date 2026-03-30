import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import MapComponent from '../components/map/MapComponent.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function MapPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    stationsApi.getAll()
      .then((data) => setStations(data.stations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStationClick = useCallback((s) => setSelected(s), []);

  if (loading) return <div className="page"><div className="container"><LoadingSpinner /></div></div>;

  return (
    <>
      {/* ── Desktop layout ─────────────────────────── */}
      <div className="map-page-desktop">
        <div className="container" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <div>
              <h1>Station Map</h1>
              <p style={{ marginTop: '4px' }}>{stations.length} stations</p>
            </div>
            <Link to="/stations" className="btn btn-secondary btn-sm">📋 List View</Link>
          </div>

          {error && <div className="alert alert-warning">Could not load station data: {error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: '16px', alignItems: 'start' }}>
            <div>
              {!mapFailed ? (
                <div className="card" style={{ padding: '8px' }}>
                  <MapComponent
                    stations={stations}
                    height="580px"
                    onStationClick={handleStationClick}
                  />
                </div>
              ) : (
                <EmptyState
                  icon="🗺️"
                  title="Map unavailable"
                  message="Could not load the map. Please check your connection or use the list view."
                  action={<Link to="/stations" className="btn btn-primary btn-sm">View Station List</Link>}
                />
              )}
            </div>

            {selected && (
              <div className="card" style={{ position: 'sticky', top: '76px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{selected.name}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.4rem', lineHeight: 1, padding: '0 4px' }}
                  >
                    ×
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>{selected.brand}</p>
                {selected.city && <p style={{ fontSize: '0.85rem' }}>📍 {selected.city}{selected.province ? `, ${selected.province}` : ''}</p>}
                {selected.address && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{selected.address}</p>}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link to={`/stations/${selected.id}`} className="btn btn-primary btn-sm btn-full">View Prices</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile layout ──────────────────────────── */}
      <div className="map-page-mobile">
        {/* Floating top bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(4px)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>Station Map</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{stations.length} stations</span>
          </div>
          <Link to="/stations" className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem', minHeight: '36px', padding: '6px 12px' }}>
            📋 List
          </Link>
        </div>

        {error && (
          <div style={{ position: 'absolute', top: '52px', left: '12px', right: '12px', zIndex: 10 }}>
            <div className="alert alert-warning" style={{ margin: 0, fontSize: '0.8rem', padding: '8px 12px' }}>
              Could not load station data
            </div>
          </div>
        )}

        {/* Full-screen map */}
        {!mapFailed ? (
          <MapComponent
            stations={stations}
            height="100%"
            onStationClick={handleStationClick}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <EmptyState
              icon="🗺️"
              title="Map unavailable"
              message="Could not load the map. Please use the list view."
              action={<Link to="/stations" className="btn btn-primary btn-sm">View Station List</Link>}
            />
          </div>
        )}

        {/* Bottom sheet for selected station */}
        {selected && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                background: 'rgba(0,0,0,0.2)',
              }}
            />
            {/* Sheet */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 21,
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              padding: '0 16px 24px',
            }}>
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--color-border-dark)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{selected.name}</h3>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.4rem', lineHeight: 1, padding: '0 4px', marginTop: '-2px' }}
                >
                  ×
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', margin: '0 0 4px', color: 'var(--color-text-secondary)' }}>{selected.brand}</p>
              {selected.city && (
                <p style={{ fontSize: '0.85rem', margin: '0 0 2px', color: 'var(--color-text-secondary)' }}>
                  📍 {selected.city}{selected.province ? `, ${selected.province}` : ''}
                </p>
              )}
              {selected.address && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 14px' }}>{selected.address}</p>
              )}
              <Link
                to={`/stations/${selected.id}`}
                className="btn btn-primary btn-full"
                style={{ marginTop: selected.address ? 0 : '14px' }}
              >
                View Prices
              </Link>
            </div>
          </>
        )}
      </div>

      <style>{`
        .map-page-desktop { display: block; }
        .map-page-mobile  { display: none; }

        @media (max-width: 640px) {
          .map-page-desktop { display: none; }
          .map-page-mobile  {
            display: block;
            position: fixed;
            top: var(--header-height);
            bottom: var(--mobile-nav-height);
            left: 0;
            right: 0;
            overflow: hidden;
          }
          .map-page-mobile .maplibregl-map {
            height: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
