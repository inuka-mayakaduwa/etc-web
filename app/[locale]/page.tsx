
import Hero from "@/components/hero"
import CTA from "@/components/cta"
import QuickActions from "@/components/quick-actions"
import Overview from "@/components/overview"
import Statistics from "@/components/statistics"
import Partners from "@/components/partners"
import Contact from "@/components/contact"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-background">
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
