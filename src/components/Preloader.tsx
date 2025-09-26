import type React from "react"
import "./Preloader.css"

const Preloader: React.FC = () => {
  return (
    <div className="preloader-container">
      <div className="preloader-content">
        <img src="/loader.gif" alt="Loading..." className="loader-gif" />
        <h2>Student Smart ID</h2>
        <p>Loading your dashboard...</p>
      </div>
    </div>
  )
}

export default Preloader
