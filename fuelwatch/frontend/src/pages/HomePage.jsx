import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import StationCard from '../components/stations/StationCard.jsx';
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
        padding: 'clamp(32px, 8vw, 64px) 0',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', marginBottom: '12px' }}>⛽</div>
          <h1 style={{
            color: '#fff',
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            marginBottom: '12px',
            lineHeight: 1.2,
          }}>
            GasTolina
          </h1>
          <p style={{
            color: '#bfdbfe',
            fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
            maxWidth: '520px',
            margin: '0 auto 28px',
          }}>
            Community-powered fuel price tracking for Regions I, II &amp; CAR.
            Find the best prices near you.
          </p>
          <form onSubmit={handleSearch} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '480px',
            margin: '0 auto',
          }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search stations or brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.95)' }}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}>
            {[
              { to: '/stations', label: 'Browse Stations' },
              { to: '/map', label: '🗺️ View Map' },
              { to: '/submit-price', label: '📝 Submit a Price' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="btn"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  flex: '1 1 130px',
                  minWidth: '130px',
                  maxWidth: '180px',
                  textAlign: 'center',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 0',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(16px, 5vw, 48px)',
          flexWrap: 'wrap',
        }}>
          {[
            { icon: '⛽', label: 'Active Stations', value: featuredStations.length > 0 ? '15+' : '—' },
            { icon: '💰', label: 'Fuel Products', value: '5' },
            { icon: '📍', label: 'Regions', value: 'I, II & CAR' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '1.4rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-text)' }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</div>
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
      <section style={{
        background: 'var(--color-surface)',
        padding: 'clamp(32px, 6vw, 48px) 0',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '28px' }}>How GasTolina Works</h2>
          <div className="grid-3">
            {[
              { icon: '🔍', title: 'Browse Stations', desc: 'Find fuel stations in Regions I, II & CAR on the map or in the list view.' },
              { icon: '📋', title: 'Check Prices', desc: 'See the latest community-reported prices for each fuel type.' },
              { icon: '📝', title: 'Contribute', desc: 'Register and submit price updates at your local station.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.25rem', marginBottom: '10px' }}>{icon}</div>
                <h3 style={{ marginBottom: '6px' }}>{title}</h3>
                <p style={{ fontSize: '0.9rem' }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <Link to="/register" className="btn btn-primary">Join the Community</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
