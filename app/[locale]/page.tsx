
import Header from "@/components/public/landing/header"
import Hero from "@/components/public/landing/hero"
import CTA from "@/components/public/landing/cta"
import QuickActions from "@/components/public/landing/quick-actions"
import Overview from "@/components/public/landing/overview"
import Statistics from "@/components/public/landing/statistics"
import Partners from "@/components/public/landing/partners"
import Contact from "@/components/public/landing/contact"
import Footer from "@/components/public/landing/footer"

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-background">
      <Header />
      <Hero />
      <QuickActions />
      <Overview />
      <Statistics />
      <Partners />
      <Contact />
      <CTA />
      <Footer />
    </main>
  )
}
