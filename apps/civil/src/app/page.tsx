import CivilHeader from '@/components/CivilHeader'
import LandingHero from '@/components/LandingHero'
import ProductModules from '@/components/ProductModules'

export default function HomePage() {
  return (
    <div className="civil-shell">
      <CivilHeader />
      <main>
        <LandingHero />
        <ProductModules />
      </main>
    </div>
  )
}
