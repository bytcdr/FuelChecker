import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import StationCard from '../components/stations/StationCard.jsx';
import StationFilters from '../components/stations/StationFilters.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import CityAutocomplete from '../components/common/CityAutocomplete.jsx';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [cityInput, setCityInput]         = useState(searchParams.get('city') || '');
  const [submittedCity, setSubmittedCity] = useState(searchParams.get('city') || '');
  const [activeBrand, setActiveBrand]     = useState(searchParams.get('brand') || '');

  const [stations, setStations]       = useState([]);
  const [loading, setLoading]         = useState(!!searchParams.get('city'));
  const [error, setError]             = useState('');
  const [hasSearched, setHasSearched] = useState(!!searchParams.get('city'));

  const inputRef = useRef(null);

  const doFetch = useCallback((city, brand) => {
    if (!city) return;
    setLoading(true);
    setError('');
    const params = { city };
    if (brand) params.brand = brand;
    setSearchParams({ city, ...(brand ? { brand } : {}) });
    stationsApi.getAll(params)
      .then((data) => setStations(data.stations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [setSearchParams]);

  // Initial fetch if URL already has city
  useEffect(() => {
    if (submittedCity) doFetch(submittedCity, activeBrand);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((cityOverride) => {
    const city = (cityOverride ?? cityInput).trim();
    if (!city) { inputRef.current?.focus(); return; }
    setCityInput(city);
    setSubmittedCity(city);
    setHasSearched(true);
    doFetch(city, activeBrand);
  }, [cityInput, activeBrand, doFetch]);

  const handleBrandChange = (brand) => {
    setActiveBrand(brand);
    if (submittedCity) doFetch(submittedCity, brand);
  };

  const handleClear = () => {
    setCityInput('');
    setSubmittedCity('');
    setActiveBrand('');
    setStations([]);
    setHasSearched(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  return (
    <div className="page">
      <div className="container">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <div>
            <h1>Fuel Stations</h1>
            <p style={{ marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Regions I, II &amp; CAR
              {hasSearched && !loading && (
                <> · <strong>{stations.length}</strong> station{stations.length !== 1 ? 's' : ''} found
                  {submittedCity && <> in <strong>{submittedCity}</strong></>}
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <CityAutocomplete
              value={cityInput}
              onChange={setCityInput}
              onSearch={handleSearch}
              inputRef={inputRef}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0, padding: '0 24px' }}>
              Search
            </button>
            {hasSearched && (
              <button type="button" className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
        </form>

        {/* ── Brand filter — shown after a search ──────────────────────── */}
        {hasSearched && (
          <div className="card" style={{ marginBottom: '20px', padding: '14px 16px' }}>
            <StationFilters activeBrand={activeBrand} onChange={handleBrandChange} />
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        {/* ── States ───────────────────────────────────────────────────── */}
        {!hasSearched ? (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⛽</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>Find Fuel Stations Near You</h3>
            <p style={{ fontSize: '0.95rem', maxWidth: '360px', margin: '0 auto' }}>
              Type a town or city above to see all stations and their current fuel prices.
            </p>
          </div>
        ) : loading ? (
          <LoadingSpinner />
        ) : stations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--color-text)' }}>No stations found</h3>
            <p style={{ fontSize: '0.9rem' }}>
              No {activeBrand ? `${activeBrand} ` : ''}stations found in <strong>{submittedCity}</strong>.
              {activeBrand && (
                <> <button className="btn btn-sm btn-secondary" style={{ marginLeft: '8px' }} onClick={() => handleBrandChange('')}>Clear brand filter</button></>
              )}
            </p>
          </div>
        ) : (
          <div className="grid-3">
            {stations.map((s) => <StationCard key={s.id} station={s} />)}
          </div>
        )}

      </div>
    </div>
  );
}
