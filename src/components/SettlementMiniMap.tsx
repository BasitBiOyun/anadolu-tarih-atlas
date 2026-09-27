import React, { useState, useEffect, useRef } from 'react';
import '../config/maplibre';
import * as maplibregl from 'maplibre-gl';
import { Settlement } from '../types/settlement';
import {
  fetchTurkeyGeo,
  getCachedTurkeyGeo,
  fetchSurroundingGeo,
  getCachedSurroundingGeo
} from '../utils/mapData';
import { useLanguage } from '../context/LanguageContext';
import { AtlasTheme, useTheme } from '../context/ThemeContext';
import { ArrowSquareOut, Plus, Minus, Copy, Check, Compass } from '@phosphor-icons/react';

interface SettlementMiniMapProps {
  settlement: Settlement;
  onShowOnMainMap: (settlement: Settlement) => void;
  hideHeader?: boolean;
}

const MINI_MAP_THEME = {
  light: {
    water: '#DFE9E6',
    surrounding: '#E4DDD2',
    surroundingLine: '#D5CCBD',
    land: '#ECE5D8',
    landLine: '#D6CBBC',
    site: '#8A4526',
    siteStroke: '#FAF6EE'
  },
  dark: {
    water: '#111B1C',
    surrounding: '#191B19',
    surroundingLine: '#353832',
    land: '#25231F',
    landLine: '#484238',
    site: '#D0784F',
    siteStroke: '#F4ECE1'
  }
} as const;

function getMiniStyle(theme: AtlasTheme): maplibregl.StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': MINI_MAP_THEME[theme].water
        }
      }
    ]
  };
}

function applyMiniMapTheme(map: maplibregl.Map, theme: AtlasTheme) {
  const palette = MINI_MAP_THEME[theme];
  const setPaint = (layerId: string, property: string, value: any) => {
    if (map.getLayer(layerId)) map.setPaintProperty(layerId, property, value);
  };

  setPaint('background', 'background-color', palette.water);
  setPaint('surrounding-fill', 'fill-color', palette.surrounding);
  setPaint('surrounding-line', 'line-color', palette.surroundingLine);
  setPaint('turkey-fill', 'fill-color', palette.land);
  setPaint('turkey-line', 'line-color', palette.landLine);
  setPaint('site-ring', 'circle-color', palette.site);
  setPaint('site-ring', 'circle-stroke-color', palette.site);
  setPaint('site-dot', 'circle-color', palette.site);
  setPaint('site-dot', 'circle-stroke-color', palette.siteStroke);
}

