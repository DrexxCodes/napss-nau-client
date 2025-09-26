"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Eye, EyeOff } from "lucide-react"
import { auth, db } from "../../lib/firebase"
import "./signup.css"

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    regNumber: "",
    firstName: "",
    lastName: "",
    surname: "",
    yearOfAdmission: "",
    schoolEmail: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [fetchingData, setFetchingData] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [studentDataLoaded, setStudentDataLoaded] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "regNumber") {
      // Only allow numeric input and limit to 10 digits
      const numericValue = value.replace(/\D/g, "").slice(0, 10)
      setFormData({
        ...formData,
        [name]: numericValue,
      })

      // Reset student data if reg number is cleared or changed
      if (numericValue.length < 10 && studentDataLoaded) {
        setFormData((prev) => ({
          ...prev,
          firstName: "",
          lastName: "",
          surname: "",
          yearOfAdmission: "",
          schoolEmail: "",
        }))
        setStudentDataLoaded(false)
        setEmailMessage("")
        setError("")
      }

      // Fetch data when exactly 10 digits are entered
      if (numericValue.length === 10) {
        fetchStudentData(numericValue)
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const fetchStudentData = async (regNumber: string) => {
    setFetchingData(true)
    setError("")
    setEmailMessage("")
    setStudentDataLoaded(false)

    try {
      const enrollmentDoc = await getDoc(doc(db, "enrollments", regNumber))

      if (enrollmentDoc.exists()) {
        const data = enrollmentDoc.data()

        // Update form data with fetched information
        setFormData((prev) => ({
          ...prev,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          surname: data.surname || "",
          yearOfAdmission: data.yearOfAdmission?.toString() || "",
          schoolEmail: data.schoolEmail || "",
        }))

        setStudentDataLoaded(true)

        // Validate school email domain
        if (data.schoolEmail && !data.schoolEmail.endsWith("@stu.unizik.edu.ng")) {
          setError("Please contact support to change your enrolled email to the correct domain (@stu.unizik.edu.ng)")
          setEmailMessage("")
        } else if (data.schoolEmail) {
          setEmailMessage("We will confirm this email in a moment")
          setError("")
        } else {
          setError("No school email found in enrollment data. Please contact support.")
        }
      } else {
        setError("Registration number not found in enrollments. Please contact support.")
        setFormData((prev) => ({
          ...prev,
          firstName: "",
          lastName: "",
          surname: "",
          yearOfAdmission: "",
          schoolEmail: "",
        }))
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
      setError("Error fetching student data. Please try again.")
      setFormData((prev) => ({
        ...prev,
        firstName: "",
        lastName: "",
        surname: "",
        yearOfAdmission: "",
        schoolEmail: "",
      }))
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation checks
    if (!studentDataLoaded) {
      setError("Please enter a valid registration number to load your details")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!formData.schoolEmail.endsWith("@stu.unizik.edu.ng")) {
      setError("Please contact support to change your enrolled email")
      return
    }

    setLoading(true)

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.schoolEmail, formData.password)

      // Send email verification
      await sendEmailVerification(userCredential.user)

      // Store user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        regNumber: formData.regNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        surname: formData.surname,
        yearOfAdmission: formData.yearOfAdmission,
        schoolEmail: formData.schoolEmail,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      })

      setSuccess(
        "Account created successfully! Please check your email for a verification link. After clicking the verification link, you can log in.",
      )

      // Clear form after successful submission
      setFormData({
        regNumber: "",
        firstName: "",
        lastName: "",
        surname: "",
        yearOfAdmission: "",
        schoolEmail: "",
        password: "",
        confirmPassword: "",
      })
      setStudentDataLoaded(false)
      setEmailMessage("")

      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Signup error:", error)
      if (error.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please try logging in instead.")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.")
      } else {
        setError(error.message || "Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Student Registration</h2>
          <p>Create your Smart ID Card account</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="regNumber">Registration Number</label>
            <input
              type="text"
              id="regNumber"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleChange}
              required
              placeholder="Enter your 10-digit reg number"
              maxLength={10}
              pattern="[0-9]{10}"
            />
            {fetchingData && <div className="loading-message">Fetching your details...</div>}
          </div>

          {studentDataLoaded && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} readOnly />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} readOnly />
              </div>

              <div className="form-group">
                <label htmlFor="surname">Surname</label>
                <input type="text" id="surname" name="surname" value={formData.surname} readOnly />
              </div>

              <div className="form-group">
                <label htmlFor="yearOfAdmission">Year of Admission</label>
                <input
                  type="text"
                  id="yearOfAdmission"
                  name="yearOfAdmission"
                  value={formData.yearOfAdmission}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="schoolEmail">School Email</label>
                <input type="email" id="schoolEmail" name="schoolEmail" value={formData.schoolEmail} readOnly />
                {emailMessage && <div className="info-message">{emailMessage}</div>}
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
                    minLength={6}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {studentDataLoaded && (
            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          )}
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?
            <button type="button" onClick={() => navigate("/login")} className="link-btn">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
