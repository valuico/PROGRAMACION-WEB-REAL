export const DEFAULT_PRODUCTS = {
  makeup: [
    { id: 1, nombre: "Pro Filt'r Foundation", p: 'Soft Matte Longwear', precio: 50000, img: '/foundation-haze.png', tones: ['Light', 'Medium', 'Warm', 'Deep'], categoria: 'cara' },
    { id: 2, nombre: "We're Even Concealer", p: 'Hydrating Longwear', precio: 52300, img: '/concelears-haze.png', tones: ['Light', 'Medium', 'Warm', 'Deep'], categoria: 'cara' },
    { id: 3, nombre: 'Radiant Stick Duo', p: 'Iluminador en Barra', precio: 42500, img: '/highlighters.png', tones: ['Golden Glow', 'Rose Stick', 'Silver Stow'], categoria: 'cara' },
    { id: 4, nombre: 'Invisimatte Setting Powder', p: 'Polvos Volátiles', precio: 55000, img: '/polvos-volatiles.png', tones: ['Butter', 'Lavender'], categoria: 'cara' },
    { id: 5, nombre: 'Double Take Blush', p: 'Dúo Polvo y Crema', precio: 48900, img: '/blushes-haze.png', tones: ['Peony', 'Coral Haze', 'Rosewood', 'Sunset'], categoria: 'cara' },
    { id: 6, nombre: 'Mist & Fix Spray', p: 'Larga Duración', precio: 39000, img: '/setting-spray-2.png', tones: [], categoria: 'cara' },
    { id: 7, nombre: 'Iconic Matte Lipstick', p: 'Labial en barra', precio: 42900, img: '/labiales.png', tones: ['Deep Red', 'True Scarlet', 'Dusty Rose', 'Terracotta', 'Nude Beige', 'Honey Nude'], categoria: 'labios' },
    { id: 8, nombre: 'Precision Lip Shaper', p: 'Delineador de labios', precio: 31500, img: '/lip-liner.png', tones: ['Pale Lilac', 'Warm Pink', 'Berry Bite', 'Deep Cocoa'], categoria: 'labios' },
    { id: 9, nombre: 'Gloss Bomb Crystal', p: 'Brillo labial efecto espejo', precio: 38200, img: '/lipgloss.png', tones: ['Diamond Milk', 'Pink Dragonfly', 'Fussy', 'Hot Chocolit'], categoria: 'labios' },
    { id: 10, nombre: 'Ultimate Glow Palette', p: '12 High-Pigment Shades', precio: 65800, img: '/paleta-sombras.png', tones: [], categoria: 'ojos' },
    { id: 11, nombre: 'Hella Thicc Mascara', p: 'Volumizing & Lift', precio: 38500, img: '/mascara-pestañas-haze.png', tones: ['Waterproof', 'Fórmula Original'], categoria: 'ojos' },
    { id: 12, nombre: 'Lineshaper Gel Eyeliner', p: 'Waterproof Gel', precio: 32200, img: '/eyeliners-haze.png', tones: ['Deep Brown', 'Midnight Black'], categoria: 'ojos' }
  ],
  skincare: [
    { id: 13, nombre: 'Hydrating Toner', p: 'Ácido Hialurónico + Lavanda', precio: 35000, img: '/toner-haze.png', tones: [], isNew: true },
    { id: 14, nombre: 'Gentle Cleanser', p: 'Té Verde + Ceramidas', precio: 38500, img: '/cleanser.png', tones: [], isNew: true },
    { id: 15, nombre: 'Daily Moisturizer', p: 'Péptidos + Squalane', precio: 44900, img: '/crema-hidratante.png', tones: [], isNew: true }
  ]
};

function normalizeProductImage(imageUrl, productName) {
  const imageByLegacyPath = {
    '/cream-real.png': '/crema-hidratante.png',
    '/cleanser-real.png': '/cleanser.png',
  };

  const imageByProductName = {
    'Daily Moisturizer': '/crema-hidratante.png',
    'Gentle Cleanser': '/cleanser.png',
    'Hydrating Toner': '/toner-haze.png',
  };

  if (imageUrl && imageByLegacyPath[imageUrl]) {
    return imageByLegacyPath[imageUrl];
  }

  if (imageUrl) {
    return imageUrl;
  }

  return imageByProductName[productName] || '/foundation-haze.png';
}

export function buildProductsFromRows(rows) {
  const grouped = {
    makeup: [],
    skincare: [],
  };

  const seenNames = { makeup: new Set(), skincare: new Set() };

  rows.forEach((row) => {
    const tipo = row.tipo === 'skincare' ? 'skincare' : 'makeup';
    // Deduplicar por nombre para evitar filas repetidas de Supabase
    if (seenNames[tipo].has(row.nombre)) return;
    seenNames[tipo].add(row.nombre);

    const normalized = {
      id: row.id,
      nombre: row.nombre,
      p: row.descripcion_corta || row.descripcion || '',
      precio: Number(row.precio),
      img: normalizeProductImage(row.imagen_url, row.nombre),
      tones: Array.isArray(row.tonos) ? row.tonos : [],
      categoria: row.categoria,
      isNew: Boolean(row.es_nuevo),
    };

    grouped[tipo].push(normalized);
  });

  return grouped;
}

export function getToneColor(tone) {
  const colors = {
    Light: '#f3d9c1',
    Medium: '#e5b38a',
    Warm: '#c3834c',
    Deep: '#633b26',
    'Golden Glow': '#d4af37',
    'Rose Stick': '#eec0c8',
    'Silver Stow': '#e3e4e5',
    Butter: '#f5e1cc',
    Lavender: '#e3e4e5',
    Peony: '#e1959a',
    'Coral Haze': '#f17f5a',
    Rosewood: '#bb6d6d',
    Sunset: '#c47645',
    'Pale Lilac': '#e2d1df',
    'Warm Pink': '#d1a3a4',
    'Berry Bite': '#a35d6a',
    'Deep Cocoa': '#8e6353',
    'Deep Red': '#8b1220',
    'True Scarlet': '#b51a1a',
    'Dusty Rose': '#a65e6d',
    Terracotta: '#8d5345',
    'Nude Beige': '#b0816a',
    'Honey Nude': '#c8987d',
    'Diamond Milk': '#ffffff',
    'Pink Dragonfly': '#f4ccd3',
    Fussy: '#d0828c',
    'Hot Chocolit': '#a47158',
    Waterproof: '#008fb3',
    'Fórmula Original': '#95789b',
    'Deep Brown': '#5d3a1a',
    'Midnight Black': '#000000',
  };

  return colors[tone] || '#ccc';
}

export function normalizeCartItems(cartRows) {
  return cartRows.map((row) => ({
    rowId: row.id,
    id: row.producto?.id || row.producto_id,
    nombre: row.producto?.nombre || '',
    precio: Number(row.producto?.precio || 0),
    img: normalizeProductImage(row.producto?.imagen_url, row.producto?.nombre),
    selectedTone: row.tono_seleccionado || 'Único',
    cantidad: row.cantidad || 1,
  }));
}
