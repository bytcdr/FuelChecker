import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_CENTER = [
  parseFloat(import.meta.env.VITE_MAP_CENTER_LNG || '121.0000'),
  parseFloat(import.meta.env.VITE_MAP_CENTER_LAT || '17.5000'),
];
const DEFAULT_ZOOM = parseFloat(import.meta.env.VITE_MAP_DEFAULT_ZOOM || '8');
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
  fitBounds,      // [[west, south], [east, north]] — when set, map fits to these bounds
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
    // ScaleControl removed — a fixed radius badge is shown instead

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

  // ── Fly to new centre/zoom when props change after init ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.flyTo({ center, zoom: zoom || DEFAULT_ZOOM, speed: 1.4 });
  }, [center, zoom]);

  // ── Fit map to a bounding box (e.g. after city search) ───────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitBounds) return;
    map.fitBounds(fitBounds, { padding: 60, maxZoom: 14, duration: 800 });
  }, [fitBounds]);

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
      const size       = isSelected ? 1.25 : 1;

      // ── Marker element: bare container — MapLibre owns its style.transform ──
      // We NEVER touch el.style.transform; MapLibre overwrites it every frame
      // with translate() positioning. All visual effects go on `wrapper` below.
      const el = document.createElement('div');
      el.setAttribute('data-station-id', station.id);
      el.style.cssText = `width: 28px; height: 38px; cursor: pointer;`;

      // ── Child wrapper: we own this — scale, shadow, transitions live here ──
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        width: 28px;
        height: 38px;
        transform: scale(${size});
        transform-origin: center bottom;
        transition: transform 0.15s ease, filter 0.15s ease;
        will-change: transform;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
      `;
      wrapper.innerHTML = `
        <svg width="28" height="38" viewBox="0 0 28 38" style="overflow:visible;display:block">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 7.732 14 24 14 24s14-16.268 14-24C28 6.268 21.732 0 14 0z"
                fill="${color}" stroke="rgba(255,255,255,0.92)" stroke-width="2"/>
          <circle cx="14" cy="14" r="5" fill="white" opacity="0.85"/>
        </svg>`;
      el.appendChild(wrapper);

      el.onmouseenter = () => {
        wrapper.style.transform = 'scale(1.3)';
        wrapper.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.45))';
      };
      el.onmouseleave = () => {
        wrapper.style.transform = `scale(${size})`;
        wrapper.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))';
      };

      const locationLine = [station.city, station.province].filter(Boolean).join(', ');
      const popup = new maplibregl.Popup({
        offset: 40, closeButton: true, maxWidth: '300px', closeOnClick: false,
      }).setHTML(`
        <div style="font-family:inherit;padding:4px 2px 2px">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
            <span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block"></span>
            <span style="font-weight:700;font-size:1rem;color:#111;line-height:1.2">${station.name}</span>
          </div>
          ${station.brand ? `<span style="display:inline-block;background:${color};color:#fff;font-size:0.78rem;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:10px">${station.brand}</span>` : ''}
          ${locationLine ? `<div style="font-size:0.83rem;color:#64748b;margin-bottom:3px">${locationLine}</div>` : ''}
          ${station.street ? `<div style="font-size:0.83rem;color:#64748b;margin-bottom:12px">${station.street}</div>` : '<div style="margin-bottom:12px"></div>'}
          <a href="/stations/${station.id}"
             style="display:block;text-align:center;background:#3b82f6;color:#fff;font-size:0.88rem;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none;letter-spacing:0.01em">
            View Prices →
          </a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([station.longitude, station.latitude])
        .addTo(mapRef.current);

      // ── Show popup on hover; keep open while mouse is over popup ───────────
      let closeTimer = null;

      const showPopup = () => {
        clearTimeout(closeTimer);
        if (!popup.isOpen()) {
          popup.setLngLat([station.longitude, station.latitude]).addTo(mapRef.current);
        }
      };

      const scheduleClose = () => {
        closeTimer = setTimeout(() => { if (popup.isOpen()) popup.remove(); }, 220);
      };

      el.addEventListener('mouseenter', showPopup);
      el.addEventListener('mouseleave', scheduleClose);

      popup.on('open', () => {
        const popupEl = popup.getElement();
        if (popupEl) {
          popupEl.addEventListener('mouseenter', () => clearTimeout(closeTimer));
          popupEl.addEventListener('mouseleave', scheduleClose);
        }
      });

      if (onStationClick) el.addEventListener('click', () => onStationClick(station));

      markersRef.current.push(marker);
    });
  }, [stations, onStationClick, selectedId]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} />
      {radiusCircle && radiusCircle.radiusKm > 0 && (
        <div style={{
          position: 'absolute', bottom: '10px', left: '10px',
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
          border: '1.5px solid #2563eb', borderRadius: '999px',
          padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700,
          color: '#2563eb', pointerEvents: 'none', zIndex: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        }}>
          📍 {radiusCircle.radiusKm} km radius
        </div>
      )}
    </div>
  );
}
