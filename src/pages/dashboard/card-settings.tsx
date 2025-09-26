"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { auth, db } from "../../lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import bcrypt from "bcryptjs"
import QRCode from "qrcode"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import HamburgerNav from "../../components/HamburgerNav"
import "./card-settings.css"

interface UserData {
  cardPin?: string
  cardStatus?: "active" | "blocked"
  cardID?: string
  issueDate?: string
  surname?: string
  firstName?: string
  lastName?: string
  regNumber?: string
}

const CardSettings: React.FC = () => {
  const [user] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [pin, setPin] = useState(["", "", "", "", ""])
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", ""])
  const [blockPin, setBlockPin] = useState(["", "", "", "", ""])
  const [step, setStep] = useState<"create" | "confirm">("create")
  const [tempEncryptedPin, setTempEncryptedPin] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [qrCodeUid, setQrCodeUid] = useState("")
  const [qrCodeReg, setQrCodeReg] = useState("")
  const [showRegNumber, setShowRegNumber] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData)
            
            // Generate QR codes
            const uidQR = await QRCode.toDataURL(user.uid)
            setQrCodeUid(uidQR)
            
            const regNumber = userDoc.data().regNumber
            if (regNumber) {
              const regQR = await QRCode.toDataURL(regNumber)
              setQrCodeReg(regQR)
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserData()
  }, [user])

  // PIN Security Validation
  const validatePinSecurity = (pinString: string): string | null => {
    // Check for sequential numbers (ascending or descending)
    let isSequential = true
    for (let i = 1; i < pinString.length; i++) {
      const current = parseInt(pinString[i])
      const previous = parseInt(pinString[i - 1])
      if (current !== previous + 1) {
        isSequential = false
        break
      }
    }
    
    let isReverseSequential = true
    for (let i = 1; i < pinString.length; i++) {
      const current = parseInt(pinString[i])
      const previous = parseInt(pinString[i - 1])
      if (current !== previous - 1) {
        isReverseSequential = false
        break
      }
    }

    if (isSequential || isReverseSequential) {
      return "PIN contains sequence of numbers. Please choose a more secure PIN."
    }

    // Check for repetitive patterns
    const digitCount: { [key: string]: number } = {}
    for (const digit of pinString) {
      digitCount[digit] = (digitCount[digit] || 0) + 1
    }

    // Check if any digit appears more than 3 times
    for (const count of Object.values(digitCount)) {
      if (count > 3) {
        return "PIN contains repetitive numbers. Please choose a more secure PIN."
      }
    }

    // Check for common weak patterns
    const weakPatterns = [
      "00000", "11111", "22222", "33333", "44444", 
      "55555", "66666", "77777", "88888", "99999",
      "12345", "54321", "01234", "43210"
    ]

    if (weakPatterns.includes(pinString)) {
      return "PIN contains repetitive numbers or common sequence. Please choose a more secure PIN."
    }

    return null // PIN is secure
  }

  const handleKeypadPress = (number: string, type: "create" | "block" = "create") => {
    if (type === "block") {
      const emptyIndex = blockPin.findIndex((digit) => digit === "")
      if (emptyIndex !== -1) {
        const newBlockPin = [...blockPin]
        newBlockPin[emptyIndex] = number
        setBlockPin(newBlockPin)

        if (emptyIndex === 4) {
          setTimeout(async () => {
            const blockPinString = newBlockPin.join("")
            const isMatch = await bcrypt.compare(blockPinString, userData?.cardPin || "")
            
            if (isMatch) {
              try {
                const newStatus = userData?.cardStatus === "active" ? "blocked" : "active"
                await updateDoc(doc(db, "users", user!.uid), {
                  cardStatus: newStatus,
                })
                setSuccess(`Card ${newStatus === "blocked" ? "blocked" : "unblocked"} successfully!`)
                setUserData((prev) => ({ ...prev, cardStatus: newStatus }))
                setShowBlockDialog(false)
                setBlockPin(["", "", "", "", ""])
              } catch (error) {
                setError("Failed to update card status. Please try again.")
              }
            } else {
              setError("Incorrect PIN. Please try again.")
              setTimeout(() => {
                setBlockPin(["", "", "", "", ""])
                setError("")
              }, 2000)
            }
          }, 500)
        }
      }
      return
    }

    if (step === "create") {
      const emptyIndex = pin.findIndex((digit) => digit === "")
      if (emptyIndex !== -1) {
        const newPin = [...pin]
        newPin[emptyIndex] = number
        setPin(newPin)

        if (emptyIndex === 4) {
          setTimeout(async () => {
            const pinString = newPin.join("")
            
            // Validate PIN security
            const securityError = validatePinSecurity(pinString)
            if (securityError) {
              setError(securityError)
              setTimeout(() => {
                setPin(["", "", "", "", ""])
                setError("")
              }, 3000)
              return
            }

            const encrypted = await bcrypt.hash(pinString, 10)
            setTempEncryptedPin(encrypted)
            setStep("confirm")
            setPin(["", "", "", "", ""])
          }, 500)
        }
      }
    } else {
      const emptyIndex = confirmPin.findIndex((digit) => digit === "")
      if (emptyIndex !== -1) {
        const newConfirmPin = [...confirmPin]
        newConfirmPin[emptyIndex] = number
        setConfirmPin(newConfirmPin)

        if (emptyIndex === 4) {
          setTimeout(async () => {
            const confirmPinString = newConfirmPin.join("")
            const isMatch = await bcrypt.compare(confirmPinString, tempEncryptedPin)

            if (isMatch) {
              try {
                await updateDoc(doc(db, "users", user!.uid), {
                  cardPin: tempEncryptedPin,
                  cardStatus: "active",
                })
                setSuccess("PIN created successfully!")
                setShowPinDialog(false)
                setUserData((prev) => ({ ...prev, cardPin: tempEncryptedPin, cardStatus: "active" }))
                resetPinState()
              } catch (error) {
                setError("Failed to save PIN. Please try again.")
              }
            } else {
              setError("PINs do not match. Please try again.")
              setTimeout(() => {
                setStep("create")
                resetPinState()
              }, 2000)
            }
          }, 500)
        }
      }
    }
  }

  const handleBackspace = (type: "create" | "block" = "create") => {
    if (type === "block") {
      let lastFilledIndex = -1
      for (let i = blockPin.length - 1; i >= 0; i--) {
        if (blockPin[i] !== "") {
          lastFilledIndex = i
          break
        }
      }
      if (lastFilledIndex !== -1) {
        const newBlockPin = [...blockPin]
        newBlockPin[lastFilledIndex] = ""
        setBlockPin(newBlockPin)
      }
      return
    }

    if (step === "create") {
      let lastFilledIndex = -1
      for (let i = pin.length - 1; i >= 0; i--) {
        if (pin[i] !== "") {
          lastFilledIndex = i
          break
        }
      }
      if (lastFilledIndex !== -1) {
        const newPin = [...pin]
        newPin[lastFilledIndex] = ""
        setPin(newPin)
      }
    } else {
      let lastFilledIndex = -1
      for (let i = confirmPin.length - 1; i >= 0; i--) {
        if (confirmPin[i] !== "") {
          lastFilledIndex = i
          break
        }
      }
      if (lastFilledIndex !== -1) {
        const newConfirmPin = [...confirmPin]
        newConfirmPin[lastFilledIndex] = ""
        setConfirmPin(newConfirmPin)
      }
    }
  }

  const resetPinState = () => {
    setPin(["", "", "", "", ""])
    setConfirmPin(["", "", "", "", ""])
    setStep("create")
    setTempEncryptedPin("")
    setError("")
  }

  const closeDialog = () => {
    setShowPinDialog(false)
    resetPinState()
  }

  const closeBlockDialog = () => {
    setShowBlockDialog(false)
    setBlockPin(["", "", "", "", ""])
    setError("")
  }

  const toggleCardStatus = () => {
    if (!userData?.cardPin) {
      setError("Please set up a PIN first to manage card status.")
      return
    }
    setShowBlockDialog(true)
  }

  if (loading) {
    return (
      <div className="card-settings-loading">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="card-settings-container">
      <Header />
      <HamburgerNav />

      <main className="card-settings-main">
        <div className="card-settings-content">
          <h1>Card Settings</h1>

          {/* Card Display Section */}
          {userData?.cardID && userData?.issueDate && (
            <div className="virtual-card-section">
              <h2>Virtual Card</h2>
              <div className="virtual-card">
                <div className="card-header">
                  <div className="card-logo">STUDENT ID</div>
                  <div className="nfc-indicator">
                    <div className="nfc-waves">
                      <div className="wave"></div>
                      <div className="wave"></div>
                      <div className="wave"></div>
                    </div>
                    NFC
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-name">
                    {userData.surname?.toUpperCase()}, {userData.firstName?.toUpperCase()} {userData.lastName?.toUpperCase()}
                  </div>
                  <div className="card-id">ID: {userData.cardID}</div>
                  <div className="card-issue">Issued: {new Date(userData.issueDate).toLocaleDateString()}</div>
                </div>
                <div className="card-footer">
                  <div className="card-chip"></div>
                  <div className="card-status-indicator">
                    <div className={`status-dot ${userData.cardStatus || "inactive"}`}></div>
                    {userData.cardStatus?.toUpperCase() || "INACTIVE"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card-status-section">
            <h2>Card Status</h2>
            <div className={`status-indicator ${userData?.cardStatus || "inactive"}`}>
              {userData?.cardStatus === "active"
                ? "Active"
                : userData?.cardStatus === "blocked"
                  ? "Blocked"
                  : "Inactive"}
            </div>
            {userData?.cardPin && (
              <button 
                className={`toggle-status-btn ${userData?.cardStatus === "active" ? "block" : "unblock"}`}
                onClick={toggleCardStatus}
              >
                {userData?.cardStatus === "active" ? "Block Card" : "Unblock Card"}
              </button>
            )}
          </div>

          <div className="card-pin-section">
            <h2>Card PIN</h2>
            {userData?.cardPin ? (
              <div className="pin-exists">
                <p>PIN is set up</p>
                <button className="change-pin-btn" onClick={() => setShowPinDialog(true)}>
                  Change PIN
                </button>
              </div>
            ) : (
              <div className="no-pin">
                <p>No PIN set up for your card</p>
                <button className="create-pin-btn" onClick={() => setShowPinDialog(true)}>
                  Create Card PIN
                </button>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {userData?.cardPin && (
            <div className="qr-code-section">
              <h2>Card QR Code</h2>
              <div className="qr-container">
                <div className="qr-display">
                  <img 
                    src={showRegNumber ? qrCodeReg : qrCodeUid} 
                    alt={showRegNumber ? "Registration Number QR" : "User ID QR"} 
                    className="qr-image"
                  />
                  <p className="qr-label">
                    {showRegNumber ? "Registration Number" : "User ID"}
                  </p>
                </div>
                <div className="qr-controls">
                  <button 
                    className={`qr-toggle-btn ${!showRegNumber ? "active" : ""}`}
                    onClick={() => setShowRegNumber(false)}
                  >
                    UID
                  </button>
                  <button 
                    className={`qr-toggle-btn ${showRegNumber ? "active" : ""}`}
                    onClick={() => setShowRegNumber(true)}
                  >
                    Reg Number
                  </button>
                </div>
                <div className="activation-status">
                  <div className="waiting-indicator">
                    <div className="pulse-dot"></div>
                    <span>Waiting for activation...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && <div className="success-message">{success}</div>}
          {error && !showPinDialog && !showBlockDialog && <div className="error-message">{error}</div>}
        </div>
      </main>

      {/* PIN Creation/Change Dialog */}
      {showPinDialog && (
        <div className="pin-dialog-overlay">
          <div className="pin-dialog">
            <div className="pin-dialog-header">
              <h3>{step === "create" ? "Create PIN" : "Confirm PIN"}</h3>
              <button className="close-btn" onClick={closeDialog}>×</button>
            </div>

            <div className="pin-dialog-content">
              <p>{step === "create" ? "Enter a 5-digit PIN for your card" : "Re-enter your PIN to confirm"}</p>

              <div className="pin-boxes">
                {(step === "create" ? pin : confirmPin).map((digit, index) => (
                  <div key={index} className="pin-box">
                    {digit ? "●" : ""}
                  </div>
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="keypad">
                <div className="keypad-row">
                  {[1, 2, 3].map((num) => (
                    <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num.toString())}>
                      {num}
                    </button>
                  ))}
                </div>
                <div className="keypad-row">
                  {[4, 5, 6].map((num) => (
                    <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num.toString())}>
                      {num}
                    </button>
                  ))}
                </div>
                <div className="keypad-row">
                  {[7, 8, 9].map((num) => (
                    <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num.toString())}>
                      {num}
                    </button>
                  ))}
                </div>
                <div className="keypad-row">
                  <button className="keypad-btn empty"></button>
                  <button className="keypad-btn" onClick={() => handleKeypadPress("0")}>
                    0
                  </button>
                  <button className="keypad-btn backspace" onClick={() => handleBackspace()}>
                    ⌫
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Block/Unblock Dialog */}
      {showBlockDialog && (
        <div className="pin-dialog-overlay">
          <div className="pin-dialog">
            <div className="pin-dialog-header">
              <h3>{userData?.cardStatus === "active" ? "Block Card" : "Unblock Card"}</h3>
              <button className="close-btn" onClick={closeBlockDialog}>×</button>
            </div>

            <div className="pin-dialog-content">
              <p>Enter your PIN to {userData?.cardStatus === "active" ? "block" : "unblock"} your card</p>

              <div className="pin-boxes">
                {blockPin.map((digit, index) => (
                  <div key={index} className="pin-box">
                    {digit ? "●" : ""}
                  </div>
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="keypad">
                <div className="keypad-row">
                  {[1, 2, 3].map((num) => (
                    <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num.toString(), "block")}>
                      {num}
                    </button>
                  ))}
                </div>
                <div className="keypad-row">
                  {[4, 5, 6].map((num) => (
                    <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num.toString(), "block")}>
                      {num}
                    </button>
                  ))}
                </div>
                <div className="keypad-row">
                  {[7, 8, 9].map((num) => (
                    <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num.toString(), "block")}>
                      {num}
                    </button>
                  ))}
                </div>
                <div className="keypad-row">
                  <button className="keypad-btn empty"></button>
                  <button className="keypad-btn" onClick={() => handleKeypadPress("0", "block")}>
                    0
                  </button>
                  <button className="keypad-btn backspace" onClick={() => handleBackspace("block")}>
                    ⌫
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default CardSettings