"use client"

import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"

export default function Footer() {
  const t = useTranslations("Public.Landing.Footer")
  const tNav = useTranslations("Public.Landing.Navigation")

  return (
    <footer className="w-full bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">ETC</h3>
            <p className="text-primary-foreground/70">{t("Description")}</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t("QuickLinks")}</h4>
            <ul className="space-y-2 text-primary-foreground/70">
              <li>
                <a href="#about" className="hover:text-accent transition-colors">
                  {tNav("About")}
                </a>
              </li>
              <li>
                <a href="#benefits" className="hover:text-accent transition-colors">
                  {tNav("Benefits")}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-accent transition-colors">
                  {tNav("Contact")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t("Legal")}</h4>
            <ul className="space-y-2 text-primary-foreground/70">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  {t("Links.PrivacyPolicy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  {t("Links.TermsOfService")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  {t("Links.Disclaimer")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t("FollowUs")}</h4>
            <ul className="space-y-2 text-primary-foreground/70">
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-primary-foreground/70 text-sm">
            {t("RightsReserved")}
          </p>
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mt-4 md:mt-0">
            {t("MadeWith")} <Heart size={16} className="text-accent" /> {t("ForFasterTravel")}
          </div>
        </div>
      </div>
    </footer>
  )
}
