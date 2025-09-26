"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import HamburgerNav from "../../components/HamburgerNav"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import "./dashboard.css"

interface UserData {
  firstName: string
  lastName: string
  surname: string
  yearOfAdmission: string
  regNumber: string
  schoolEmail: string
  cardStatus?: string 
  issueDate?: string  
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Greeting utility function
  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return "Good morning"
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon"
    } else if (hour >= 17 && hour < 22) {
      return "Good evening"
    } else {
      return "Good night"
    }
  }

  // Get card status display value and class
  const getCardStatusInfo = (status?: string) => {
    if (!status) {
      return { text: "Not Assigned", className: "not-assigned" }
    }
    
    const lowerStatus = status.toLowerCase()
    if (lowerStatus === "active") {
      return { text: "Active", className: "active" }
    } else {
      return { text: "Inactive", className: "inactive" }
    }
  }

  // Format issue date or return "Not Assigned"
  const getIssueDateDisplay = (issueDate?: string): string => {
    if (!issueDate) {
      return "Not Assigned"
    }
    
    try {
      // Try to format the date if it's a valid date string
      const date = new Date(issueDate)
      if (isNaN(date.getTime())) {
        return issueDate // Return as is if not a valid date
      }
      return date.toLocaleDateString()
    } catch {
      return issueDate // Return as is if formatting fails
    }
  }

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        fetchUserData(currentUser.uid)
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData
        setUserData(data)
      } else {
        setError("User data not found")
      }
    } catch (err) {
      setError("Failed to fetch user data")
      console.error("Error fetching user data:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const cardStatusInfo = getCardStatusInfo(userData?.cardStatus)

  return (
    <div className="dashboard-container">
        <Header />
        <HamburgerNav />
      {/* Header with greeting */}
      <header className="dashboard-header">
        <h1 className="greeting">
          {getGreeting()}, {userData?.surname || "Student"}
        </h1>
        <div className="header-info">
          <span className="current-date">{new Date().toLocaleDateString()}</span>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="dashboard-main">
        {/* Left container - Student Information */}
        <section className="student-info-section">
          <div className="section-card fade-in">
            <h2 className="section-title">Student Information</h2>
            <div className="info-grid">
              <div className="info-field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={userData?.firstName || ""}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="info-field">
                <label htmlFor="lastName">Last Name</label>
                <input 
                  id="lastName" 
                  type="text" 
                  value={userData?.lastName || ""} 
                  readOnly 
                  className="readonly-input" 
                />
              </div>

              <div className="info-field">
                <label htmlFor="yearOfAdmission">Year of Admission</label>
                <input
                  id="yearOfAdmission"
                  type="text"
                  value={userData?.yearOfAdmission || ""}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="info-field">
                <label htmlFor="regNumber">Registration Number</label>
                <input
                  id="regNumber"
                  type="text"
                  value={userData?.regNumber || ""}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="info-field">
                <label htmlFor="schoolEmail">School Email</label>
                <input
                  id="schoolEmail"
                  type="email"
                  value={userData?.schoolEmail || ""}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right container - Card Information */}
        <section className="card-info-section">
          <div className="section-card fade-in">
            <h2 className="section-title">Student Card Information</h2>

            {/* Student ID Card */}
            <div className="student-card">
              <div className="card-header">
                <h3>Student ID Card</h3>
                <div className={`card-status ${cardStatusInfo.className}`}>
                  {cardStatusInfo.text}
                </div>
              </div>
              <div className="card-body">
                <div className="card-avatar">
                  <div className="avatar-placeholder">
                    {userData?.firstName?.charAt(0)}
                    {userData?.lastName?.charAt(0)}
                  </div>
                </div>
                <div className="card-details">
                  <h4>
                    {userData?.firstName} {userData?.lastName}
                  </h4>
                  <p className="reg-number">{userData?.regNumber}</p>
                  <p className="admission-year">Admitted: {userData?.yearOfAdmission}</p>
                </div>
              </div>
            </div>

            {/* Card Status and Issue Date */}
            <div className="card-status-section">
              <div className="status-field">
                <span className="status-label">Card Status:</span>
                <span className={`status-value ${cardStatusInfo.className}`}>
                  {cardStatusInfo.text}
                </span>
              </div>
              <div className="status-field">
                <span className="status-label">Card Issue Date:</span>
                <span className={`status-value ${userData?.issueDate ? 'active' : 'not-assigned'}`}>
                  {getIssueDateDisplay(userData?.issueDate)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
        <Footer />
    </div>
  )
}

export default Dashboard