import type { DataConfiguration, DataSource, DemoExample, EnvironmentalVariable, Region, RegionId, ScientificVariable, TimeSeriesPoint } from '../types'

// Valores ficticios para probar la interfaz. No proceden de observaciones ni de NASA.
export const variables: ScientificVariable[] = [
  {
    id: 'temperature',
    name: 'Temperatura',
    description: 'Temperatura del aire cerca de la superficie.',
    unit: '°C',
    measurement: 'Grados Celsius',
  },
  {
    id: 'precipitation',
    name: 'Precipitación',
    description: 'Precipitación acumulada durante el mes.',
    unit: 'mm',
    measurement: 'Milímetros',
  },
]

export const dataSources: DataSource[] = [
  { id: 'local-demo', name: 'Dataset sintético de demostración', organization: 'Earth System Trend Detective', description: 'Serie mensual local · 2001–2025 · No son observaciones científicas', available: true, status: 'demo', variables: ['Temperatura del aire', 'Precipitación'], dataType: 'Serie sintética ilustrativa', coverage: null, temporalResolution: 'Mensual', accessMethod: 'Generación local; no consulta fuentes externas.' },
  { id: 'gpm', name: 'Global Precipitation Measurement (GPM)', organization: 'NASA / JAXA', description: 'Misión de observación de precipitación. Producto, unidades, periodo y resolución por validar antes de integrar.', available: false, status: 'pending', variables: ['Precipitación'], dataType: 'Observación satelital', coverage: null, temporalResolution: null, accessMethod: 'NASA Earthdata; flujo de acceso pendiente de validar.', url: 'https://gpm.nasa.gov/data' },
  { id: 'modis', name: 'MODIS', organization: 'NASA', description: 'Instrumento a bordo de las misiones Terra y Aqua. El producto específico debe seleccionarse y verificarse.', available: false, status: 'pending', variables: ['Índice de vegetación', 'Temperatura superficial', 'Aerosoles'], dataType: 'Observación satelital', coverage: null, temporalResolution: null, accessMethod: 'NASA AppEEARS / Earthdata; integración pendiente.', url: 'https://appeears.earthdatacloud.nasa.gov/' },
  { id: 'omi', name: 'Ozone Monitoring Instrument (OMI)', organization: 'NASA / KNMI', description: 'Instrumento de observación atmosférica. Variables y producto exacto por validar.', available: false, status: 'pending', variables: ['Ozono', 'Aerosoles'], dataType: 'Observación satelital', coverage: null, temporalResolution: null, accessMethod: 'NASA Earthdata / Giovanni; integración pendiente.', url: 'https://giovanni.gsfc.nasa.gov/giovanni/' },
  { id: 'airs', name: 'Atmospheric Infrared Sounder (AIRS)', organization: 'NASA', description: 'Instrumento de sondeo atmosférico. Producto, variable y resolución por validar.', available: false, status: 'pending', variables: ['Temperatura del aire', 'Humedad'], dataType: 'Observación satelital', coverage: null, temporalResolution: null, accessMethod: 'NASA Earthdata / Giovanni; integración pendiente.', url: 'https://www.earthdata.nasa.gov/data/instruments/airs' },
  { id: 'merra-2', name: 'MERRA-2', organization: 'NASA GMAO', description: 'Reanálisis atmosférico. El campo y la resolución adecuados dependen del producto seleccionado.', available: false, status: 'pending', variables: ['Temperatura', 'Humedad', 'Aerosoles'], dataType: 'Reanálisis', coverage: null, temporalResolution: null, accessMethod: 'NASA GES DISC; integración pendiente.', url: 'https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/' },
  { id: 'gldas', name: 'GLDAS', organization: 'NASA / NOAA', description: 'Sistema de asimilación de datos terrestres. El producto/campo debe verificarse antes de uso.', available: false, status: 'pending', variables: ['Humedad del suelo', 'Evapotranspiración'], dataType: 'Modelo / asimilación', coverage: null, temporalResolution: null, accessMethod: 'NASA Earthdata / Giovanni; integración pendiente.', url: 'https://ldas.gsfc.nasa.gov/gldas' },
  { id: 'giovanni', name: 'NASA Giovanni', organization: 'NASA GES DISC', description: 'Herramienta web para explorar y visualizar datasets; el acceso y la serie deben validarse por producto.', available: false, status: 'requires-configuration', variables: ['Según datasets disponibles'], dataType: 'Plataforma de análisis', coverage: null, temporalResolution: null, accessMethod: 'Interfaz web; automatización y exportación no implementadas.', url: 'https://giovanni.gsfc.nasa.gov/giovanni/' },
  { id: 'nasa-earthdata', name: 'NASA Earthdata', organization: 'NASA', description: 'Portal y servicios de acceso a datos de ciencias de la Tierra; no es un dataset único.', available: false, status: 'requires-configuration', variables: ['Catálogo amplio; depende del producto'], dataType: 'Plataforma de acceso', coverage: null, temporalResolution: null, accessMethod: 'Autenticación y producto requeridos; sin credenciales configuradas.', url: 'https://www.earthdata.nasa.gov/' },
  { id: 'appeears', name: 'NASA AppEEARS', organization: 'NASA LP DAAC', description: 'Servicio de extracción de datos para áreas o puntos. Producto y parámetros por validar.', available: false, status: 'requires-configuration', variables: ['Según producto seleccionado'], dataType: 'Servicio de extracción', coverage: null, temporalResolution: null, accessMethod: 'Cuenta/servicio y configuración requeridos; integración pendiente.', url: 'https://appeears.earthdatacloud.nasa.gov/' },
  { id: 'noaa-cdo', name: 'NOAA Climate Data Online', organization: 'NOAA NCEI', description: 'Catálogo de datos climáticos. Disponibilidad por estación y variable debe verificarse.', available: false, status: 'requires-configuration', variables: ['Según dataset y estación'], dataType: 'Observaciones / catálogo', coverage: null, temporalResolution: null, accessMethod: 'API y token de NOAA requeridos; no configurados.', url: 'https://www.ncei.noaa.gov/cdo-web/' },
]