export const SettlementMiniMap: React.FC<SettlementMiniMapProps> = ({
  settlement,
  onShowOnMainMap,
  hideHeader = false
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [geoData, setGeoData] = useState<any | null>(getCachedTurkeyGeo());
  const [surroundingGeoData, setSurroundingGeoData] = useState<any | null>(
    getCachedSurroundingGeo()
  );
  const geoDataRef = useRef<any>(getCachedTurkeyGeo());
  const surroundingGeoDataRef = useRef<any>(getCachedSurroundingGeo());
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Load geojson if not already in cache
  useEffect(() => {
    let isMounted = true;
    if (!geoDataRef.current) {
      fetchTurkeyGeo().then(data => {
        geoDataRef.current = data;
        if (isMounted) setGeoData(data);
        const map = mapRef.current;
        if (map) {
          const src = map.getSource('turkey-geo') as maplibregl.GeoJSONSource | undefined;
          if (src) src.setData(data);
        }
      });
    }
    if (!surroundingGeoDataRef.current) {
      fetchSurroundingGeo().then(data => {
        surroundingGeoDataRef.current = data;
        if (isMounted) setSurroundingGeoData(data);
        const map = mapRef.current;
        if (map) {
          const src = map.getSource('surrounding-geo') as maplibregl.GeoJSONSource | undefined;
          if (src) src.setData(data);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize MapLibre Mini Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMiniStyle(theme),
      center: [settlement.longitude, settlement.latitude],
      zoom: 7.2,
      minZoom: 4,
      maxZoom: 13,
      dragRotate: false,
      dragPan: false,
      scrollZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      pitchWithRotate: false,
      touchPitch: false,
      touchZoomRotate: false,
      attributionControl: false
    });

    mapRef.current = map;

    map.on('load', () => {
      const emptyGeoJSON = { type: 'FeatureCollection' as const, features: [] };
      const initialSurrounding =
        surroundingGeoDataRef.current || surroundingGeoData || getCachedSurroundingGeo();
      const initialTurkey = geoDataRef.current || geoData || getCachedTurkeyGeo();

      map.addSource('surrounding-geo', {
        type: 'geojson',
        data: initialSurrounding || emptyGeoJSON
      });
      map.addLayer({
        id: 'surrounding-fill',
        type: 'fill',
        source: 'surrounding-geo',
        paint: {
          'fill-color': '#E4DDD2',
          'fill-opacity': 0.72
        }
      });
      map.addLayer({
        id: 'surrounding-line',
        type: 'line',
        source: 'surrounding-geo',
        paint: {
          'line-color': '#D5CCBD',
          'line-width': 0.45,
          'line-opacity': 0.7
        }
      });

      map.addSource('turkey-geo', {
        type: 'geojson',
        data: initialTurkey || emptyGeoJSON
      });
      map.addLayer({
        id: 'turkey-fill',
        type: 'fill',
        source: 'turkey-geo',
        paint: {
          'fill-color': '#ECE5D8'
        }
      });
      map.addLayer({
        id: 'turkey-line',
        type: 'line',
        source: 'turkey-geo',
        paint: {
          'line-color': '#D6CBBC',
          'line-width': 0.75
        }
      });

      // Add single site point
      map.addSource('site-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [settlement.longitude, settlement.latitude]
              },
              properties: {
                name: settlement.name
              }
            }
          ]
        }
      });

      // Outer ring
      map.addLayer({
        id: 'site-ring',
        type: 'circle',
        source: 'site-point',
        paint: {
          'circle-radius': 11,
          'circle-color': '#8A4526',
          'circle-opacity': 0.22,
          'circle-stroke-color': '#8A4526',
          'circle-stroke-width': 1.5
        }
      });

      // Core dot
      map.addLayer({
        id: 'site-dot',
        type: 'circle',
        source: 'site-point',
        paint: {
          'circle-radius': 5.5,
          'circle-color': '#8A4526',
          'circle-stroke-color': '#FAF6EE',
          'circle-stroke-width': 2.0
        }
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyTheme = () => applyMiniMapTheme(map, theme);
    if (map.isStyleLoaded()) {
      applyTheme();
      return;
    }

    map.once('load', applyTheme);
    return () => {
      map.off('load', applyTheme);
    };
  }, [theme]);

  // Update Turkey GeoJSON when loaded
  useEffect(() => {
    if (!geoData) return;
    geoDataRef.current = geoData;
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('turkey-geo') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(geoData);
  }, [geoData]);

  // Update Surrounding Countries GeoJSON when loaded
  useEffect(() => {
    if (!surroundingGeoData) return;
    surroundingGeoDataRef.current = surroundingGeoData;
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource('surrounding-geo') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(surroundingGeoData);
  }, [surroundingGeoData]);

  // Update center when settlement changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      center: [settlement.longitude, settlement.latitude],
      zoom: 7.2,
      duration: 500
    });

    if (map.isStyleLoaded() && map.getSource('site-point')) {
      const src = map.getSource('site-point') as maplibregl.GeoJSONSource;
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [settlement.longitude, settlement.latitude]
            },
            properties: {
              name: settlement.name
            }
          }
        ]
      });
    }
    setCopiedCoords(false);
  }, [settlement.id, settlement.latitude, settlement.longitude]);

  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${settlement.latitude},${settlement.longitude}`;
  const coordsFormatted = `${settlement.latitude.toFixed(5)}° N, ${settlement.longitude.toFixed(5)}° E`;

  const handleCopyCoords = () => {
    navigator.clipboard?.writeText(coordsFormatted);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <section
      aria-label={t('Konum', 'Location')}
      className={`space-y-3 ${hideHeader ? '' : 'pb-4 border-b border-[#E8DFD0]'}`}
    >
      {/* Map Header Title (only shown if parent does not have its own header) */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xs font-semibold tracking-wider uppercase text-[#736554]">
            {t('Konum', 'Location')}
          </h3>
          <span className="text-[11px] font-mono text-[#736554] tracking-wide tabular-nums">
            {coordsFormatted}
          </span>
        </div>
      )}

      {/* Embedded Map Container */}
      <div className="relative h-[250px] w-full overflow-hidden border border-[#D8CEBE] bg-[#DFE9E6] shadow-[0_18px_40px_-34px_rgba(35,27,20,0.65)] select-none sm:h-[280px]">
        {/* Subtle decorative corner label */}
        <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-58px)] truncate border border-[#D5C9B5] bg-[#FAF7F2]/90 px-2 py-1 font-serif text-[10px] text-[#695B4A] backdrop-blur-xs">
          {settlement.province} / {settlement.district}
        </div>

        {/* Minimal zoom controls (+ / -) */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn({ duration: 250 })}
            className="flex h-9 w-9 touch-manipulation items-center justify-center border border-[#D5C9B5] bg-[#FAF7F2]/95 text-[#2B231B] shadow-xs transition-colors hover:bg-white cursor-pointer sm:h-8 sm:w-8"
            title={t('Yakınlaştır', 'Zoom In')}
            aria-label={t('Haritayı Yakınlaştır', 'Zoom In Map')}
          >
            <Plus size={12} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut({ duration: 250 })}
            className="flex h-9 w-9 touch-manipulation items-center justify-center border border-[#D5C9B5] bg-[#FAF7F2]/95 text-[#2B231B] shadow-xs transition-colors hover:bg-white cursor-pointer sm:h-8 sm:w-8"
            title={t('Uzaklaştır', 'Zoom Out')}
            aria-label={t('Haritayı Uzaklaştır', 'Zoom Out Map')}
          >
            <Minus size={12} weight="bold" />
          </button>
        </div>

        {/* MapLibre Canvas Container */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Details Under the Map */}
      <div className="space-y-2 text-xs">
        {/* Landscape / Geography summary if present */}
        {settlement.geography?.landscape && (
          <p className="font-prose text-xs sm:text-[13px] text-[#524536] italic leading-relaxed pt-0.5">
            {settlement.geography.landscape}
          </p>
        )}

        {/* Action Buttons: "Ana haritada göster" + External map + Copy coordinates */}
        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onShowOnMainMap(settlement)}
            className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 bg-[#8A4526] px-3 py-2 text-[#FAF7F2] font-serif text-xs font-medium shadow-xs transition-colors hover:bg-[#70361C] cursor-pointer"
          >
            <Compass size={14} weight="regular" />
            <span>{t('Ana haritada göster', 'Show on main map')}</span>
          </button>

          <a
            href={externalMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 border border-[#D5C9B5] bg-[#FAF7F2] px-3 py-2 text-[#57493A] font-serif text-xs transition-colors hover:bg-white cursor-pointer"
            title={t('Google Haritalar üzerinde aç', 'Open on Google Maps')}
          >
            <ArrowSquareOut size={13} weight="regular" />
            <span>{t('Haritada Aç', 'Open in Maps')}</span>
          </a>

          <button
            type="button"
            onClick={handleCopyCoords}
            className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 border border-[#D5C9B5] bg-[#FAF7F2] px-3 py-2 text-[#57493A] font-serif text-xs transition-colors hover:bg-white cursor-pointer"
            title={t('Koordinatları kopyalamak için tıklayın', 'Click to copy coordinates')}
          >
            {copiedCoords ? (
              <>
                <Check size={13} weight="bold" className="text-emerald-700" />
                <span className="text-emerald-800 font-medium">{t('Kopyalandı', 'Copied')}</span>
              </>
            ) : (
              <>
                <Copy size={13} weight="regular" />
                <span>{t('Koordinatları Kopyala', 'Copy Coordinates')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
