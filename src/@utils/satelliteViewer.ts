import { Asset } from 'src/@types/Asset'

// Key in metadata.additionalInformation that turns the satellite viewer on
// for an asset. The publish/edit forms should write `true` here when the
// publisher ticks "Add a satellite viewer to this asset".
export const SATELLITE_VIEWER_KEY = 'satelliteViewer'

// Static page in /public that does the actual map work (Leaflet + PDOK).
export const SATELLITE_VIEWER_URL = '/nederland-geojson.html'

// Preview only: comma-separated DIDs that get the viewer without the
// metadata flag, so it can be tried on existing assets before the publish
// checkbox exists. Leave unset in production.
const PREVIEW_DIDS = (process.env.NEXT_PUBLIC_SATELLITE_VIEWER_DIDS || '')
  .split(',')
  .map((did) => did.trim())
  .filter(Boolean)

export function hasSatelliteViewer(asset: Asset): boolean {
  if (!asset) return false
  const info = asset.credentialSubject?.metadata?.additionalInformation
  return (
    info?.[SATELLITE_VIEWER_KEY] === true || PREVIEW_DIDS.includes(asset.id)
  )
}
