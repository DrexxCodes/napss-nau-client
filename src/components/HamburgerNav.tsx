"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { Home, BookOpen, CheckCircle, CreditCard, Settings, GraduationCap, Award } from "lucide-react"
import "./HamburgerNav.css"

const HamburgerNav: React.FC = () => {
  const navigate = useNavigate()

  const menuItems = [
    { id: "home", label: "Home", icon: Home, path: "/dashboard" },
    { id: "library", label: "Library", icon: BookOpen, path: "/library" },
    { id: "checkins", label: "Check-ins", icon: CheckCircle, path: "/checkins" },
    { id: "payments", label: "Payments", icon: CreditCard, path: "/payments" },
    // { id: "events", label: "Events", icon: Calendar, path: "/events" },
    { id: "card-settings", label: "Card Settings", icon: Settings, path: "/card-settings" },
    { id: "academic-records", label: "Academic Records", icon: GraduationCap, path: "/academic-records" },
    { id: "scholarships", label: "Scholarships", icon: Award, path: "/scholarships" },
  ]

  const handleItemClick = (path: string) => {
    navigate(path)
  }

  return (
    <div className="horizontal-nav">
      <nav className="horizontal-menu">
        <div className="horizontal-menu-scroll">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button key={item.id} className="horizontal-menu-item" onClick={() => handleItemClick(item.path)}>
                <IconComponent size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default HamburgerNav
