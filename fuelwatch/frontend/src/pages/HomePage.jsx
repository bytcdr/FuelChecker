import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import StationCard from '../components/stations/StationCard.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function HomePage() {
  const [featuredStations, setFeaturedStations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stationsApi.getAll()
      .then((data) => setFeaturedStations(data.stations.slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    window.location.href = `/stations?search=${encodeURIComponent(search)}`;
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)',
        color: '#fff',
        padding: '64px 0',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⛽</div>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '12px' }}>
            FuelWatch Tuguegarao
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: '1.15rem', maxWidth: '520px', margin: '0 auto 32px' }}>
            Community-powered fuel price tracking for Tuguegarao, Cagayan.
            Find the best prices near you.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '480px', margin: '0 auto' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search stations, brands, or barangay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.95)' }}
            />
            <button type="submit" className="btn btn-secondary" style={{ flexShrink: 0 }}>Search</button>
          </form>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
            <Link to="/stations" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)' }}>
              Browse Stations
            </Link>
            <Link to="/map" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)' }}>
              🗺️ View Map
            </Link>
            <Link to="/login" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)' }}>
              📝 Submit a Price
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { icon: '⛽', label: 'Active Stations', value: featuredStations.length > 0 ? '15+' : '—' },
            { icon: '💰', label: 'Fuel Products', value: '5' },
            { icon: '👥', label: 'City', value: 'Tuguegarao' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text)' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Stations */}
      <section className="page">
        <div className="container">
          <div className="section-header">
            <h2>Nearby Stations</h2>
            <Link to="/stations" className="btn btn-secondary btn-sm">View All →</Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid-3">
              {featuredStations.map((station) => (
                <StationCard key={station.id} station={station} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--color-surface)', padding: '48px 0', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>How FuelWatch Works</h2>
          <div className="grid-3">
            {[
              { icon: '🔍', title: 'Browse Stations', desc: 'Find fuel stations in Tuguegarao on the map or in the list view.' },
              { icon: '📋', title: 'Check Prices', desc: 'See the latest community-reported prices for each fuel type.' },
              { icon: '📝', title: 'Contribute', desc: 'Sign in with Google, Facebook, or Apple and submit price updates at your local station.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{icon}</div>
                <h3 style={{ marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem' }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/register" className="btn btn-primary">Join the Community</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
