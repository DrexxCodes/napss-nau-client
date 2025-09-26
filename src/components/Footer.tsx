import type React from "react"
import "./Footer.css"

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} NAPSS Client. All rights reserved.</p>
        <p>
          Developed by <span className="developer">Drexx Tech</span>
        </p>
      </div>
    </footer>
  )
}

export default Footer
