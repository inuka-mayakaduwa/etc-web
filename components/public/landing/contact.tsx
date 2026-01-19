"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mail, Phone, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"

export default function Contact() {
  const t = useTranslations("Public.Landing.Contact")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    setFormData({ name: "", email: "", message: "" })
  }

  return (
    <section id="contact" className="w-full py-16 md:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            {t("Title")}
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            {t("Subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6 animate-slide-in-left">
            <Card className="p-6 bg-background border-border">
              <div className="flex gap-4">
                <Phone className="w-6 h-6 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">Phone</h3>
                  <p className="text-foreground/70">{t("Phone")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-background border-border">
              <div className="flex gap-4">
                <Mail className="w-6 h-6 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">Email</h3>
                  <p className="text-foreground/70">{t("Email")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-background border-border">
              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-secondary flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">Address</h3>
                  <p className="text-foreground/70">{t("Address")}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-secondary transition-colors"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-secondary transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-secondary transition-colors resize-none h-32"
                placeholder="Your message..."
                required
              />
            </div>

            <Button className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-2">Send Message</Button>
          </form>
        </div>
      </div>
    </section>
  )
}
