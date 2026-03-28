import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import StationCard from '../components/stations/StationCard.jsx';
import StationFilters from '../components/stations/StationFilters.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function StationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stations, setStations] = useState([]);
  const [brands, setBrands] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    barangay: searchParams.get('barangay') || '',
  });

  useEffect(() => {
    Promise.all([stationsApi.getBrands(), stationsApi.getBarangays()])
      .then(([b, bar]) => { setBrands(b.brands); setBarangays(bar.barangays); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.brand) params.brand = filters.brand;
    if (filters.barangay) params.barangay = filters.barangay;

    setSearchParams(params);

    stationsApi.getAll(params)
      .then((data) => setStations(data.stations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="page">
      <div className="container">
        <div className="section-header">
          <div>
            <h1>Fuel Stations</h1>
            <p style={{ marginTop: '4px' }}>Tuguegarao, Cagayan · {!loading && `${stations.length} stations found`}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SearchBar
              value={filters.search}
              onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
              placeholder="Search station name, brand, or barangay..."
            />
            <StationFilters
              filters={filters}
              onChange={setFilters}
              brands={brands}
              barangays={barangays}
            />
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <LoadingSpinner />
        ) : stations.length === 0 ? (
          <EmptyState
            icon="⛽"
            title="No stations found"
            message="Try adjusting your search or filters."
            action={
              <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ search: '', brand: '', barangay: '' })}>
                Clear All Filters
              </button>
            }
          />
        ) : (
          <div className="grid-3">
            {stations.map((s) => <StationCard key={s.id} station={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
