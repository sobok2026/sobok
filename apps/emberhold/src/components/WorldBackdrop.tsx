import Image from 'next/image'
import type { CSSProperties } from 'react'
import campaignArt from '@/app/campaign-panorama.webp'

export const SNOW_PARTICLES = Array.from({ length: 30 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  delay: `${-((index * 0.73) % 9).toFixed(2)}s`,
  duration: `${6 + ((index * 17) % 7)}s`,
  size: `${2 + ((index * 5) % 4)}px`,
  drift: `${-34 + ((index * 19) % 69)}px`,
}))

const CAMPAIGN_ART_STYLES = [
  { objectPosition: '10% center' },
  { objectPosition: '50% center' },
  { objectPosition: '90% center' },
] satisfies CSSProperties[]

const snowflakes = SNOW_PARTICLES.map((flake, index) => (
  <i
    key={`snow-${index}`}
    style={
      {
        '--flake-left': flake.left,
        '--flake-delay': flake.delay,
        '--flake-duration': flake.duration,
        '--flake-size': flake.size,
        '--flake-drift': flake.drift,
      } as CSSProperties
    }
  />
))

type WorldBackdropProps = {
  actNumber: number
  showCampaignArt: boolean
}

export function WorldBackdrop({ actNumber, showCampaignArt }: WorldBackdropProps) {
  return (
    <div aria-hidden="true" className="world-backdrop" data-act={actNumber}>
      {showCampaignArt ? (
        <Image
          className="campaign-backdrop-art"
          src={campaignArt}
          alt=""
          fill
          sizes="100vw"
          placeholder="blur"
          style={CAMPAIGN_ART_STYLES[actNumber - 1] ?? CAMPAIGN_ART_STYLES[0]}
        />
      ) : null}
      <div className="soundscape-wash" />
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="mountain mountain-back" />
      <div className="mountain mountain-front" />
      <div className="snow-field" />
      <div className="snowfall">{snowflakes}</div>
    </div>
  )
}
