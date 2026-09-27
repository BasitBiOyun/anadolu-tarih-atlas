import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../config/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Settlement } from '../types/settlement';
import { getPeriodColor, getPeriodConfig, getPeriodLabel } from '../config/periods';
import { sortPeriodsChronologically, formatDateRange } from '../utils/chronology';
import {
  fetchTurkeyGeo,
  getCachedTurkeyGeo,
  fetchSurroundingGeo,
  getCachedSurroundingGeo
} from '../utils/mapData';
import { getProvinceCentroid } from '../utils/provinceCentroids';
import { SETTLEMENT_LABEL_OVERRIDES } from '../config/labelPlacements';
import { getFormattedProvinceLabel } from '../utils/turkishCasing';
import { useLanguage } from '../context/LanguageContext';
import { AtlasTheme, useTheme } from '../context/ThemeContext';
import { getPeriodChipStyle, getPeriodDotColor } from '../utils/themeStyles';
import {
  Plus,
  Minus,
  ArrowCounterClockwise,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';

interface AtlasMapProps {
  settlements: Settlement[];
  selectedSettlement: Settlement | null;
  onSelectSettlement: (settlement: Settlement) => void;
  focusTarget?: { center: [number, number]; zoom: number; timestamp: number } | null;
  bottomUiInset?: boolean;
}

// Center of Anatolia in geographic coordinates [lng, lat]
const ANATOLIA_DEFAULT_CENTER: [number, number] = [35.2, 39.0];
const ANATOLIA_DEFAULT_ZOOM = 5.2;

// Sea labels in open water with distinct primary and secondary names
const getSeaLabelsGeoJSON = (lang: 'tr' | 'en') => ({
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [35.5, 43.15] },
      properties: {
        id: 'black-sea',
        title: lang === 'en' ? 'BLACK SEA' : 'KARADENİZ',
        subtitle: 'Pontus Euxinus',
        scale: 1.0
      }
    },
    {
      type: 'Feature' as const,
      // Placed in the deepest open water basin of Sea of Marmara, south of Marmara Island
      geometry: { type: 'Point' as const, coordinates: [28.05, 40.66] },
      properties: {
        id: 'marmara-sea',
        title: lang === 'en' ? 'SEA OF MARMARA' : 'MARMARA DENİZİ',
        subtitle: 'Propontis',
        scale: 0.8
      }
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [25.0, 38.5] },
      properties: {
        id: 'aegean-sea',
        title: lang === 'en' ? 'AEGEAN SEA' : 'EGE DENİZİ',
        subtitle: 'Mare Aegaeum',
        scale: 1.0
      }
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [30.2, 34.6] },
      properties: {
        id: 'mediterranean-sea',
        title: lang === 'en' ? 'MEDITERRANEAN SEA' : 'AKDENİZ',
        subtitle: 'Mare Nostrum',
        scale: 1.0
      }
    }
  ]
});

function processTurkeyGeo(geo: any) {
  if (!geo || !geo.features) {
    return { type: 'FeatureCollection' as const, features: [] };
  }
  return {
    ...geo,
    features: geo.features.map((f: any, idx: number) => ({
      ...f,
      id: f.properties?.number ?? idx + 1
    }))
  };
}

const MAP_THEME = {
  light: {
    water: '#DFE9E6',
    surrounding: '#E4DDD2',
    surroundingLine: '#D5CCBD',
    land: '#ECE5D8',
    landHover: '#F6F0E6',
    landLine: '#D6CBBC',
    label: '#241D17',
    labelStrong: '#140E0A',
    labelMuted: '#5A4B3A',
    halo: '#FAF7F2',
    sea: '#446663',
    seaSecondary: '#688C89',
    seaHalo: '#DFE9E6',
    markerStroke: '#FFFFFF',
    selectedRing: '#1A1510'
  },
  dark: {
    water: '#111B1C',
    surrounding: '#191B19',
    surroundingLine: '#353832',
    land: '#25231F',
    landHover: '#302C25',
    landLine: '#484238',
    label: '#E5DCCF',
    labelStrong: '#FFF7EC',
    labelMuted: '#CABDAD',
    halo: '#151310',
    sea: '#86AAA5',
    seaSecondary: '#698F8B',
    seaHalo: '#111B1C',
    markerStroke: '#F4ECE1',
    selectedRing: '#F0D9C5'
  }
} as const;

function getBaseMapStyle(theme: AtlasTheme): maplibregl.StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': MAP_THEME[theme].water
        }
      }
    ]
  };
}

