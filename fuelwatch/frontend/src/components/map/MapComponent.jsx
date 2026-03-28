import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_CENTER = [
  parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '121.7270'),
  parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '17.6132'),
];
const DEFAULT_ZOOM = parseFloat(import.meta.env.VITE_MAP_DEFAULT_ZOOM || '13');
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '© OpenStreetMap Contributors';

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [TILE_URL],
      tileSize: 256,
      attribution: TILE_ATTRIBUTION,
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

/**
 * Reusable MapLibre map component.
 * @param {Array} stations - Array of station objects with latitude, longitude, id, name, brand
 * @param {Function} onStationClick - Called with station when a marker is clicked
 * @param {string} height - CSS height of the map container
 * @param {Array} center - [lng, lat] override
 * @param {number} zoom - Zoom level override
 */
export default function MapComponent({ stations = [], onStationClick, height = '500px', center, zoom }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapRef.current) return; // Already initialized

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: center || DEFAULT_CENTER,
      zoom: zoom || DEFAULT_ZOOM,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update markers when stations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      if (!station.latitude || !station.longitude) return;

      // Custom marker element
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.cssText = `
        width: 32px; height: 32px;
        background: #2563eb;
        border: 2.5px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: background 0.15s;
      `;
      el.onmouseenter = () => { el.style.background = '#1d4ed8'; };
      el.onmouseleave = () => { el.style.background = '#2563eb'; };

      const popup = new maplibregl.Popup({ offset: 25, closeButton: true, maxWidth: '260px' })
        .setHTML(`
          <div style="font-family:inherit">
            <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px">${station.name}</div>
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:8px">${station.brand || ''} · ${station.barangay || ''}</div>
            <a href="/stations/${station.id}" style="color:#2563eb;font-size:0.85rem;font-weight:600">View details →</a>
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([station.longitude, station.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      if (onStationClick) {
        el.addEventListener('click', () => onStationClick(station));
      }

      markersRef.current.push(marker);
    });
  }, [stations, onStationClick]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    />
  );
}
