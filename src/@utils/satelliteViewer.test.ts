import { Asset } from 'src/@types/Asset'
import { hasSatelliteViewer, withSatelliteViewer } from './satelliteViewer'

const assetWith = (additionalInformation?: Record<string, unknown>) =>
  ({
    credentialSubject: { metadata: { additionalInformation } }
  } as unknown as Asset)

describe('satelliteViewer', () => {
  it('shows the viewer only when the flag is true', () => {
    expect(hasSatelliteViewer(assetWith({ satelliteViewer: true }))).toBe(true)
    expect(hasSatelliteViewer(assetWith({ satelliteViewer: false }))).toBe(
      false
    )
    expect(hasSatelliteViewer(assetWith({ satelliteViewer: 'true' }))).toBe(
      false
    )
    expect(hasSatelliteViewer(assetWith())).toBe(false)
    expect(hasSatelliteViewer(undefined)).toBe(false)
  })

  it('sets and clears the flag without touching other information', () => {
    const on = withSatelliteViewer({ termsAndConditions: true }, true)
    expect(on).toEqual({ termsAndConditions: true, satelliteViewer: true })
    expect(withSatelliteViewer(on, false)).toEqual({ termsAndConditions: true })
    expect(withSatelliteViewer(undefined, false)).toEqual({})
  })

  it('does not mutate the input', () => {
    const info = { satelliteViewer: true }
    withSatelliteViewer(info, false)
    expect(info).toEqual({ satelliteViewer: true })
  })
})
