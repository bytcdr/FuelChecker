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
  sources: { osm: { type: 'raster', tiles: [TILE_URL], tileSize: 256, attribution: TILE_ATTRIBUTION, maxzoom: 19 } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// ─── Brand → marker colour ────────────────────────────────────────────────────
const BRAND_COLORS = {
  'Petron':     '#E31837',
  'Shell':      '#FFC200',
  'Caltex':     '#003087',
  'Phoenix':    '#FF6600',
  'Flying V':   '#008000',
  'PTT':        '#00A650',
  'Seaoil':     '#0055AA',
  'Jetti':      '#9B1C1C',
  'Total':      '#EF3A1D',
  'Clean Fuel': '#059669',
  'Unioil':     '#7C3AED',
};

function brandColor(brand) {
  if (!brand) return '#2563eb';
  for (const [key, color] of Object.entries(BRAND_COLORS)) {
    if (brand.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#2563eb';
}

// ─── Geographic circle polygon (approximation with N segments) ────────────────
function geographicCircle(centerLng, centerLat, radiusKm, segments = 64) {
  const R   = 6371;          // Earth radius km
  const lat = (centerLat * Math.PI) / 180;
  const lng = (centerLng * Math.PI) / 180;
  const d   = radiusKm / R;
  const coords = [];

  for (let i = 0; i <= segments; i++) {
    const bearing = (2 * Math.PI * i) / segments;
    const pLat = Math.asin(
      Math.sin(lat) * Math.cos(d) +
      Math.cos(lat) * Math.sin(d) * Math.cos(bearing),
    );
    const pLng =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
        Math.cos(d) - Math.sin(lat) * Math.sin(pLat),
      );
    coords.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI]);
  }

  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } };
}

/**
 * Reusable MapLibre map component.
 *
 * Props:
 *   stations        – array of station objects
 *   onStationClick  – called with station when a marker is clicked
 *   height          – CSS height string
 *   center          – [lng, lat] override
 *   zoom            – zoom override
 *   radiusCircle    – { center: [lng, lat], radiusKm: number } | null
 *   userLocation    – [lng, lat] | null   (shown as a blue dot)
 *   selectedId      – id of currently selected station (marker highlighted)
 */
export default function MapComponent({
  stations = [],
  onStationClick,
  height = '500px',
  center,
  zoom,
  radiusCircle,
  userLocation,
  selectedId,
}) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef([]);
  const userMarkerRef   = useRef(null);

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: center || DEFAULT_CENTER,
      zoom: zoom || DEFAULT_ZOOM,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    // Prepare radius circle sources/layers once map loads
    mapRef.current.on('load', () => {
      mapRef.current.addSource('radius-fill', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      mapRef.current.addSource('radius-outline', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      mapRef.current.addSource('user-loc', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      mapRef.current.addLayer({ id: 'radius-fill-layer',    type: 'fill',   source: 'radius-fill',    paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.07 } });
      mapRef.current.addLayer({ id: 'radius-outline-layer', type: 'line',   source: 'radius-outline', paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [4, 3] } });
      mapRef.current.addLayer({ id: 'user-loc-layer',       type: 'circle', source: 'user-loc',       paint: { 'circle-radius': 9, 'circle-color': '#2563eb', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#fff', 'circle-opacity': 0.9 } });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Radius circle ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const fillSrc    = map.getSource('radius-fill');
    const outlineSrc = map.getSource('radius-outline');
    if (!fillSrc || !outlineSrc) return;

    if (radiusCircle && radiusCircle.radiusKm > 0) {
      const [lng, lat] = radiusCircle.center;
      const feature    = geographicCircle(lng, lat, radiusCircle.radiusKm);
      const fc         = { type: 'FeatureCollection', features: [feature] };
      fillSrc.setData(fc);
      outlineSrc.setData(fc);
    } else {
      const empty = { type: 'FeatureCollection', features: [] };
      fillSrc.setData(empty);
      outlineSrc.setData(empty);
    }
  }, [radiusCircle]);

  // ── User location dot ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const src = map.getSource('user-loc');
    if (!src) return;

    if (userLocation) {
      src.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: userLocation } }],
      });
    } else {
      src.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [userLocation]);

  // ── Station markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      if (!station.latitude || !station.longitude) return;

      const isSelected = station.id === selectedId;
      const color      = brandColor(station.brand);

      const el = document.createElement('div');
      el.setAttribute('data-station-id', station.id);
      el.style.cssText = `
        width: ${isSelected ? '36px' : '28px'};
        height: ${isSelected ? '36px' : '28px'};
        background: ${color};
        border: ${isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.9)'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        cursor: pointer;
        box-shadow: 0 2px ${isSelected ? '12px' : '6px'} rgba(0,0,0,${isSelected ? '0.45' : '0.25'});
        transition: all 0.15s ease;
        z-index: ${isSelected ? 10 : 1};
      `;
      el.onmouseenter = () => {
        el.style.transform = 'rotate(-45deg) scale(1.2)';
        el.style.zIndex = '10';
      };
      el.onmouseleave = () => {
        el.style.transform = 'rotate(-45deg) scale(1)';
        el.style.zIndex = isSelected ? '10' : '1';
      };

      const popup = new maplibregl.Popup({ offset: 28, closeButton: true, maxWidth: '280px' })
        .setHTML(`
          <div style="font-family:inherit;padding:2px 0">
            <div style="font-weight:700;font-size:0.93rem;margin-bottom:3px;color:#111">${station.name}</div>
            <div style="font-size:0.78rem;color:#64748b;margin-bottom:8px">${[station.brand, station.barangay].filter(Boolean).join(' · ')}</div>
            <a href="/stations/${station.id}"
               style="display:inline-block;background:${color};color:#fff;font-size:0.8rem;font-weight:600;padding:4px 12px;border-radius:6px;text-decoration:none">
              View Prices →
            </a>
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([station.longitude, station.latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      if (onStationClick) el.addEventListener('click', () => onStationClick(station));

      markersRef.current.push(marker);
    });
  }, [stations, onStationClick, selectedId]);

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} />
  );
}
