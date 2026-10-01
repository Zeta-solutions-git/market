import { ReactElement } from 'react'
import { SATELLITE_VIEWER_URL } from '@utils/satelliteViewer'
import sectionStyles from './index.module.css'
import styles from './SatelliteViewer.module.css'

// Map of the Netherlands where buyers draw or pick an area and copy it as
// GeoJSON, e.g. to fill in the area parameter when ordering this asset.
// The map itself is a static page so it keeps Leaflet out of the app bundle.
export default function SatelliteViewer(): ReactElement {
  return (
    <section id="satellite-viewer" className={sectionStyles.section}>
      <div className={styles.header}>
        <h2 className={sectionStyles.sectionTitle}>Satellite viewer</h2>
        <a
          href={SATELLITE_VIEWER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.fullscreen}
        >
          Open full screen
        </a>
      </div>
      <p className={sectionStyles.muted}>
        Draw an area or pick provinces, municipalities or neighbourhoods on the
        map, then copy the GeoJSON to use when you order this asset.
      </p>
      <iframe
        src={SATELLITE_VIEWER_URL}
        title="Satellite viewer: select an area in the Netherlands"
        className={styles.frame}
        loading="lazy"
        allow="clipboard-write"
      />
    </section>
  )
}
