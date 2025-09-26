"use client"

import type React from "react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import HamburgerNav from "../../components/HamburgerNav"
import "./scholarships.css"

const Scholarships: React.FC = () => {
  return (
    <div className="scholarships-page">
      <Header />
      <HamburgerNav />

      <main className="scholarships-main">
        <div className="scholarships-container">
          <div className="message-container">
            <h2 className="message-title">Service Unavailable</h2>
            <p className="message-text">
              Looks like the server isn't allowing this request to be processed yet. Check back later. We can't find any
              service to process this request and that's all we know.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Scholarships