function applyAtlasMapTheme(map: maplibregl.Map, theme: AtlasTheme) {
  const palette = MAP_THEME[theme];
  const setPaint = (layerId: string, property: string, value: any) => {
    if (map.getLayer(layerId)) map.setPaintProperty(layerId, property, value);
  };

  setPaint('background', 'background-color', palette.water);
  setPaint('surrounding-fill', 'fill-color', palette.surrounding);
  setPaint('surrounding-line', 'line-color', palette.surroundingLine);
  setPaint(
    'turkey-fill',
    'fill-color',
    [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      palette.landHover,
      palette.land
    ] as any
  );
  setPaint('turkey-line', 'line-color', palette.landLine);

  setPaint('turkey-hover-label', 'text-color', palette.labelMuted);
  setPaint('turkey-hover-label', 'text-halo-color', palette.halo);
  setPaint('sea-labels-title', 'text-color', palette.sea);
  setPaint('sea-labels-title', 'text-halo-color', palette.seaHalo);
  setPaint('sea-labels-title-marmara', 'text-color', palette.sea);
  setPaint('sea-labels-title-marmara', 'text-halo-color', palette.seaHalo);
  setPaint('sea-labels-subtitle', 'text-color', palette.seaSecondary);
  setPaint('sea-labels-subtitle', 'text-halo-color', palette.seaHalo);
  setPaint('sea-labels-subtitle-marmara', 'text-color', palette.seaSecondary);
  setPaint('sea-labels-subtitle-marmara', 'text-halo-color', palette.seaHalo);

  setPaint('sites-selected-ring', 'circle-stroke-color', palette.selectedRing);
  setPaint('sites-circle', 'circle-stroke-color', palette.markerStroke);
  setPaint('sites-center-dot', 'circle-color', palette.markerStroke);
  setPaint('sites-labels-custom', 'text-color', palette.label);
  setPaint('sites-labels-custom', 'text-halo-color', palette.halo);
  setPaint('sites-labels', 'text-color', palette.label);
  setPaint('sites-labels', 'text-halo-color', palette.halo);
  setPaint('sites-selected-label', 'text-color', palette.labelStrong);
  setPaint('sites-selected-label', 'text-halo-color', palette.halo);
}

