import { useEffect, useState } from 'react'
import { CircleHelp, MapPin, RotateCcw } from 'lucide-react'
import { CircleMarker, MapContainer, Marker, Rectangle, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { GeographicBounds, GeographicPoint } from '../../types'

interface MapSelectorProps {
  center: [number, number]
  value: GeographicBounds | null
  point: GeographicPoint | null
  onChange: (bounds: GeographicBounds | null) => void
  onPointChange: (point: GeographicPoint | null) => void
  onValidationChange?: (error: string | null) => void
}

type CoordinateDraft = Partial<GeographicBounds>

function MapController({ center, bounds, point }: { center: [number, number]; bounds: GeographicBounds | null; point: GeographicPoint | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]], { padding: [24, 24] })
    else if (point) map.setView([point.latitude, point.longitude], 6)
    else map.setView(center, 4)
  }, [bounds, center, map, point])
  return null
}

function ClickToBounds({ onCorner }: { onCorner: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) { onCorner(event.latlng.lat, event.latlng.lng) },
  })
  return null
}

function ResizeHandles({ bounds, onChange }: { bounds: GeographicBounds; onChange: (bounds: GeographicBounds) => void }) {
  const handles = [
    { key: 'south-west', latitude: bounds.south, longitude: bounds.west },
    { key: 'south-east', latitude: bounds.south, longitude: bounds.east },
    { key: 'north-west', latitude: bounds.north, longitude: bounds.west },
    { key: 'north-east', latitude: bounds.north, longitude: bounds.east },
  ]

  function moveHandle(key: string, latitude: number, longitude: number) {
    const next = { ...bounds }
    if (key.includes('south')) next.south = Math.min(latitude, bounds.north - 0.01)
    if (key.includes('north')) next.north = Math.max(latitude, bounds.south + 0.01)
    if (key.includes('west')) next.west = Math.min(longitude, bounds.east - 0.01)
    if (key.includes('east')) next.east = Math.max(longitude, bounds.west + 0.01)
    onChange(next)
  }

  return <>
    {handles.map((handle) => <Marker
      key={handle.key}
      position={[handle.latitude, handle.longitude]}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const position = event.target.getLatLng()
          moveHandle(handle.key, position.lat, position.lng)
        },
      }}
    />)}
  </>
}

const coordinateFields: Array<{ key: keyof GeographicBounds; label: string }> = [
  { key: 'south', label: 'Latitud sur' },
  { key: 'north', label: 'Latitud norte' },
  { key: 'west', label: 'Longitud oeste' },
  { key: 'east', label: 'Longitud este' },
]

