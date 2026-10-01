import { Asset } from 'src/@types/Asset'
import { Metadata } from 'src/@types/ddo/Metadata'

// Key in metadata.additionalInformation that turns the satellite viewer on
// for an asset. Set by the "Satellite viewer" checkbox in publish and edit.
export const SATELLITE_VIEWER_KEY = 'satelliteViewer'

// Static page in /public that does the actual map work (Leaflet + PDOK).
export const SATELLITE_VIEWER_URL = '/nederland-geojson.html'

type AdditionalInformation = Metadata['additionalInformation']

export function hasSatelliteViewer(asset: Asset): boolean {
  return (
    asset?.credentialSubject?.metadata?.additionalInformation?.[
      SATELLITE_VIEWER_KEY
    ] === true
  )
}

// Returns a copy of additionalInformation with the flag set or removed,
// keeping everything else the publisher stored there.
export function withSatelliteViewer(
  info: AdditionalInformation,
  enabled: boolean
): AdditionalInformation {
  const next = { ...info }
  if (enabled) next[SATELLITE_VIEWER_KEY] = true
  else delete next[SATELLITE_VIEWER_KEY]
  return next
}
