"use client"

import type React from "react"
import { LogOut } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "../lib/firebase"
import { useNavigate } from "react-router-dom"
import "./Header.css"

const Header: React.FC = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <img src="/napss.png" alt="NAPSS Logo" className="header-logo" />
        <span className="header-title">NAPSS ID Client</span>
      </div>
      <button onClick={handleLogout} className="logout-button">
        <LogOut size={20} />
        Logout
      </button>
    </header>
  )
}

export default Header