export function MapSelector({ center, value, point, onChange, onPointChange, onValidationChange }: MapSelectorProps) {
  const [firstCorner, setFirstCorner] = useState<[number, number] | null>(null)
  const [draft, setDraft] = useState<CoordinateDraft>(value ?? {})
  const [selectionMode, setSelectionMode] = useState<'rectangle' | 'point'>('rectangle')
  const [message, setMessage] = useState('Haz dos clics en el mapa para definir esquinas opuestas.')
  const [tilesUnavailable, setTilesUnavailable] = useState(false)

  useEffect(() => { setDraft(value ?? {}) }, [value])
  useEffect(() => {
    if (point) {
      setSelectionMode('point')
       setMessage(`Punto seleccionado: ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}.`)
    }
  }, [point])

  function setCorner(latitude: number, longitude: number) {
    longitude = ((longitude + 180) % 360 + 360) % 360 - 180
    if (selectionMode === 'point') {
      onValidationChange?.(null)
      onChange(null)
      onPointChange({ latitude, longitude })
       setMessage(`Punto seleccionado: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}.`)
      return
    }
    if (!firstCorner) {
      onValidationChange?.('Completa el rectángulo seleccionando la segunda esquina.')
      setFirstCorner([latitude, longitude])
      setMessage('Esquina inicial seleccionada. Haz clic en la esquina opuesta.')
      return
    }
    const bounds = {
      south: Math.min(firstCorner[0], latitude),
      north: Math.max(firstCorner[0], latitude),
      west: Math.min(firstCorner[1], longitude),
      east: Math.max(firstCorner[1], longitude),
    }
    setFirstCorner(null)
    onValidationChange?.(null)
    setDraft(bounds)
    onPointChange(null)
    onChange(bounds)
     setMessage('Área definida. Arrastra las esquinas azules o edita las coordenadas para ajustar el tamaño.')
  }

  function updateCoordinate(key: keyof GeographicBounds, rawValue: string) {
    const parsed = rawValue === '' ? undefined : Number(rawValue)
    const next = { ...draft, [key]: parsed }
    setDraft(next)
    const coordinates = [next.south, next.north, next.west, next.east]
    if (coordinates.some((coordinate) => coordinate === undefined || !Number.isFinite(coordinate))) {
      onValidationChange?.('Completa las cuatro coordenadas para continuar.')
      setMessage('Completa las cuatro coordenadas para aplicar el rectángulo.')
      return
    }
    if (next.south! < -90 || next.south! > 90 || next.north! < -90 || next.north! > 90 || next.west! < -180 || next.west! > 180 || next.east! < -180 || next.east! > 180) {
      onValidationChange?.('Latitudes: −90 a 90. Longitudes: −180 a 180.')
      setMessage('Latitudes: −90 a 90. Longitudes: −180 a 180.')
      return
    }
    if (next.south! >= next.north! || next.west! >= next.east!) {
      onValidationChange?.('Sur debe ser menor que norte y oeste menor que este.')
      setMessage('Verifica que sur sea menor que norte y oeste menor que este.')
      return
    }
    onPointChange(null)
    onValidationChange?.(null)
    onChange({ south: next.south!, north: next.north!, west: next.west!, east: next.east! })
     setMessage('Coordenadas aplicadas. Arrastra las esquinas azules o edítalas para ajustar el tamaño.')
  }

  function clearSelection() {
    onValidationChange?.(null)
    setDraft({})
    setFirstCorner(null)
    onPointChange(null)
    onChange(null)
    setMessage('Área limpiada. Haz dos clics en el mapa para comenzar.')
  }

  return (
    <section id="region" aria-labelledby="map-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="map-title" className="text-sm font-semibold">Delimita un área de interés</h2><p className="mt-1 text-xs leading-relaxed text-muted">Selecciona dos esquinas, o escribe las coordenadas geográficas.</p></div>
        <button type="button" onClick={clearSelection} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-xs text-muted hover:text-ink"><RotateCcw size={14} aria-hidden="true" />Limpiar área</button>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
         <button type="button" aria-pressed={selectionMode === 'rectangle'} onClick={() => { setSelectionMode('rectangle'); setFirstCorner(null); onValidationChange?.('Selecciona dos esquinas para completar el rectángulo.'); setMessage('Haz dos clics en el mapa para definir esquinas opuestas.') }} className={`min-h-9 rounded-lg border px-3 text-xs ${selectionMode === 'rectangle' ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted'}`}>Dibujar rectángulo</button>
         <button type="button" aria-pressed={selectionMode === 'point'} onClick={() => { setSelectionMode('point'); setFirstCorner(null); onValidationChange?.('Selecciona un punto en el mapa para continuar.'); setMessage('Haz clic en el mapa para seleccionar un punto.') }} className={`min-h-9 rounded-lg border px-3 text-xs ${selectionMode === 'point' ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted'}`}>Seleccionar punto</button>
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-72 w-full sm:h-96" aria-label="Mapa para definir un rectángulo geográfico">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesUnavailable(true) }} />
          <MapController center={center} bounds={value} point={point} />
          <ClickToBounds onCorner={setCorner} />
          {firstCorner && <CircleMarker center={firstCorner} radius={6} pathOptions={{ color: '#1d4ed8' }} />}
          {point && <CircleMarker center={[point.latitude, point.longitude]} radius={7} pathOptions={{ color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.9 }} />}
            {value && <><Rectangle bounds={[[value.south, value.west], [value.north, value.east]]} pathOptions={{ color: '#1d4ed8', fillOpacity: 0.12 }} /><ResizeHandles bounds={value} onChange={(bounds) => { onValidationChange?.(null); setFirstCorner(null); onPointChange(null); onChange(bounds); setDraft(bounds); setMessage('Área redimensionada. Se enviará al backend al generar el análisis.') }} /></>}
        </MapContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {coordinateFields.map(({ key, label }) => <label key={key} className="text-xs font-medium">{label}<input type="number" step="any" min={key === 'south' || key === 'north' ? -90 : -180} max={key === 'south' || key === 'north' ? 90 : 180} value={draft[key] ?? ''} onChange={(event) => updateCoordinate(key, event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm" /></label>)}
      </div>
       <p role="status" aria-live="polite" className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted"><MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{message}</p>
      {point && <p className="mt-1 text-xs text-muted">Punto: {point.latitude.toFixed(4)}° lat, {point.longitude.toFixed(4)}° lon.</p>}
      {value && <p className="mt-1 text-xs text-muted">Área: {value.south.toFixed(3)}° a {value.north.toFixed(3)}° lat; {value.west.toFixed(3)}° a {value.east.toFixed(3)}° lon.</p>}
      {tilesUnavailable && <p role="status" className="mt-2 text-xs text-muted">No se pudieron cargar las teselas del mapa. Puedes continuar con la selección manual de coordenadas.</p>}
        <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted"><CircleHelp size={14} className="mt-0.5 shrink-0" aria-hidden="true" />Puedes dibujar el área, arrastrar sus esquinas o editar sus coordenadas. NASA POWER admite rectángulos de 2° a 10° en cada eje; para áreas menores usa un punto. Limpiar área restaura la región predefinida.</p>
    </section>
  )
}