export const AtlasMap: React.FC<AtlasMapProps> = ({
  settlements,
  selectedSettlement,
  onSelectSettlement,
  focusTarget,
  bottomUiInset = false
}) => {
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const langRef = useRef<'tr' | 'en'>(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoveredProvinceIdRef = useRef<number | string | null>(null);
  const hoveredProvinceNameRef = useRef<string | null>(null);
  const lastFocusTimestampRef = useRef<number>(0);

  // GeoJSON layer caches and refs for immediate synchronization
  const [geoData, setGeoData] = useState<any | null>(getCachedTurkeyGeo());
  const [surroundingGeoData, setSurroundingGeoData] = useState<any | null>(
    getCachedSurroundingGeo()
  );
  const geoDataRef = useRef<any>(getCachedTurkeyGeo());
  const surroundingGeoDataRef = useRef<any>(getCachedSurroundingGeo());

  // Label display toggle (force all non-colliding labels vs default progressive)
  const [showAllLabels, setShowAllLabels] = useState(true);

  // Hover Tooltip State for Site
  const [hoveredSettlement, setHoveredSettlement] = useState<Settlement | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Province Hover State (single active province only)
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Current camera zoom level (updated on moveend / zoomend, never on move)
  const [currentZoom, setCurrentZoom] = useState<number>(ANATOLIA_DEFAULT_ZOOM);

  // Scale bar state
  const [scaleKm, setScaleKm] = useState(100);

  // Fast settlement lookup map
  const settlementsMap = useMemo(() => {
    const map = new Map<string, Settlement>();
    settlements.forEach(s => map.set(s.id, s));
    return map;
  }, [settlements]);

  // Load GeoJSON files on mount if not already in memory
  useEffect(() => {
    let isMounted = true;
    if (!geoDataRef.current) {
      fetchTurkeyGeo()
        .then(data => {
          geoDataRef.current = data;
          if (isMounted) setGeoData(data);
          const map = mapRef.current;
          if (map) {
            const src = map.getSource('turkey-geo') as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(processTurkeyGeo(data));
          }
        })
        .catch(err => console.error('Turkey geo loading error:', err));
    }
    if (!surroundingGeoDataRef.current) {
      fetchSurroundingGeo()
        .then(data => {
          surroundingGeoDataRef.current = data;
          if (isMounted) setSurroundingGeoData(data);
          const map = mapRef.current;
          if (map) {
            const src = map.getSource('surrounding-geo') as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(data);
          }
        })
        .catch(err => console.error('Surrounding geo loading error:', err));
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Convert settlements to GeoJSON FeatureCollection
  const sitesGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: settlements.map(s => {
        const sortedPeriods = sortPeriodsChronologically(s.periods);
        const primaryPeriod = sortedPeriods[0] || 'neolithic';
        const secondaryPeriod = sortedPeriods.length > 1 ? sortedPeriods[1] : null;
        const primaryColor = getPeriodColor(primaryPeriod);
        const secondaryColor = secondaryPeriod ? getPeriodColor(secondaryPeriod) : primaryColor;
        const isSelected = s.id === selectedSettlement?.id;

        const imp = s.visibility?.importance ?? s.importanceScore ?? 2;
        const feat = s.visibility?.featured ?? s.featured ?? false;
        const override = SETTLEMENT_LABEL_OVERRIDES[s.id];

        return {
          type: 'Feature' as const,
          id: s.id,
          geometry: {
            type: 'Point' as const,
            coordinates: [s.longitude, s.latitude]
          },
          properties: {
            id: s.id,
            latitude: s.latitude,
            longitude: s.longitude,
            name: s.name,
            nameTR: s.nameTR || s.name,
            nameEN: s.nameEN || s.name,
            periods: s.periods,
            siteType:
              typeof s.siteType === 'string'
                ? s.siteType
                : Array.isArray(s.siteType)
                ? s.siteType.join(', ')
                : '',
            primaryColor,
            secondaryColor,
            isMultiPeriod: sortedPeriods.length > 1,
            isSelected,
            importance: imp,
            minZoom: 0,
            featured: feat,
            hasCustomPlacement: Boolean(override),
            customAnchor: override?.anchor ?? 'top'
          }
        };
      })
    };
  }, [settlements, selectedSettlement?.id]);

  // 1. Initialize MapLibre Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getBaseMapStyle(theme),
      center: ANATOLIA_DEFAULT_CENTER,
      zoom: ANATOLIA_DEFAULT_ZOOM,
      minZoom: 4,
      maxZoom: 13,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      attributionControl: false,
      clickTolerance: 6
    });

    // Disable rotation completely to maintain strict 2D cartographic perspective
    map.touchZoomRotate.disableRotation();

    mapRef.current = map;

    map.on('load', () => {
      // 1. Surrounding Countries Source & Layers
      const initialSurrounding =
        surroundingGeoDataRef.current || surroundingGeoData || getCachedSurroundingGeo();
      map.addSource('surrounding-geo', {
        type: 'geojson',
        data: initialSurrounding || { type: 'FeatureCollection', features: [] }
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

      // 2. Turkey Provinces Source & Layers
      const initialTurkey = geoDataRef.current || geoData || getCachedTurkeyGeo();
      map.addSource('turkey-geo', {
        type: 'geojson',
        data: processTurkeyGeo(initialTurkey)
      });

      map.addLayer({
        id: 'turkey-fill',
        type: 'fill',
        source: 'turkey-geo',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#F6F0E6',
            '#ECE5D8'
          ]
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

      // Dedicated GeoJSON source for province hover label (contains at most ONE Point feature)
      map.addSource('turkey-hover-geo', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Dedicated hover label layer: renders exactly ONE label at the province centroid
      map.addLayer({
        id: 'turkey-hover-label',
        type: 'symbol',
        source: 'turkey-hover-geo',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            11,
            6,
            13.5,
            9,
            16.5,
            12,
            20
          ],
          'text-letter-spacing': 0.16,
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#5A4B3A',
          'text-halo-color': '#FAF7F2',
          'text-halo-width': 2.5,
          'text-halo-blur': 0.5
        }
      });

      // 3. Historical Sea Labels Source & Layers
      map.addSource('sea-labels', {
        type: 'geojson',
        data: getSeaLabelsGeoJSON(lang)
      });

      // Primary Modern Sea Names: Black Sea, Aegean, Mediterranean
      map.addLayer({
        id: 'sea-labels-title',
        type: 'symbol',
        source: 'sea-labels',
        filter: ['!=', ['get', 'id'], 'marmara-sea'],
        layout: {
          'text-field': ['get', 'title'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 11,
            6, 14.5,
            9, 19,
            12, 23
          ],
          'text-letter-spacing': 0.18,
          'text-anchor': 'bottom',
          'text-offset': [0, -0.25],
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#446663',
          'text-halo-color': '#DFE9E6',
          'text-halo-width': 2.5
        }
      });

      // Primary Modern Marmara Sea Name (Proportionally scaled for narrower Marmara basin)
      map.addLayer({
        id: 'sea-labels-title-marmara',
        type: 'symbol',
        source: 'sea-labels',
        filter: ['==', ['get', 'id'], 'marmara-sea'],
        layout: {
          'text-field': ['get', 'title'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 7.8,
            5.2, 9.0,
            6.5, 11.5,
            9, 14.5,
            12, 18
          ],
          'text-letter-spacing': 0.12,
          'text-anchor': 'bottom',
          'text-offset': [0, -0.2],
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#446663',
          'text-halo-color': '#DFE9E6',
          'text-halo-width': 2.0,
          'text-opacity': 0.82
        }
      });

      // Secondary Historical Sea Names (Pontus Euxinus, Mare Aegaeum, Mare Nostrum)
      map.addLayer({
        id: 'sea-labels-subtitle',
        type: 'symbol',
        source: 'sea-labels',
        filter: ['!=', ['get', 'id'], 'marmara-sea'],
        layout: {
          'text-field': ['get', 'subtitle'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 8,
            6, 10.5,
            9, 14,
            12, 17
          ],
          'text-letter-spacing': 0.12,
          'text-anchor': 'top',
          'text-offset': [0, 0.35],
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#688C89',
          'text-halo-color': '#DFE9E6',
          'text-halo-width': 2.0,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4.4, 0,
            5.0, 0.75,
            7.5, 0.95
          ]
        }
      });

      // Secondary Historical Marmara Sea Name (Propontis - only visible when zooming into Marmara)
      map.addLayer({
        id: 'sea-labels-subtitle-marmara',
        type: 'symbol',
        source: 'sea-labels',
        filter: ['==', ['get', 'id'], 'marmara-sea'],
        layout: {
          'text-field': ['get', 'subtitle'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 6.5,
            6, 8.5,
            9, 11.5,
            12, 14
          ],
          'text-letter-spacing': 0.10,
          'text-anchor': 'top',
          'text-offset': [0, 0.3],
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#688C89',
          'text-halo-color': '#DFE9E6',
          'text-halo-width': 1.8,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5.8, 0,
            6.5, 0.75,
            8.0, 0.95
          ]
        }
      });

      // 4. Archaeological Sites GeoJSON Source
      map.addSource('sites-geo', {
        type: 'geojson',
        data: sitesGeoJSON
      });

      // Outer concentric ring for multi-period sites
      map.addLayer({
        id: 'sites-multi-ring',
        type: 'circle',
        source: 'sites-geo',
        filter: ['==', ['get', 'isMultiPeriod'], true],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            6.5,
            8,
            8.5,
            11,
            11.5
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': ['get', 'secondaryColor'],
          'circle-stroke-width': 1.5,
          'circle-stroke-opacity': 0.85
        }
      });

      // Selected site static high-contrast highlight ring (NO pulse animation)
      map.addLayer({
        id: 'sites-selected-ring',
        type: 'circle',
        source: 'sites-geo',
        filter: ['==', ['get', 'isSelected'], true],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            9.5,
            8,
            12.5,
            11,
            15.5
          ],
          'circle-color': 'transparent',
          'circle-stroke-color': '#1A1510',
          'circle-stroke-width': 2.0,
          'circle-stroke-opacity': 0.95
        }
      });

      // Primary site marker circle (WebGL hardware accelerated)
      map.addLayer({
        id: 'sites-circle',
        type: 'circle',
        source: 'sites-geo',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5,
            4.2,
            8,
            6.2,
            11,
            8.5
          ],
          'circle-color': ['get', 'primaryColor'],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.5
        }
      });

      // Pinpoint white center dot
      map.addLayer({
        id: 'sites-center-dot',
        type: 'circle',
        source: 'sites-geo',
        paint: {
          'circle-radius': 1.5,
          'circle-color': '#FFFFFF'
        }
      });

      // 4b. Custom-placed labels: specifically pinned direction for tight clusters (Aşıklı/Kaletepe, Göbekli/Karahan, Karain/Öküzini/Beldibi)
      map.addLayer({
        id: 'sites-labels-custom',
        type: 'symbol',
        source: 'sites-geo',
        filter: [
          'all',
          ['!=', ['get', 'isSelected'], true],
          ['==', ['get', 'hasCustomPlacement'], true]
        ],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            10,
            6,
            12,
            9,
            14.5,
            12,
            17
          ],
          'text-anchor': ['get', 'customAnchor'] as any,
          'text-radial-offset': 0.85,
          'text-justify': 'auto',
          'text-allow-overlap': true,
          'text-ignore-placement': true,
          'symbol-sort-key': ['get', 'importance']
        },
        paint: {
          'text-color': '#241D17',
          'text-halo-color': '#FAF7F2',
          'text-halo-width': 2.0,
          'text-halo-blur': 0.5
        }
      });

      // 4c. Regular auto-placed labels with multi-anchor dynamic placement
      map.addLayer({
        id: 'sites-labels',
        type: 'symbol',
        source: 'sites-geo',
        filter: [
          'all',
          ['!=', ['get', 'isSelected'], true],
          ['!=', ['get', 'hasCustomPlacement'], true]
        ],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            10,
            6,
            12,
            9,
            14.5,
            12,
            17
          ],
          'text-variable-anchor': [
            'top',
            'top-right',
            'right',
            'top-left',
            'bottom-right',
            'left',
            'bottom',
            'bottom-left'
          ],
          'text-radial-offset': 0.85,
          'text-justify': 'auto',
          'text-allow-overlap': true,
          'text-ignore-placement': false,
          'symbol-sort-key': ['get', 'importance']
        },
        paint: {
          'text-color': '#241D17',
          'text-halo-color': '#FAF7F2',
          'text-halo-width': 2.0,
          'text-halo-blur': 0.5
        }
      });

      // Selected site label: ALWAYS visible (ignores collisions)
      map.addLayer({
        id: 'sites-selected-label',
        type: 'symbol',
        source: 'sites-geo',
        filter: ['==', ['get', 'isSelected'], true],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            11,
            6,
            13,
            9,
            16,
            12,
            18.5
          ],
          'text-variable-anchor': [
            'right',
            'left',
            'top',
            'bottom',
            'top-right',
            'top-left',
            'bottom-right',
            'bottom-left'
          ],
          'text-radial-offset': 0.9,
          'text-justify': 'auto',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#140E0A',
          'text-halo-color': '#FAF7F2',
          'text-halo-width': 2.5,
          'text-halo-blur': 0.5
        }
      });

      // Attach hit listeners to site markers and site labels
      const interactiveSiteLayers = [
        'sites-circle',
        'sites-labels-custom',
        'sites-labels',
        'sites-selected-label'
      ];
      interactiveSiteLayers.forEach(layerId => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
          setHoveredSettlement(null);
          setTooltipPos(null);
        });

        map.on('click', layerId, e => {
          if (!e.features || e.features.length === 0) return;
          const siteId = e.features[0].properties?.id;
          const found = settlementsMap.get(siteId);
          if (found) {
            onSelectSettlement(found);
            setHoveredSettlement(null);
            setTooltipPos(null);
          }
        });

        map.on('mousemove', layerId, e => {
          if (!e.features || e.features.length === 0) return;
          const siteId = e.features[0].properties?.id;
          const found = settlementsMap.get(siteId);
          if (found) {
            setHoveredSettlement(found);
            setTooltipPos({ x: e.point.x, y: e.point.y });

            // Clear province hover highlight and centroid label when pointing at a site marker
            if (hoveredProvinceIdRef.current !== null) {
              map.setFeatureState(
                { source: 'turkey-geo', id: hoveredProvinceIdRef.current },
                { hover: false }
              );
              hoveredProvinceIdRef.current = null;
            }
            if (hoveredProvinceNameRef.current !== null) {
              hoveredProvinceNameRef.current = null;
              const hoverSrc = map.getSource('turkey-hover-geo') as maplibregl.GeoJSONSource | undefined;
              if (hoverSrc) {
                hoverSrc.setData({
                  type: 'FeatureCollection',
                  features: []
                });
              }
              setHoveredProvince(null);
            }
          }
        });
      });

      // Province hover listener: updates dedicated single-point centroid source
      map.on('mousemove', 'turkey-fill', e => {
        if (hoveredSettlement) return;
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const provinceName = feat.properties?.name;

        if (feat.id !== undefined) {
          if (
            hoveredProvinceIdRef.current !== null &&
            hoveredProvinceIdRef.current !== feat.id
          ) {
            map.setFeatureState(
              { source: 'turkey-geo', id: hoveredProvinceIdRef.current },
              { hover: false }
            );
          }
          hoveredProvinceIdRef.current = feat.id;
          map.setFeatureState(
            { source: 'turkey-geo', id: feat.id },
            { hover: true }
          );
        }

        if (provinceName && provinceName !== hoveredProvinceNameRef.current) {
          hoveredProvinceNameRef.current = provinceName;
          const centroid = getProvinceCentroid(provinceName, feat.geometry);
          const currentLang = langRef.current || 'tr';
          const formattedName = getFormattedProvinceLabel(provinceName, currentLang);
          const hoverSrc = map.getSource('turkey-hover-geo') as maplibregl.GeoJSONSource | undefined;
          if (hoverSrc && centroid) {
            hoverSrc.setData({
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: centroid
                  },
                  properties: {
                    name: formattedName
                  }
                }
              ]
            });
          }
          setHoveredProvince(provinceName);
        }
      });

      map.on('mouseleave', 'turkey-fill', () => {
        if (hoveredProvinceIdRef.current !== null) {
          map.setFeatureState(
            { source: 'turkey-geo', id: hoveredProvinceIdRef.current },
            { hover: false }
          );
          hoveredProvinceIdRef.current = null;
        }
        hoveredProvinceNameRef.current = null;
        const hoverSrc = map.getSource('turkey-hover-geo') as maplibregl.GeoJSONSource | undefined;
        if (hoverSrc) {
          hoverSrc.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
        setHoveredProvince(null);
      });

      // Dismiss hover cards and province label during user drag/pan/zoom
      map.on('movestart', () => {
        setHoveredSettlement(null);
        setTooltipPos(null);
        if (hoveredProvinceIdRef.current !== null) {
          map.setFeatureState(
            { source: 'turkey-geo', id: hoveredProvinceIdRef.current },
            { hover: false }
          );
          hoveredProvinceIdRef.current = null;
        }
        hoveredProvinceNameRef.current = null;
        const hoverSrc = map.getSource('turkey-hover-geo') as maplibregl.GeoJSONSource | undefined;
        if (hoverSrc) {
          hoverSrc.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
        setHoveredProvince(null);
      });

      // Scale bar and zoom updater on moveend (NEVER on move, zero re-renders while dragging)
      map.on('moveend', () => {
        const z = map.getZoom();
        setCurrentZoom(z);
        const raw = 1600 / Math.pow(2, z - 4);
        if (raw >= 150) setScaleKm(200);
        else if (raw >= 75) setScaleKm(100);
        else if (raw >= 35) setScaleKm(50);
        else setScaleKm(25);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run only once to initialize WebGL map instance

  // Keep the cartographic palette synchronized with the UI theme without recreating the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyTheme = () => applyAtlasMapTheme(map, theme);
    if (map.isStyleLoaded()) {
      applyTheme();
      return;
    }

    map.once('load', applyTheme);
    return () => {
      map.off('load', applyTheme);
    };
  }, [theme]);

  // 2. Update Sites GeoJSON Source when settlements list or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('sites-geo') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(sitesGeoJSON);
    }
  }, [sitesGeoJSON]);

  // 3. Update Sea Labels and active Province Hover Label when language switches
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('sea-labels') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(getSeaLabelsGeoJSON(lang));
    }

    // Also immediately update active province hover label if one is currently visible
    if (hoveredProvinceNameRef.current) {
      const activeName = hoveredProvinceNameRef.current;
      const centroid = getProvinceCentroid(activeName);
      const hoverSrc = map.getSource('turkey-hover-geo') as maplibregl.GeoJSONSource | undefined;
      if (hoverSrc && centroid) {
        hoverSrc.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: centroid
              },
              properties: {
                name: getFormattedProvinceLabel(activeName, lang)
              }
            }
          ]
        });
      }
    }
  }, [lang]);

  // 4. Update Turkey GeoJSON when prefetch completes
  useEffect(() => {
    if (!geoData) return;
    geoDataRef.current = geoData;
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('turkey-geo') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(processTurkeyGeo(geoData));
    }
  }, [geoData]);

  // 5. Update Surrounding Countries GeoJSON when prefetch completes
  useEffect(() => {
    if (!surroundingGeoData) return;
    surroundingGeoDataRef.current = surroundingGeoData;
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('surrounding-geo') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(surroundingGeoData);
    }
  }, [surroundingGeoData]);

  // 6. Handle Programmatic Center & Zoom (e.g. site selection or "Ana haritada göster")
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (focusTarget && focusTarget.timestamp !== lastFocusTimestampRef.current) {
      lastFocusTimestampRef.current = focusTarget.timestamp;
      setHoveredSettlement(null);
      setTooltipPos(null);
      map.easeTo({
        center: focusTarget.center,
        zoom: Math.max(map.getZoom(), 8.2),
        duration: 900
      });
    } else if (selectedSettlement) {
      setHoveredSettlement(null);
      setTooltipPos(null);
      map.easeTo({
        center: [selectedSettlement.longitude, selectedSettlement.latitude],
        zoom: Math.max(map.getZoom(), 7.8),
        duration: 800
      });
    }
  }, [selectedSettlement, focusTarget]);

  // Map Control Actions
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 300 });
  }, []);

  const handleResetView = useCallback(() => {
    mapRef.current?.easeTo({
      center: ANATOLIA_DEFAULT_CENTER,
      zoom: ANATOLIA_DEFAULT_ZOOM,
      duration: 800
    });
  }, []);

  const handleToggleLabels = useCallback(() => {
    setShowAllLabels(prev => {
      const next = !prev;
      const map = mapRef.current;
      if (map && map.getLayer('sites-labels')) {
        map.setLayoutProperty('sites-labels', 'text-allow-overlap', next);
        map.setLayoutProperty('sites-labels', 'text-ignore-placement', next);
      }
      return next;
    });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#DFE9E6]">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Hover Tooltip: STRICTLY closed when settlement detail panel is open */}
      {hoveredSettlement && tooltipPos && !selectedSettlement && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`
          }}
        >
          <div className="bg-[#FAF7F2] text-[#241E19] border border-[#D9CEBC] shadow-xl p-2.5 w-[265px] text-xs backdrop-blur-xs">
            {/* Top row: Location & Site Type Badge */}
            <div className="flex items-start justify-between gap-1.5 border-b border-[#EBE3D5] pb-1 mb-1.5">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-[#736655] font-sans font-semibold tracking-wider block truncate">
                  {lang === 'tr'
                    ? (hoveredSettlement.provinceTR || hoveredSettlement.province)
                    : (hoveredSettlement.provinceEN || hoveredSettlement.province)}
                  {hoveredSettlement.district
                    ? ` · ${lang === 'tr' ? (hoveredSettlement.districtTR || hoveredSettlement.district) : (hoveredSettlement.districtEN || hoveredSettlement.district)}`
                    : ''}
                </span>
              </div>
              {hoveredSettlement.siteType && (
                <span className="shrink-0 text-[9px] uppercase font-semibold text-[#8A4526] bg-[#F4E9DF] border border-[#E8D4C4] px-1.5 py-0.5 max-w-[140px] leading-tight text-right truncate">
                  {Array.isArray(hoveredSettlement.siteType)
                    ? hoveredSettlement.siteType.join(', ')
                    : hoveredSettlement.siteType}
                </span>
              )}
            </div>

            {/* Site Name */}
            <h4 className="font-serif font-bold text-sm text-[#1C1712] leading-snug break-words mb-1">
              {hoveredSettlement.name}
            </h4>

            {/* Informative summary snippet */}
            {hoveredSettlement.overview && hoveredSettlement.overview.length > 0 && (
              <p className="font-prose text-[10.5px] text-[#42372B] leading-snug mb-1.5 line-clamp-2">
                {typeof hoveredSettlement.overview[0] === 'string'
                  ? hoveredSettlement.overview[0]
                  : (hoveredSettlement.overview[0] as any)?.text || ''}
              </p>
            )}

            {/* Periods */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              {hoveredSettlement.periodDetails && hoveredSettlement.periodDetails.length > 0
                ? hoveredSettlement.periodDetails.slice(0, 3).map(pd => {
                    const cfg = getPeriodConfig(pd.periodId || pd.period);
                    const periodLabel = getPeriodLabel(pd.periodId || pd.period, lang);
                    return (
                      <span
                        key={pd.period}
                        className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 border"
                        style={getPeriodChipStyle(cfg, theme)}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: getPeriodDotColor(cfg.color, theme) }}
                        />
                        {periodLabel}
                      </span>
                    );
                  })
                : hoveredSettlement.periods.slice(0, 3).map(period => {
                    const config = getPeriodConfig(period);
                    const periodLabel = getPeriodLabel(period, lang);
                    return (
                      <span
                        key={period}
                        className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 border"
                        style={getPeriodChipStyle(config, theme)}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: getPeriodDotColor(config.color, theme) }}
                        />
                        {periodLabel}
                      </span>
                    );
                  })}
              {hoveredSettlement.periods.length > 3 && (
                <span className="text-[9px] text-[#8C7D6B] font-mono self-center">
                  +{hoveredSettlement.periods.length - 3}
                </span>
              )}
            </div>

            {/* Dating Info: formatted accurately */}
            <div className="text-[9.5px] text-[#695C4D] pt-1 border-t border-[#EBE3D5] flex items-center justify-between gap-2">
              <span className="shrink-0 font-medium">{t('Tarih:', 'Date:')}</span>
              <span className="font-mono text-[#29221B] text-right truncate">
                {hoveredSettlement.occupation?.display ||
                  formatDateRange(
                    hoveredSettlement.startYear ??
                      (hoveredSettlement.occupation?.startBCE
                        ? -hoveredSettlement.occupation.startBCE
                        : undefined),
                    hoveredSettlement.endYear ??
                      (hoveredSettlement.occupation?.endBCE
                        ? -hoveredSettlement.occupation.endBCE
                        : undefined),
                    lang
                  )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cartographic Compass Rose & Scale Bar (Bottom-Left) */}
      <div
        className={`absolute left-5 z-20 pointer-events-none select-none flex flex-col items-center transition-[bottom] duration-200 ${
          bottomUiInset ? 'bottom-[136px] sm:bottom-[142px]' : 'bottom-5'
        }`}
      >
        <div className="w-10 h-10 relative flex items-center justify-center bg-[#FAF7F2]/90 backdrop-blur-xs rounded-full border border-[#D9CEBC] shadow-xs">
          <svg viewBox="0 0 40 40" className="w-7 h-7">
            <circle cx="20" cy="20" r="17" fill="none" stroke="#C5B6A0" strokeWidth="0.75" />
            <polygon points="20,4 23,20 20,18" fill="#8A4526" />
            <polygon points="20,4 17,20 20,18" fill="#5F2E18" />
            <polygon points="20,36 23,20 20,22" fill="#D6C7B2" />
            <polygon points="20,36 17,20 20,22" fill="#BAAA94" />
            <polygon points="36,20 20,23 22,20" fill="#BAAA94" />
            <polygon points="36,20 20,17 22,20" fill="#D6C7B2" />
            <polygon points="4,20 20,23 18,20" fill="#BAAA94" />
            <polygon points="4,20 20,17 18,20" fill="#D6C7B2" />
            <circle cx="20" cy="20" r="1.5" fill="#FAF7F2" stroke="#4A3E31" strokeWidth="0.75" />
          </svg>
          <span className="absolute -top-1 font-serif text-[9px] font-bold text-[#8A4526]">N</span>
        </div>

        {/* Academic Scale Bar */}
        <div className="mt-1.5 bg-[#FAF7F2]/95 backdrop-blur-xs px-2 py-0.5 border border-[#D9CEBC] shadow-xs flex flex-col items-center">
          <div className="flex items-center justify-between text-[8.5px] font-mono text-[#5E5142] w-full gap-2">
            <span>0</span>
            <span>{scaleKm} km</span>
          </div>
          <div className="w-16 h-1 border border-[#5E5142] flex mt-0.5">
            <div className="w-1/2 h-full bg-[#5E5142]" />
            <div className="w-1/2 h-full bg-[#FAF7F2]" />
          </div>
        </div>
      </div>

      {/* Floating Map Navigation Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-1.5 shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 bg-[#FAF7F2] hover:bg-white text-[#2B231B] border border-[#D9CEBC] flex items-center justify-center transition-colors shadow-xs"
          title={t('Yakınlaştır (+)', 'Zoom In (+)')}
          aria-label={t('Yakınlaştır', 'Zoom In')}
        >
          <Plus size={16} weight="bold" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 bg-[#FAF7F2] hover:bg-white text-[#2B231B] border border-[#D9CEBC] flex items-center justify-center transition-colors shadow-xs"
          title={t('Uzaklaştır (-)', 'Zoom Out (-)')}
          aria-label={t('Uzaklaştır', 'Zoom Out')}
        >
          <Minus size={16} weight="bold" />
        </button>

        <button
          type="button"
          onClick={handleResetView}
          className="w-8 h-8 bg-[#FAF7F2] hover:bg-white text-[#2B231B] border border-[#D9CEBC] flex items-center justify-center transition-colors shadow-xs"
          title={t('Görünümü Sıfırla (Anadolu)', 'Reset View (Anatolia)')}
          aria-label={t('Görünümü Sıfırla', 'Reset View')}
        >
          <ArrowCounterClockwise size={15} weight="regular" />
        </button>

        <button
          type="button"
          onClick={handleToggleLabels}
          className={`w-8 h-8 border flex items-center justify-center transition-colors shadow-xs ${
            showAllLabels
              ? 'bg-[#8A4526] text-white border-[#8A4526]'
              : 'bg-[#FAF7F2] hover:bg-white text-[#2B231B] border-[#D9CEBC]'
          }`}
          title={
            showAllLabels
              ? t('Sadece Önemli İsimleri Göster', 'Show Only Key Site Names')
              : t('Tüm Yerleşim İsimlerini Göster', 'Show All Site Names')
          }
          aria-label={t('Yerleşim İsimlerini Aç/Kapat', 'Toggle Site Names')}
        >
          {showAllLabels ? <EyeSlash size={15} weight="regular" /> : <Eye size={15} weight="regular" />}
        </button>
      </div>
    </div>
  );
};
