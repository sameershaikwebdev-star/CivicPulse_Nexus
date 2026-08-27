import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Compass,
  Search,
  Layers,
  Check,
  Loader2,
  Navigation,
  Info,
  Maximize2,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom SVG Pin Icon for Leaflet to eliminate broken asset path issues
const createCustomIcon = (color = "#3b82f6") => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/>
        </filter>
        <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="url(#pinGrad)" filter="url(#shadow)" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#ffffff"/>
      <circle cx="12" cy="12" r="3" fill="${color}"/>
    </svg>
  `;
  return L.divIcon({
    html: svgString,
    className: "custom-gis-pin",
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  });
};

const MAP_LAYERS = {
  street: {
    name: "Standard (Google Style)",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  topo: {
    name: "Terrain / Topo",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  dark: {
    name: "Dark GIS",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
  },
};

export default function GisMapModal({ isOpen, onClose, onSelectLocation, initialCoords }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState("street");
  const [coords, setCoords] = useState(
    initialCoords?.lat && initialCoords?.lng
      ? initialCoords
      : { lat: 20.5937, lng: 78.9629 } // Default center (India) or default location
  );
  const [addressDetails, setAddressDetails] = useState({
    display_name: "",
    road: "",
    suburb: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: false,
      });

      // Add Zoom Control to top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Add Tile Layer
      const initialLayerConfig = MAP_LAYERS[activeLayer];
      const tileLayer = L.tileLayer(initialLayerConfig.url, {
        attribution: initialLayerConfig.attribution,
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Add Marker
      const marker = L.marker([coords.lat, coords.lng], {
        icon: createCustomIcon("#3b82f6"),
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Click to move pin
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        updateLocation(lat, lng, true);
      });

      // Drag pin
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        updateLocation(position.lat, position.lng, false);
      });

      mapInstanceRef.current = map;

      // If initialCoords provided, fetch address immediately
      reverseGeocode(coords.lat, coords.lng);
    } else {
      mapInstanceRef.current.invalidateSize();
    }

    return () => {
      // Cleanup on unmount/close
      if (!isOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle Layer Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayerConfig = MAP_LAYERS[activeLayer];
    const newTileLayer = L.tileLayer(newLayerConfig.url, {
      attribution: newLayerConfig.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // Update Location Helper
  const updateLocation = (lat, lng, panTo = true) => {
    const roundLat = parseFloat(lat.toFixed(6));
    const roundLng = parseFloat(lng.toFixed(6));
    setCoords({ lat: roundLat, lng: roundLng });

    if (markerRef.current) {
      markerRef.current.setLatLng([roundLat, roundLng]);
    }
    if (panTo && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([roundLat, roundLng]);
    }

    reverseGeocode(roundLat, roundLng);
  };

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        setAddressDetails({
          display_name: data.display_name || "",
          road: addr.road || addr.pedestrian || addr.street || "",
          suburb: addr.suburb || addr.neighbourhood || addr.residential || "",
          city: addr.city || addr.town || addr.village || addr.county || "",
          state: addr.state || "",
          postcode: addr.postcode || "",
          country: addr.country || "",
        });
      } else {
        setAddressDetails({
          display_name: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          road: "",
          suburb: "",
          city: "",
          state: "",
          postcode: "",
          country: "",
        });
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setAddressDetails({
        display_name: `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        road: "",
        suburb: "",
        city: "",
        state: "",
        postcode: "",
        country: "",
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Live Location Detection (GPS)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setAddressDetails((prev) => ({
        ...prev,
        display_name: "Geolocation is not supported by your browser.",
      }));
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude, true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(16);
        }
        setIsGeolocating(false);
      },
      (err) => {
        console.error("GPS Error:", err);
        setAddressDetails((prev) => ({
          ...prev,
          display_name: "Failed to retrieve GPS location. Please check browser permissions.",
        }));
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search Address/Landmark via Nominatim
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&addressdetails=1&limit=5`
      );
      const data = await res.json();
      setSearchResults(data || []);
      if (data && data.length > 0) {
        // Automatically jump to top result
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);
        updateLocation(lat, lon, true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(15);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    updateLocation(lat, lon, true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(16);
    }
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
  };

  // Confirm and Pass Location Back
  const handleConfirm = () => {
    let formattedText = "";
    if (addressDetails.display_name) {
      formattedText = addressDetails.display_name;
    } else {
      formattedText = `Lat: ${coords.lat}, Lng: ${coords.lng}`;
    }

    onSelectLocation({
      locationText: formattedText,
      latitude: coords.lat,
      longitude: coords.lng,
      addressDetails,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={modalBackdrop}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={modalCard}
        >
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={iconBadgeStyle}>
                <Compass style={{ color: "#3b82f6" }} size={24} />
              </div>
              <div>
                <h3 style={{ color: "white", margin: 0, fontSize: "20px", fontWeight: 700 }}>
                  Advanced GIS & Location Picker
                </h3>
                <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: "13px" }}>
                  Select exact issue position, search landmarks, or detect GPS
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} style={closeButtonStyle}>
              <X size={20} />
            </button>
          </div>

          {/* Top GIS Toolbar: Search + GPS + Layer Switcher */}
          <div style={toolbarStyle}>
            {/* Search Input */}
            <form onSubmit={handleSearch} style={{ flex: 1, position: "relative" }}>
              <div style={searchBoxStyle}>
                <Search size={18} style={{ color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Search landmark, street, city, or pincode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={searchInputStyle}
                />
                {isSearching ? (
                  <Loader2 size={18} className="animate-spin" style={{ color: "#3b82f6" }} />
                ) : (
                  <button type="submit" style={searchBtnStyle}>
                    Search
                  </button>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div style={dropdownStyle}>
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      style={dropdownItemStyle}
                    >
                      <MapPin size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
                      <span style={{ color: "#e2e8f0", fontSize: "13px" }}>
                        {item.display_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* GPS My Location Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isGeolocating}
              style={gpsButtonStyle}
              title="Detect My Location"
            >
              {isGeolocating ? (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Navigation size={18} />
              )}
              <span>{isGeolocating ? "Locating..." : "GPS Locate"}</span>
            </button>

            {/* Layer Switcher */}
            <div style={{ display: "flex", gap: "6px", background: "rgba(15,23,42,0.8)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
              {Object.keys(MAP_LAYERS).map((layerKey) => (
                <button
                  key={layerKey}
                  type="button"
                  onClick={() => setActiveLayer(layerKey)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: activeLayer === layerKey ? "linear-gradient(90deg,#8b5cf6,#3b82f6)" : "transparent",
                    color: activeLayer === layerKey ? "white" : "#94a3b8",
                    transition: "all 0.2s",
                  }}
                >
                  {MAP_LAYERS[layerKey].name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Map Viewport */}
          <div style={{ position: "relative", width: "100%", height: "420px", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "#aad3df" }}>
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%", background: "#aad3df" }} />

            {/* Floating Banner Instruction */}
            <div style={mapOverlayBadge}>
              <MapPin size={14} style={{ color: "#3b82f6" }} />
              <span>Click or drag pin to choose exact location</span>
            </div>

            {/* Floating GIS Coordinate Overlay */}
            <div style={coordsBadgeStyle}>
              <span>Lat: <strong>{coords.lat.toFixed(5)}°</strong></span>
              <span style={{ margin: "0 6px", color: "rgba(255,255,255,0.3)" }}>|</span>
              <span>Lng: <strong>{coords.lng.toFixed(5)}°</strong></span>
            </div>
          </div>

          {/* Reverse Geocoded Address Details Card */}
          <div style={infoCardStyle}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", color: "#3b82f6", marginTop: "2px" }}>
                {isReverseGeocoding ? (
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <MapPin size={20} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, color: "#3b82f6", marginBottom: "4px" }}>
                  Selected GIS Location
                </div>
                <div style={{ color: "white", fontSize: "14px", fontWeight: 600, lineHeight: 1.4 }}>
                  {addressDetails.display_name || `Coordinates: ${coords.lat}, ${coords.lng}`}
                </div>
                {addressDetails.city || addressDetails.state ? (
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                    {[addressDetails.suburb, addressDetails.city, addressDetails.state, addressDetails.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} style={confirmButtonStyle}>
              <Check size={18} />
              Confirm & Set GIS Location
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ---------------- Inline Styles ---------------- */
const modalBackdrop = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(2, 6, 23, 0.85)",
  backdropFilter: "blur(12px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99999,
  padding: "20px",
};

const modalCard = {
  width: "100%",
  maxWidth: "960px",
  maxHeight: "92vh",
  overflowY: "auto",
  background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const iconBadgeStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "rgba(59, 130, 246, 0.15)",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const closeButtonStyle = {
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "#94a3b8",
  borderRadius: "12px",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s",
};

const toolbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const searchBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "14px",
  padding: "8px 14px",
};

const searchInputStyle = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: "14px",
  outline: "none",
};

const searchBtnStyle = {
  background: "rgba(59, 130, 246, 0.2)",
  border: "1px solid rgba(59, 130, 246, 0.4)",
  color: "#60a5fa",
  padding: "6px 14px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const dropdownStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  background: "#0f172a",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "14px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
  zIndex: 1000,
  maxHeight: "220px",
  overflowY: "auto",
};

const dropdownItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 14px",
  cursor: "pointer",
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  transition: "background 0.2s",
};

const gpsButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))",
  border: "1px solid rgba(6, 182, 212, 0.4)",
  color: "#38bdf8",
  padding: "10px 16px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const mapOverlayBadge = {
  position: "absolute",
  top: "14px",
  left: "14px",
  zIndex: 1000,
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "30px",
  padding: "6px 14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
  fontWeight: 500,
};

const coordsBadgeStyle = {
  position: "absolute",
  bottom: "14px",
  left: "14px",
  zIndex: 1000,
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  borderRadius: "10px",
  padding: "6px 12px",
  color: "#60a5fa",
  fontSize: "12px",
  fontFamily: "monospace",
};

const infoCardStyle = {
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  padding: "16px",
};

const footerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "12px",
};

const cancelButtonStyle = {
  background: "rgba(255, 255, 255, 0.06)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "#94a3b8",
  padding: "12px 20px",
  borderRadius: "14px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const confirmButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "linear-gradient(90deg, #8b5cf6, #2563eb)",
  border: "none",
  color: "white",
  padding: "12px 24px",
  borderRadius: "14px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 20px -5px rgba(59, 130, 246, 0.4)",
};
