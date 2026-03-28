import React, { useState, useEffect } from 'react';
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

  if (loading) return <div className="page"><div className="container"><LoadingSpinner /></div></div>;

  return (
    <div className="page" style={{ paddingTop: '24px' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <h1>Station Map</h1>
            <p style={{ marginTop: '4px' }}>{stations.length} stations in Tuguegarao City</p>
          </div>
          <Link to="/stations" className="btn btn-secondary btn-sm">📋 List View</Link>
        </div>

        {error && (
          <div className="alert alert-warning">
            Could not load station data: {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: '16px', alignItems: 'start' }}>
          <div>
            {!mapFailed ? (
              <div className="card" style={{ padding: '8px' }}>
                <MapComponent
                  stations={stations}
                  height="580px"
                  onStationClick={(s) => setSelected(s)}
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.2rem', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>{selected.brand}</p>
              {selected.barangay && <p style={{ fontSize: '0.85rem' }}>📍 {selected.barangay}</p>}
              {selected.address && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{selected.address}</p>}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to={`/stations/${selected.id}`} className="btn btn-primary btn-sm btn-full">
                  View Prices
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Fallback list */}
        <details style={{ marginTop: '24px' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
            📋 Show Station List
          </summary>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {stations.map((s) => (
              <Link key={s.id} to={`/stations/${s.id}`} className="card card-hover" style={{ padding: '12px', textDecoration: 'none' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{s.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.brand} · {s.barangay}</div>
              </Link>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
