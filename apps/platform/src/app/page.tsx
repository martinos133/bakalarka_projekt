'use client'

import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Hero from '@/components/Hero'
import PopularServices from '@/components/PopularServices'
import Categories from '@/components/Categories'
import MadeOnRentMe from '@/components/MadeOnFiverr'
import TopFreelancers from '@/components/TopFreelancers'
import Testimonials from '@/components/Testimonials'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'

function HomeInner() {
  return (
    <main className="min-h-screen bg-dark">
      <Header />
      <CategoryNav />
      <Hero />
      <PopularServices />
      <Categories />
      <MadeOnRentMe />
      <TopFreelancers />
      <Testimonials />
      <Footer />
    </main>
  )
}

export default function Home() {
  return (
    <CmsGate cmsSlug="home">
      <HomeInner />
    </CmsGate>
  )
}
