import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

// Create colored marker icons based on issue status
const getMarkerIcon = (status, category) => {
  let color = '#ef4444'; // Red for Reported
  if (status === 'Verified') color = '#f59e0b'; // Amber for Verified
  if (status === 'In Progress') color = '#6366f1'; // Indigo for In Progress
  if (status === 'Resolved') color = '#10b981'; // Green for Resolved

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color}; 
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        border: 2px solid #fff; 
        box-shadow: 0 0 10px ${color};
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

// Simple active marker icon for adding new reports
const activeReportIcon = L.divIcon({
  className: 'custom-active-pin',
  html: `
    <div style="
      background-color: #0ea5e9; 
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      border: 3px solid #fff; 
      box-shadow: 0 0 12px #0ea5e9;
      animation: pulsePin 1.5s infinite;
    "></div>
    <style>
      @keyframes pulsePin {
        0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
        100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Custom Hotspot icon for AI predictive hotspots
const hotspotIcon = L.divIcon({
  className: 'custom-hotspot-pin',
  html: `
    <div style="
      background-color: #ef4444; 
      width: 24px; 
      height: 24px; 
      border-radius: 50%; 
      border: 3px solid #fff; 
      box-shadow: 0 0 15px #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 11px;
      animation: pulseHotspot 1.2s infinite;
      cursor: pointer;
    ">🔥</div>
    <style>
      @keyframes pulseHotspot {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8); }
        70% { transform: scale(1.15); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle map clicks for coordinate selection
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker position={position} icon={activeReportIcon} />
  ) : null;
};

// Component to pan/zoom map dynamically to selected locations
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const MapComponent = ({ 
  issues = [], 
  hotspots = [],
  clickable = false, 
  onLocationSelect = null, 
  center = [12.9716, 77.5946], // Bangalore center coordinates default
  zoom = 13 
}) => {
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Trigger callback when location is clicked/selected
  const handlePositionChange = (pos) => {
    setSelectedPosition(pos);
    if (onLocationSelect) {
      onLocationSelect(pos[0], pos[1]);
    }
  };

  return (
    <div style={{ height: '450px', width: '100%', position: 'relative' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Display multiple issue reports */}
        {!clickable && issues.map((issue) => (
          <Marker 
            key={issue._id} 
            position={[issue.latitude, issue.longitude]} 
            icon={getMarkerIcon(issue.status, issue.category)}
          >
            <Popup>
              <div style={{ padding: '0.2rem' }}>
                <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.3rem 0', color: '#fff' }}>{issue.title}</h4>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: 'rgba(255,255,255,0.08)', 
                    padding: '2px 6px', 
                    borderRadius: '8px' 
                  }}>
                    {issue.category}
                  </span>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: issue.severity === 'Critical' || issue.severity === 'High' ? 'var(--color-danger)' : 'var(--color-warning)'
                  }}>
                    {issue.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                  {issue.description.substring(0, 80)}...
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    color: issue.status === 'Resolved' ? 'var(--color-secondary)' : 'var(--color-warning)' 
                  }}>
                    {issue.status}
                  </span>
                  <Link 
                    to={`/issues/${issue._id}`} 
                    style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-primary)', 
                      textDecoration: 'none', 
                      fontWeight: 600 
                    }}
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Display predictive hotspots */}
        {!clickable && hotspots && hotspots.map((hotspot, idx) => (
          <React.Fragment key={`hotspot-${idx}`}>
            <Circle 
              center={[hotspot.latitude, hotspot.longitude]} 
              radius={200} 
              pathOptions={{
                color: hotspot.riskLevel === 'High Risk' ? '#ef4444' : '#f59e0b',
                fillColor: hotspot.riskLevel === 'High Risk' ? '#ef4444' : '#f59e0b',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '5, 5'
              }}
            />
            <Marker 
              position={[hotspot.latitude, hotspot.longitude]} 
              icon={hotspotIcon}
            >
              <Popup>
                <div style={{ padding: '0.2rem' }}>
                  <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.3rem 0', color: 'var(--color-danger)' }}>
                    🔥 AI PREDICTIVE HOTSPOT
                  </h4>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      color: 'var(--color-danger)',
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      fontWeight: 600
                    }}>
                      {hotspot.riskLevel}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: 'rgba(255,255,255,0.08)', 
                      padding: '2px 8px', 
                      borderRadius: '10px' 
                    }}>
                      {hotspot.count} Reports
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0', lineHeight: '1.4' }}>
                    AI analysis predicts high density of local issues. Primary concern: <strong>{hotspot.dominantCategory}</strong>.
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                    Coordinates: {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                  </span>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Clickable report map mode */}
        {clickable && (
          <LocationMarker 
            position={selectedPosition} 
            setPosition={handlePositionChange} 
          />
        )}
      </MapContainer>
      
      {clickable && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          right: '10px',
          background: 'rgba(18, 24, 38, 0.9)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          zIndex: 1000,
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          Tap anywhere on the map to pin the issue location coordinates
        </div>
      )}
    </div>
  );
};

export default MapComponent;
