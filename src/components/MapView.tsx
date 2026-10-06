import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  GNSilenceEvaluation,
  IncidentCase,
  TriageQueue,
  UILanguage,
} from '../types';
import {
  UI_TRANSLATIONS,
  getQueueLabel,
  localizeCaseReason,
  localizeLocationSource,
  localizePlace,
  tr,
} from '../lib/i18n';

interface MapViewProps {
  lang?: UILanguage;
  cases?: IncidentCase[];
  quietAreas?: GNSilenceEvaluation[];
  selectedCaseId?: string | null;
  onSelectCase?: (caseId: string) => void;
  onSelectQuietArea?: (gnId: string) => void;
  pinPickerMode?: boolean;
  pickedPin?: { lat: number; lng: number } | null;
  onPickPin?: (coords: { lat: number; lng: number }) => void;
  heightClass?: string;
}

const QUEUE_HEX: Record<TriageQueue, string> = {
  act_now: '#DC2626', // red-600
  verify_fast: '#D97706', // amber-600
  watch: '#475569', // slate-600
};

const QUEUE_LABEL: Record<TriageQueue, string> = {
  act_now: 'ACT NOW',
  verify_fast: 'VERIFY FAST',
  watch: 'WATCH',
};

export const MapView: React.FC<MapViewProps> = ({
  lang = 'en',
  cases = [],
  quietAreas = [],
  selectedCaseId,
  onSelectCase,
  onSelectQuietArea,
  pinPickerMode = false,
  pickedPin = null,
  onPickPin,
  heightClass = 'h-[520px]',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const isMapReadyAndVisible = (
    mapInstance: L.Map | null,
    el: HTMLDivElement | null
  ): mapInstance is L.Map => {
    if (!mapInstance || !el || !el.isConnected) return false;
    const internal = mapInstance as unknown as {
      _loaded?: boolean;
      _mapPane?: HTMLElement;
    };
    if (!internal._loaded || !internal._mapPane) return false;
    return el.clientWidth > 0 && el.clientHeight > 0;
  };

  const fitMapToCases = (mapInstance: L.Map, caseList: IncidentCase[]) => {
    if (pinPickerMode) return;
    if (!isMapReadyAndVisible(mapInstance, containerRef.current)) return;

    const validCoords: L.LatLngExpression[] = caseList
      .filter(
        (c) =>
          typeof c.lat === 'number' &&
          typeof c.lng === 'number' &&
          !Number.isNaN(c.lat) &&
          !Number.isNaN(c.lng)
      )
      .map((c) => [c.lat, c.lng] as [number, number]);

    try {
      if (validCoords.length === 0) {
        mapInstance.setView([7.2906, 80.6337], 10, { animate: false });
        return;
      }

      if (validCoords.length === 1) {
        mapInstance.setView(validCoords[0], 13, { animate: false });
        return;
      }

      const bounds = L.latLngBounds(validCoords);
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, {
          padding: [36, 36],
          maxZoom: 13,
          animate: false,
        });
      }
    } catch {
      // Ignore transient layout bounds errors when container is resizing
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    // Default view centered on Kandy district, Sri Lanka
    // Disable async CSS zoom/marker animations to prevent _leaflet_pos errors on rapid tab switches or resize
    const map = L.map(el, {
      center: [7.2906, 80.6337],
      zoom: pinPickerMode ? 11 : 10,
      zoomControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layerGroup;

    // Observe container visibility/size changes so tiles never render gray
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (isMapReadyAndVisible(mapRef.current, containerRef.current)) {
          try {
            mapRef.current.invalidateSize({ animate: false, pan: false });
          } catch {
            // Safe guard if DOM node is mid-transition
          }
        }
      });
      resizeObserver.observe(el);
    }

    const timerId = window.setTimeout(() => {
      if (isMapReadyAndVisible(mapRef.current, containerRef.current)) {
        try {
          mapRef.current.invalidateSize({ animate: false, pan: false });
          fitMapToCases(mapRef.current, cases);
        } catch {
          // Safe guard
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(timerId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      try {
        map.stop();
        map.off();
        map.remove();
      } catch {
        // Ignore cleanup errors if pane was already detached
      }
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [pinPickerMode]);

  // Handle click for pinPickerMode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (pinPickerMode && onPickPin) {
        onPickPin({
          lat: Number(e.latlng.lat.toFixed(5)),
          lng: Number(e.latlng.lng.toFixed(5)),
        });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [pinPickerMode, onPickPin]);

  // Render case markers, quiet area circles, or picked pin
  useEffect(() => {
    const map = mapRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (pinPickerMode) {
      if (pickedPin) {
        const pinIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#0B2A6F;border:3px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([pickedPin.lat, pickedPin.lng], { icon: pinIcon })
          .addTo(group)
          .bindPopup(
            `<div style="font-size:12px;font-weight:600;">Pinned Location<br/><span style="font-family:monospace;">${pickedPin.lat.toFixed(4)}, ${pickedPin.lng.toFixed(4)}</span></div>`
          );
        if (isMapReadyAndVisible(map, containerRef.current)) {
          map.panTo([pickedPin.lat, pickedPin.lng], { animate: false });
        }
      }
      return;
    }

    // 1. Translucent amber circles for quiet GN areas
    for (const gn of quietAreas) {
      if (!gn.isQuiet) continue;

      const circle = L.circle([gn.lat, gn.lng], {
        radius: 3600,
        color: '#D97706',
        weight: 2,
        dashArray: '6, 4',
        fillColor: '#F59E0B',
        fillOpacity: 0.22,
      }).addTo(group);

      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 text-xs';
      popupDiv.innerHTML = `
        <div style="font-weight:700;color:#B45309;margin-bottom:2px;">SILENT GN AREA: ${gn.name}</div>
        <div style="color:#334155;margin-bottom:4px;">${gn.division} · Hazard: <strong>${gn.hazardLevel.toUpperCase()}</strong></div>
        <div style="font-family:monospace;font-size:11px;color:#475569;">
          Baseline: ${gn.baselinePerHour}/hr · Observed (${gn.windowHours}h): ${gn.observedLastWindow}<br/>
          Poisson scaled p = ${gn.scaledPValue.toFixed(4)} (&lt; 0.05)
        </div>
      `;

      if (onSelectQuietArea) {
        const btn = document.createElement('button');
        btn.textContent = tr(
          lang,
          'Open in Silence Radar →',
          'නිහඬතා රේඩාර් වෙත යන්න →',
          'மௌன ரேடாரில் திறக்க →'
        );
        btn.style.cssText =
          'margin-top:6px;padding:4px 8px;background:#0B2A6F;color:#fff;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;width:100%;';
        btn.onclick = () => onSelectQuietArea(gn.id);
        popupDiv.appendChild(btn);
      }

      circle.bindPopup(popupDiv);
    }

    // 2. Case markers colored by queue
    for (const c of cases) {
      const color = QUEUE_HEX[c.queue];
      const isSelected = c.id === selectedCaseId;
      const size = isSelected ? 26 : 20;

      const markerIcon = L.divIcon({
        className: 'custom-case-marker',
        html: `<div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${color};
          border:${isSelected ? '3px solid #0B2A6F' : '2.5px solid #FFFFFF'};
          box-shadow:0 2px 6px rgba(15,23,42,0.35);
          display:flex;
          align-items:center;
          justify-content:center;
          color:#FFFFFF;
          font-size:10px;
          font-weight:700;
          font-family:monospace;
        ">${c.urgency}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([c.lat, c.lng], { icon: markerIcon }).addTo(
        group
      );

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '210px';
      popupContent.innerHTML = `
        <div style="font-size:11px;font-weight:700;color:${color};letter-spacing:0.02em;">
          ${c.id} · ${getQueueLabel(c.queue, lang).toUpperCase()} ${c.roadBlocked ? `· ${tr(lang, 'ROAD BLOCKED', 'මාර්ගය අවහිරයි', 'வீதி தடை')}` : ''}
        </div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;margin-top:2px;">
          ${localizePlace(c.place_english, lang)}
        </div>
        <div style="font-size:11px;color:#475569;margin-top:2px;">
          ${UI_TRANSLATIONS[lang].incidentTypes[c.incident_type]} · ${c.reportIds.length} ${tr(lang, 'report(s)', 'වාර්තා', 'அறிக்கைகள்')} · ${localizeLocationSource(c.locationSource, lang)}
        </div>
        <div style="font-family:monospace;font-size:11px;color:#1E293B;margin-top:4px;">
          ${tr(lang, 'Urgency:', 'හදිසි බව:', 'அவசரம்:')} ${c.urgency}/5 · ${tr(lang, 'Confidence:', 'විශ්වාසය:', 'நம்பகத்தன்மை:')} ${(c.confidence * 100).toFixed(0)}%
        </div>
        <div style="font-size:11px;color:#334155;margin-top:4px;line-height:1.35;">
          ${localizeCaseReason(c.reason, lang)}
        </div>
      `;

      if (onSelectCase) {
        const openBtn = document.createElement('button');
        openBtn.textContent = tr(
          lang,
          'Inspect Case Detail →',
          'සිදුවීම් විස්තරය බලන්න →',
          'சம்பவ விவரத்தைக் காண்க →'
        );
        openBtn.style.cssText =
          'margin-top:8px;padding:4px 8px;background:#0B2A6F;color:#fff;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;width:100%;';
        openBtn.onclick = () => onSelectCase(c.id);
        popupContent.appendChild(openBtn);
      }

      marker.bindPopup(popupContent);
    }
  }, [
    lang,
    cases,
    quietAreas,
    selectedCaseId,
    onSelectCase,
    onSelectQuietArea,
    pinPickerMode,
    pickedPin,
  ]);

  // Automatically re-center and adjust zoom level to fit all markers whenever the cases list updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pinPickerMode) return;
    if (!isMapReadyAndVisible(map, containerRef.current)) return;

    try {
      map.invalidateSize({ animate: false, pan: false });
      fitMapToCases(map, cases);
    } catch {
      // Safe guard if container is resizing
    }
  }, [cases, pinPickerMode]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div ref={containerRef} className={`w-full ${heightClass}`} />
      {!pinPickerMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-slate-800">
              {tr(lang, 'Map Legend:', 'සිතියම් සංකේත:', 'வரைபடக் குறியீடுகள்:')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              <span>
                {tr(lang, 'Act now', 'වහාම ක්‍රියාත්මක වන්න', 'உடனடி நடவடிக்கை')}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
              <span>
                {tr(lang, 'Verify fast', 'ඉක්මනින් තහවුරු කරන්න', 'விரைந்து சரிபார்')}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
              <span>{tr(lang, 'Watch', 'විමසිල්ලෙන් සිටින්න', 'கண்காணிப்பு')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-dashed border-amber-600 bg-amber-400/30" />
              <span>
                {tr(
                  lang,
                  'Quiet GN Area (Silence Radar)',
                  'නිහඬ ග්‍රාම නිලධාරී වසම',
                  'மௌனமான கிராம சேவகர் பிரிவு'
                )}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {cases.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (isMapReadyAndVisible(mapRef.current, containerRef.current)) {
                    mapRef.current.invalidateSize({ animate: false, pan: false });
                    fitMapToCases(mapRef.current, cases);
                  }
                }}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-[#0B2A6F] hover:border-[#0B2A6F] hover:bg-blue-50 transition-colors"
              >
                {tr(lang, 'Fit All', 'සියල්ල පෙන්වන්න', 'அனைத்தையும் காட்டு')} (
                {cases.length})
              </button>
            )}
            <span className="font-mono text-[11px] text-slate-500">
              {tr(
                lang,
                'Kandy · Nuwara Eliya · Matale',
                'මහනුවර · නුවරඑළිය · මාතලේ',
                'கண்டி · நுவரெலியா · மாத்தளை'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