export const variableCatalog: EnvironmentalVariable[] = [
  { id: 'air-temperature', demoId: 'temperature', name: 'Temperatura del aire', description: 'Estado térmico del aire; la altura y el producto de observación deben especificarse.', category: 'Atmósfera', unit: '°C', measurement: 'Grados Celsius; unidad del demo sintético.', dataType: 'Continua', potentialSources: ['airs', 'merra-2'], temporalResolution: 'Mensual (demo sintético)', geographicCoverage: 'Región predefinida del demo; sin extracción espacial.', integrationStatus: 'demo' },
  { id: 'surface-temperature', name: 'Temperatura superficial', description: 'Temperatura de una superficie observada o modelada; no equivale necesariamente a la temperatura del aire.', category: 'Atmósfera', unit: 'K', measurement: 'Kelvin; unidad de referencia, validar en el producto.', dataType: 'Continua', potentialSources: ['modis'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'ozone', name: 'Concentración de ozono', description: 'Cantidad de ozono atmosférico; especificar columna, perfil o concentración según el producto.', category: 'Atmósfera', unit: 'DU', measurement: 'Unidades Dobson para columna total; validar en el producto.', dataType: 'Continua', potentialSources: ['omi'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'relative-humidity', name: 'Humedad relativa', description: 'Relación entre el vapor de agua presente y la cantidad de saturación a la misma temperatura.', category: 'Atmósfera', unit: '%', measurement: 'Porcentaje; unidad de referencia, validar en el producto.', dataType: 'Continua', potentialSources: ['airs', 'merra-2'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'aerosol-optical-depth', name: 'Aerosoles', description: 'Propiedades ópticas de partículas suspendidas; elegir un indicador y producto antes de analizar.', category: 'Atmósfera', unit: 'Adimensional', measurement: 'Depende del indicador; no se fija sin un producto.', dataType: 'Continua', potentialSources: ['modis', 'omi', 'merra-2'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'precipitation', demoId: 'precipitation', name: 'Precipitación', description: 'Cantidad de precipitación acumulada en cada periodo mensual.', category: 'Hidrología', unit: 'mm', measurement: 'Milímetros mensuales; unidad del demo sintético.', dataType: 'Continua', potentialSources: ['gpm'], temporalResolution: 'Mensual (demo sintético)', geographicCoverage: 'Región predefinida del demo; sin extracción espacial.', integrationStatus: 'demo' },
  { id: 'soil-moisture', name: 'Humedad del suelo', description: 'Contenido de agua en el suelo; profundidad y definición dependen del producto.', category: 'Hidrología', unit: 'm³/m³', measurement: 'Contenido volumétrico; unidad de referencia, validar en el producto.', dataType: 'Continua', potentialSources: ['gldas'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'evapotranspiration', name: 'Evapotranspiración', description: 'Transferencia de agua a la atmósfera por evaporación y transpiración vegetal.', category: 'Hidrología', unit: 'mm', measurement: 'Profundidad acumulada; periodo por definir en el producto.', dataType: 'Continua', potentialSources: ['gldas', 'modis'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'river-discharge', name: 'Caudal de ríos', description: 'Volumen de agua que atraviesa una sección del río por unidad de tiempo; requiere una fuente de caudales.', category: 'Hidrología', unit: 'm³/s', measurement: 'Metros cúbicos por segundo; unidad de referencia.', dataType: 'Continua', potentialSources: [], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'sea-surface-temperature', name: 'Temperatura superficial del mar', description: 'Temperatura de la capa superficial del océano según el sensor y producto seleccionado.', category: 'Océanos', unit: 'K', measurement: 'Kelvin; unidad de referencia, validar en el producto.', dataType: 'Continua', potentialSources: ['modis'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'sea-level', name: 'Nivel del mar', description: 'Altura de la superficie marina referida a un datum y producto definidos.', category: 'Océanos', unit: 'mm', measurement: 'Milímetros; datum y método requieren especificación.', dataType: 'Continua', potentialSources: ['nasa-earthdata'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'salinity', name: 'Salinidad', description: 'Concentración de sales disueltas; la unidad práctica depende del producto.', category: 'Océanos', unit: 'PSU', measurement: 'Unidad práctica de salinidad; validar convención en producto.', dataType: 'Continua', potentialSources: ['nasa-earthdata'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'ndvi', name: 'Índice de vegetación NDVI', description: 'Índice espectral usado para observar verdor y actividad de la vegetación.', category: 'Superficie terrestre', unit: 'Adimensional', measurement: 'Índice; escala y factores de conversión dependen del producto.', dataType: 'Índice', potentialSources: ['modis'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'vegetation-cover', name: 'Cobertura vegetal', description: 'Fracción de superficie clasificada como vegetación; clases y método dependen del producto.', category: 'Superficie terrestre', unit: '%', measurement: 'Porcentaje; unidad de referencia.', dataType: 'Proporción', potentialSources: ['modis'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
  { id: 'land-surface-temperature', name: 'Temperatura de la superficie terrestre', description: 'Temperatura radiométrica de la superficie terrestre; distinta de la temperatura del aire.', category: 'Superficie terrestre', unit: 'K', measurement: 'Kelvin; unidad de referencia, validar en el producto.', dataType: 'Continua', potentialSources: ['modis'], temporalResolution: null, geographicCoverage: null, integrationStatus: 'pending' },
]

export const regions: Region[] = [
  {
    id: 'sonoran-desert',
    name: 'Desierto de Sonora · Phoenix, Arizona',
    description: 'Región árida y cálida',
    prompt: 'En regiones desérticas puede ser interesante investigar el calor y la disponibilidad de lluvia.',
    suggestedVariables: ['temperature', 'precipitation'],
    center: [33.4484, -112.074],
  },
  {
    id: 'amazon-basin',
    name: 'Cuenca del Amazonas',
    description: 'Selva tropical húmeda',
    prompt: 'En una selva tropical, explora si la precipitación o la temperatura muestran una tendencia sostenida.',
    suggestedVariables: ['precipitation', 'temperature'],
    center: [-3.4653, -62.2159],
  },
  {
    id: 'chesapeake-estuary',
    name: 'Estuario de Chesapeake',
    description: 'Estuario de marea',
    prompt: 'En un estuario, las tendencias de temperatura y precipitación pueden ayudar a formular preguntas sobre el sistema local.',
    suggestedVariables: ['precipitation', 'temperature'],
    center: [38.5, -76.4],
  },
  {
    id: 'new-york-city',
    name: 'Área metropolitana de Nueva York',
    description: 'Atmósfera sobre una gran ciudad',
    prompt: 'Sobre una gran ciudad, compara la evolución de la temperatura con la precipitación.',
    suggestedVariables: ['temperature', 'precipitation'],
    center: [40.7128, -74.006],
  },
]

export const demoExamples: DemoExample[] = [
  {
    id: 'desert-heat',
    title: '¿Cómo cambia el calor en el desierto?',
    description: 'Temperatura mensual · Desierto de Sonora · 2001–2025',
    regionId: 'sonoran-desert',
    variableIds: ['temperature'],
  },
  {
    id: 'amazon-rain',
    title: '¿Está cambiando la lluvia en la selva?',
    description: 'Precipitación mensual · Cuenca del Amazonas · 2001–2025',
    regionId: 'amazon-basin',
    variableIds: ['precipitation'],
  },
]

export const defaultConfiguration: DataConfiguration = {
  variableIds: ['temperature', 'precipitation'],
  regionId: 'sonoran-desert',
  timeRange: { startDate: '2001-01-01', endDate: '2025-12-01', interval: 'monthly' },
  sourceId: 'local-demo',
}

const regionProfiles: Record<RegionId, { temperature: number; temperatureTrend: number; precipitation: number; precipitationTrend: number; seasonality: number }> = {
  'sonoran-desert': { temperature: 24, temperatureTrend: 0.035, precipitation: 18, precipitationTrend: -0.08, seasonality: 1 },
  'amazon-basin': { temperature: 26, temperatureTrend: 0.025, precipitation: 165, precipitationTrend: -0.35, seasonality: 0.45 },
  'chesapeake-estuary': { temperature: 15, temperatureTrend: 0.03, precipitation: 92, precipitationTrend: 0.18, seasonality: 0.8 },
  'new-york-city': { temperature: 13, temperatureTrend: 0.04, precipitation: 105, precipitationTrend: 0.12, seasonality: 0.9 },
}

export function createDemoTimeSeries(regionId: RegionId): TimeSeriesPoint[] {
  const profile = regionProfiles[regionId]
  return Array.from({ length: 25 * 12 }, (_, index) => {
    const year = 2001 + Math.floor(index / 12)
    const month = index % 12
    const yearsSinceStart = year - 2001 + month / 12
    const seasonal = Math.sin((month / 12) * Math.PI * 2 - Math.PI / 2)
    const variation = Math.sin(index * 2.37 + regionId.length) * 0.8 + Math.cos(index * 0.71) * 0.45
    const rainfallVariation = Math.sin(index * 1.73 + regionId.length * 2) * 0.2 + Math.cos(index * 0.39) * 0.12

    return {
      date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
      temperature: Number((profile.temperature + profile.temperatureTrend * yearsSinceStart + seasonal * 8 * profile.seasonality + variation).toFixed(1)),
      precipitation: Math.max(0, Number((profile.precipitation + profile.precipitationTrend * yearsSinceStart + seasonal * profile.precipitation * 0.48 + rainfallVariation * profile.precipitation).toFixed(1))),
    }
  })
}

