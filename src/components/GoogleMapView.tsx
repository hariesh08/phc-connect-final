import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    initGoogleMap?: () => void;
  }
}

interface PhcMarker {
  id: string;
  name: string;
  code: string;
  address?: string;
  latitude: number;
  longitude: number;
  status: string;
  doctors_count: number;
  attendance_percent: number;
}

interface GoogleMapProps {
  phcs: PhcMarker[];
  searchQuery: string;
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) { resolve(); return; }
    const existing = document.getElementById("google-maps-script");
    if (existing) { existing.addEventListener("load", () => resolve()); return; }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    window.initGoogleMap = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

const GREEN_MARKER = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
const RED_MARKER = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";

export default function GoogleMapView({ phcs, searchQuery }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapError, setMapError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAP_KEY || "";

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) { setMapError("Google Maps API key not configured. Add VITE_GOOGLE_MAP_KEY to .env"); return; }
    loadGoogleMapsScript(apiKey)
      .then(() => setLoaded(true))
      .catch(() => setMapError("Failed to load Google Maps. Check your API key."));
  }, [apiKey]);

  // Initialize map + markers
  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    const validPhcs = phcs.filter(p => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude));

    // Default center: first PHC or India center
    const center = validPhcs.length > 0
      ? { lat: validPhcs[0].latitude, lng: validPhcs[0].longitude }
      : { lat: 20.5937, lng: 78.9629 };

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 11,
        mapTypeId: "roadmap",
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: false,
      });
    }

    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current || new google.maps.InfoWindow();
    infoWindowRef.current = infoWindow;

    // Clear old markers & circles
    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    if (validPhcs.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    validPhcs.forEach(phc => {
      const pos = { lat: phc.latitude, lng: phc.longitude };
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: phc.name,
        icon: phc.status === "Active" ? GREEN_MARKER : RED_MARKER,
        animation: google.maps.Animation.DROP,
      });

      // 100m radius circle
      const circle = new google.maps.Circle({
        map,
        center: pos,
        radius: 100,
        fillColor: phc.status === "Active" ? "#22c55e" : "#ef4444",
        fillOpacity: 0.08,
        strokeColor: phc.status === "Active" ? "#22c55e" : "#ef4444",
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });

      marker.addListener("click", () => {
        infoWindow.setContent(`
          <div style="font-family:system-ui;min-width:200px;padding:4px">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px">${phc.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px;font-family:monospace">${phc.code}</div>
            ${phc.address ? `<div style="font-size:12px;color:#555;margin-bottom:6px">📍 ${phc.address}</div>` : ""}
            <div style="display:flex;gap:12px;font-size:12px;margin-bottom:6px">
              <span>👨‍⚕️ Doctors: <b>${phc.doctors_count}</b></span>
              <span>📊 Attendance: <b>${phc.attendance_percent}%</b></span>
            </div>
            <div style="font-size:11px;padding:2px 8px;border-radius:9999px;display:inline-block;background:${phc.status === "Active" ? "#dcfce7" : "#fee2e2"};color:${phc.status === "Active" ? "#16a34a" : "#dc2626"}">${phc.status}</div>
          </div>
        `);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      circlesRef.current.push(circle);
    });

    // Fit bounds to show all markers
    if (validPhcs.length > 1) {
      map.fitBounds(bounds, 60);
    } else {
      map.setCenter(bounds.getCenter());
      map.setZoom(14);
    }
  }, [loaded, phcs]);

  // Search: zoom to matching PHC
  useEffect(() => {
    if (!searchQuery || !mapInstanceRef.current || !loaded) return;
    const q = searchQuery.toLowerCase();
    const match = phcs.find(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    if (match && match.latitude && match.longitude) {
      mapInstanceRef.current.panTo({ lat: match.latitude, lng: match.longitude });
      mapInstanceRef.current.setZoom(15);
      // Open info window for matched marker
      const idx = phcs.indexOf(match);
      if (markersRef.current[idx]) {
        google.maps.event.trigger(markersRef.current[idx], "click");
      }
    }
  }, [searchQuery, phcs, loaded]);

  if (mapError) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-sm text-destructive">{mapError}</p>
        <p className="text-xs text-muted-foreground mt-2">Set VITE_GOOGLE_MAP_KEY in your .env file</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden border border-border/30"
      style={{ height: 500 }}
    />
  );
}
