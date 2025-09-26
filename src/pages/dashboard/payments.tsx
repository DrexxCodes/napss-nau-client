"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../../lib/firebase"
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, type User } from "firebase/auth"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import HamburgerNav from "../../components/HamburgerNav"
import "./payments.css"

interface Payment {
  id: string
  amount: number
  txnDate: any
  narration?: string
  status: "successful" | "failed"
  remark?: string
  terminal: string
}

const Payments: React.FC = () => {
  const [, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [cardStatus, setCardStatus] = useState<string>("")
  const [isBanned, setIsBanned] = useState<boolean>(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showBlockedDialog, setShowBlockedDialog] = useState(false)
  const [showBannedDialog, setShowBannedDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSpotixDialog, setShowSpotixDialog] = useState(false)
  const [filter, setFilter] = useState<"all" | "successful" | "failed">("all")
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchUserData(currentUser.uid)
      } else {
        navigate("/login")
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const fetchUserData = async (uid: string) => {
    try {
      setLoading(true)

      // Fetch user document to check card status and ban status
      const userDocRef = doc(db, "users", uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const status = userData.cardStatus || ""
        const banned = userData.isBanned || false

        setCardStatus(status)
        setIsBanned(banned)

        // Only fetch payments if card is active and not banned
        if (status === "active" && !banned) {
          await fetchPayments(uid)
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async (uid: string) => {
    try {
      const paymentsRef = collection(db, "users", uid, "payments")
      const q = query(paymentsRef, orderBy("txnDate", "desc"))
      const querySnapshot = await getDocs(q)

      const paymentsData: Payment[] = []
      querySnapshot.forEach((doc) => {
        paymentsData.push({
          id: doc.id,
          ...doc.data(),
        } as Payment)
      })

      setPayments(paymentsData)
      setFilteredPayments(paymentsData)
    } catch (error) {
      console.error("Error fetching payments:", error)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000)
    } else {
      date = new Date(timestamp)
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleFilterChange = (newFilter: "all" | "successful" | "failed") => {
    setFilter(newFilter)
    if (newFilter === "all") {
      setFilteredPayments(payments)
    } else {
      setFilteredPayments(payments.filter((payment) => payment.status === newFilter))
    }
  }

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowPaymentDialog(true)
  }

  const handleGoToCardSettings = () => {
    setShowBlockedDialog(false)
    navigate("/card-settings")
  }

  const handleSpotixClick = () => {
    setShowSpotixDialog(true)
  }

  useEffect(() => {
    if (cardStatus === "blocked") {
      setShowBlockedDialog(true)
    } else if (isBanned) {
      setShowBannedDialog(true)
    }
  }, [cardStatus, isBanned])

  if (loading) {
    return (
      <div className="payments-container">
        <Header />
        <HamburgerNav />
        <div className="payments-loading">
          <div className="loading-spinner"></div>
          <p>Loading payments...</p>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="payments-container">
      <Header />
      <HamburgerNav />

      <main className="payments-main">
        <div className="payments-header">
          <h1>Payment History</h1>
          <button className="spotix-button" onClick={handleSpotixClick}>
            Connect Spotix IWSS
          </button>
        </div>

        {cardStatus === "active" && !isBanned && (
          <>
            <div className="payments-filters">
              <button
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => handleFilterChange("all")}
              >
                All Transactions
              </button>
              <button
                className={`filter-btn ${filter === "successful" ? "active" : ""}`}
                onClick={() => handleFilterChange("successful")}
              >
                Successful
              </button>
              <button
                className={`filter-btn ${filter === "failed" ? "active" : ""}`}
                onClick={() => handleFilterChange("failed")}
              >
                Failed
              </button>
            </div>

            <div className="payments-table-container">
              {filteredPayments.length > 0 ? (
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={`payment-row ${payment.status}`}
                        onClick={() => handlePaymentClick(payment)}
                      >
                        <td>{formatAmount(payment.amount)}</td>
                        <td>{formatDate(payment.txnDate)}</td>
                        <td>
                          <span className={`status-badge ${payment.status}`}>{payment.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-payments">
                  <p>No {filter !== "all" ? filter : ""} transactions found.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Blocked Card Dialog */}
      {showBlockedDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Card Blocked</h3>
            <p>Your card is blocked, go to unblock it</p>
            <div className="dialog-buttons">
              <button className="btn-primary" onClick={handleGoToCardSettings}>
                Go to Card Settings
              </button>
              <button className="btn-secondary" onClick={() => setShowBlockedDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banned Card Dialog */}
      {showBannedDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Card Banned</h3>
            <p>Your card has been banned from the network. Please contact support.</p>
            <div className="dialog-buttons">
              <button className="btn-secondary" onClick={() => setShowBannedDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Dialog */}
      {showPaymentDialog && selectedPayment && (
        <div className="dialog-overlay">
          <div className="dialog payment-details-dialog">
            <h3>Transaction Details</h3>
            <div className="payment-details">
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">{formatAmount(selectedPayment.amount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{formatDate(selectedPayment.txnDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Terminal:</span>
                <span className="detail-value">{selectedPayment.terminal}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-badge ${selectedPayment.status}`}>{selectedPayment.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Narration:</span>
                <span className="detail-value">{selectedPayment.narration || "No narration"}</span>
              </div>
              {selectedPayment.remark && (
                <div className="detail-row">
                  <span className="detail-label">Remark:</span>
                  <span className="detail-value">{selectedPayment.remark}</span>
                </div>
              )}
            </div>
            <div className="dialog-buttons">
              <button className="btn-secondary" onClick={() => setShowPaymentDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spotix IWSS Dialog */}
      {showSpotixDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Spotix IWSS</h3>
            <p>Spotix IWSS connection isn't set up yet. You shall be communicated when access is permitted.</p>
            <div className="dialog-buttons">
              <button className="btn-secondary" onClick={() => setShowSpotixDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
