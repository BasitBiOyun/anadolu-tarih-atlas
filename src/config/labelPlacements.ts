/**
 * Custom placement overrides for settlements that are in dense clusters.
 * This guarantees rock-solid stability across all zoom levels so names never swap or jitter.
 *
 * NOTE on MapLibre text-anchor:
 * The anchor specifies which part of the text box is fixed to the coordinate point:
 * - 'bottom-right': The bottom-right corner of the text box is at the point -> Text appears to the TOP-LEFT (North-West) of the point!
 * - 'top-left': The top-left corner of the text box is at the point -> Text appears to the BOTTOM-RIGHT (South-East) of the point!
 * - 'bottom-left': Text appears to the TOP-RIGHT (North-East) of the point!
 * - 'top-right': Text appears to the BOTTOM-LEFT (South-West) of the point!
 * - 'right': Text appears to the LEFT of the point!
 * - 'left': Text appears to the RIGHT of the point!
 * - 'bottom': Text appears ABOVE the point!
 * - 'top': Text appears BELOW the point!
 */

export interface LabelPlacementConfig {
  anchor: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const SETTLEMENT_LABEL_OVERRIDES: Record<string, LabelPlacementConfig> = {
  // --- Cappadocia Cluster ---
  // Aşıklı Höyük is North-West of Kaletepe Deresi 3:
  // We place Aşıklı's label to the TOP-LEFT of its marker -> anchor 'bottom-right'
  'asikli-hoyuk': {
    anchor: 'bottom-right'
  },
  // Kaletepe Deresi 3 is South-East of Aşıklı Höyük:
  // We place KD3's label to the BOTTOM-RIGHT of its marker -> anchor 'top-left'
  'kaletepe-deresi-3': {
    anchor: 'top-left'
  },

  // --- Çorum Hittite Cluster ---
  // Hattuşa (South): place label to the South-West -> anchor 'top-right'
  'hattusa': {
    anchor: 'top-right'
  },
  // Alacahöyük (North-East of Hattusa): place label to the North-East -> anchor 'bottom-left'
  'alacahoyuk': {
    anchor: 'bottom-left'
  },

  // --- Lycia Sanctuary & City Cluster ---
  // Xanthos (North): place label to the North-West -> anchor 'bottom-right'
  'xanthos': {
    anchor: 'bottom-right'
  },
  // Letoon (South, 6km from Xanthos): place label to the South-East -> anchor 'top-left'
  'letoon': {
    anchor: 'top-left'
  },

  // --- Pisidia / Burdur Cluster ---
  // Sagalassos (Ağlasun, North): place label to the North-East -> anchor 'bottom-left'
  'sagalassos': {
    anchor: 'bottom-left'
  },
  // Hacılar (West of Burdur Lake): place label to the West / South-West -> anchor 'right'
  'hacilar': {
    anchor: 'right'
  },
  // Höyücek (South in Bucak): place label to the South-East -> anchor 'top-left'
  'hoyucek': {
    anchor: 'top-left'
  },

  // --- Şanlıurfa / Taş Tepeler Cluster ---
  // Göbeklitepe is North-West of Karahantepe:
  // We place Göbeklitepe's label to the TOP-LEFT / North-West -> anchor 'bottom-right'
  'gobekli-tepe': {
    anchor: 'bottom-right'
  },
  // Karahantepe is South-East of Göbeklitepe:
  // We place Karahantepe's label to the BOTTOM-RIGHT / South-East -> anchor 'top-left'
  'karahantepe': {
    anchor: 'top-left'
  },
  // Nevali Çori is further North near Hilvan/Euphrates:
  // Place to the North-West -> anchor 'bottom-right'
  'nevali-cori': {
    anchor: 'bottom-right'
  },

  // --- Antalya Cave Cluster ---
  // Karain Cave is North / elevated:
  // Place label to the TOP-LEFT -> anchor 'bottom-right'
  'karain': {
    anchor: 'bottom-right'
  },
  // Öküzini Cave is just ~1.5km South-East of Karain:
  // Place label to the BOTTOM-RIGHT -> anchor 'top-left'
  'okuzini': {
    anchor: 'top-left'
  },
  // Beldibi is South along the Kemer coast:
  // Place label to the South / South-West -> anchor 'top-right'
  'beldibi': {
    anchor: 'top-right'
  },
  // Perge is in Pamphylian plain east of Antalya:
  'perge': {
    anchor: 'top-left'
  },

  // --- Istanbul / Marmara Sea ---
  // Yarımburgaz Cave is in Başakşehir north of Küçükçekmece:
  // Place label safely inland to the North-East into Thrace -> anchor 'bottom-left'
  'yarimburgaz': {
    anchor: 'bottom-left'
  },

  // --- Upper Tigris Cluster ---
  // Körtik Tepe (South / Bismil):
  // Place label to South-West -> anchor 'top-right'
  'kortik-tepe': {
    anchor: 'top-right'
  },
  // Çayönü (North-West / Ergani):
  // Place label to North-West -> anchor 'bottom-right'
  'cayonu': {
    anchor: 'bottom-right'
  },
  // Hallan Çemi (North-East / Batman-Kozluk):
  // Place label to North-East -> anchor 'bottom-left'
  'hallan-cemi': {
    anchor: 'bottom-left'
  }
};
