"use client";
import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { stadiumNodes } from '../data/stadiumGraph';
import { trackEvent, TelemetryEvents } from '../../lib/analytics';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// MetLife Stadium area (demo placement)
const center = { lat: 40.8128, lng: -74.0742 };

// Dark satellite map style matching Aether HUD theme
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0a0c10' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#00FFFF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1c20' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#00FFFF', lightness: -80 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#07090f' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a1c20' }] },
];

const mapOptions: google.maps.MapOptions = {
  mapTypeId: 'hybrid',
  disableDefaultUI: true,
  zoomControl: true,
  zoomControlOptions: { position: 3 }, // TOP_RIGHT
  tilt: 45,
  heading: 15,
  styles: darkMapStyles,
};

export default function StadiumSatellite() {
  // Uses NEXT_PUBLIC_MAPS_API_KEY (separate from Firebase) or falls back gracefully
  const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const markers = useMemo(() => 
    stadiumNodes.slice(0, 15).map(node => ({
      id: node.id,
      label: node.label,
      severity: node.problemCauses[0]?.severity ?? 'none',
      position: {
        lat: center.lat + (node.y - 50) * 0.00012,
        lng: center.lng + (node.x - 50) * 0.00018,
      },
    })),
  []);

  const loadingEl = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%',
      background: 'radial-gradient(circle at center, #0e1016 0%, #07090f 100%)',
      gap: '16px'
    }}>
      <div style={{
        width: 32, height: 32, border: '2px solid rgba(0,255,255,0.2)',
        borderTop: '2px solid #00FFFF', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ fontFamily: 'var(--font-technical)', fontSize: '0.7rem', color: 'rgba(0,255,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Initializing Satellite Grid...
      </p>
    </div>
  );

  if (loadError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#07090f', gap: '12px', padding: '20px', textAlign: 'center'
      }}>
        <p style={{ fontFamily: 'var(--font-technical)', fontSize: '0.75rem', color: 'rgba(255,0,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          ⚠ Satellite uplink failed — Maps API key required
        </p>
        <p style={{ fontFamily: 'var(--font-technical)', fontSize: '0.6rem', color: 'rgba(185,202,201,0.4)', letterSpacing: '0.08em' }}>
          Set NEXT_PUBLIC_MAPS_API_KEY in .env.local
        </p>
      </div>
    );
  }

  if (!isLoaded) return loadingEl;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={17}
      options={mapOptions}
      onLoad={() => {
        trackEvent(TelemetryEvents.SATELLITE_TOGGLE, { action: 'open' });
      }}
    >
      {markers.map(marker => {
        const color = marker.severity === 'critical' ? '#FF00FF'
          : marker.severity === 'warning' ? '#FBBF24'
          : '#00FFFF';
        return (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.label}
            icon={{
              path: 'M 0,-8 8,8 -8,8 Z',
              fillColor: color,
              fillOpacity: 0.9,
              strokeColor: '#fff',
              strokeWeight: 0.5,
              scale: 1,
            }}
            label={{
              text: marker.label.substring(0, 8),
              color: '#fff',
              fontSize: '9px',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}
          />
        );
      })}
    </GoogleMap>
  );
}
