"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { auth, db } from "../../lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import HamburgerNav from "../../components/HamburgerNav"
import "./Checkins.css"

interface CheckinEvent {
  id: string
  eventName: string
  checkinDate: any // Firestore timestamp
  checkedBy: string
}

const Checkins: React.FC = () => {
  const [user] = useAuthState(auth)
  const [events, setEvents] = useState<CheckinEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Query the events collection under the user's UID
        const eventsRef = collection(db, "users", user.uid, "events")
        const eventsQuery = query(eventsRef, orderBy("checkinDate", "desc"))
        const eventsSnapshot = await getDocs(eventsQuery)

        const eventsData: CheckinEvent[] = []
        eventsSnapshot.forEach((doc) => {
          eventsData.push({
            id: doc.id,
            ...doc.data(),
          } as CheckinEvent)
        })

        setEvents(eventsData)
      } catch (err) {
        console.error("Error fetching events:", err)
        setError("Failed to load check-in events. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [user])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date"

    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="checkins-container">
        <Header />
        <HamburgerNav />
        <div className="checkins-content">
          <div className="loading-message">Loading your check-in history...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="checkins-container">
      <Header />
      <HamburgerNav />

      <div className="checkins-content">
        <div className="checkins-header">
          <h1>Event Check-ins</h1>
          <p>Your attendance history using your student ID</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {events.length === 0 && !loading && !error ? (
          <div className="no-events-message">
            <div className="no-events-icon">📅</div>
            <h2>No Check-ins Yet</h2>
            <p>You've not checked in any events with your ID. Try going out more?</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <h3 className="event-name">{event.eventName}</h3>
                  <div className="event-date">{formatDate(event.checkinDate)}</div>
                </div>

                <div className="event-details">
                  <div className="event-detail-item">
                    <span className="detail-label">Checked by:</span>
                    <span className="detail-value">{event.checkedBy}</span>
                  </div>
                </div>

                <div className="event-status">
                  <span className="status-badge">Attended</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Checkins
