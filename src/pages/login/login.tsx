"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { Eye, EyeOff } from "lucide-react"
import { auth } from "../../lib/firebase"
import "./login.css"

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [verificationMessage, setVerificationMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleResendVerification = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      await sendEmailVerification(userCredential.user)
      setVerificationMessage("Verification email sent! Please check your inbox.")
    } catch (error: any) {
      setError("Failed to send verification email")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setVerificationMessage("")
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)

      if (!userCredential.user.emailVerified) {
        setVerificationMessage("Email not verified, no worries, click here to generate new link")
        setLoading(false)
        return
      }

      navigate("/dashboard")
      console.log("User signed in successfully")
    } catch (error: any) {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your Smart ID Card account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {verificationMessage && (
            <div className="verification-message">
              {verificationMessage}
              {verificationMessage.includes("click here") && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="resend-link"
                  style={{ marginLeft: "5px" }}
                >
                  click here
                </button>
              )}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?
            <button type="button" onClick={() => navigate("/signup")} className="link-btn">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
