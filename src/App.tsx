"use client"

import type React from "react"

import { useState, useEffect, Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "./lib/firebase"
import Preloader from "./components/Preloader"
import "./App.css"

const Login = lazy(() => import("./pages/login/login"))
const Signup = lazy(() => import("./pages/signup/signup"))
const Dashboard = lazy(() => import("./pages/dashboard/index"))
const Library = lazy(() => import("./pages/dashboard/library"))
const Checkins = lazy(() => import("./pages/dashboard/Checkins"))
const CardSettings = lazy(() => import("./pages/dashboard/card-settings"))
// const Events = lazy(() => import("./pages/dashboard/events"))
const Payments = lazy(() => import("./pages/dashboard/payments"))
// const AcademicRecords = lazy(() => import("./pages/dashboard/academic-records"))
const Scholarships = lazy(() => import("./pages/dashboard/scholarships"))

const RouteLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f0f8f0",
    }}
  >
    <div style={{ color: "#2d5a2d", fontSize: "18px" }}>Loading...</div>
  </div>
)

const ProtectedRoute = ({ children, user }: { children: React.ReactNode; user: User | null }) => {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const PublicRoute = ({ children, user }: { children: React.ReactNode; user: User | null }) => {
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Show preloader for at least 2 seconds
    const preloaderTimer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      // Only hide preloader after auth check is complete
      if (!loading) {
        clearTimeout(preloaderTimer)
        setLoading(false)
      }
    })

    return () => {
      unsubscribe()
      clearTimeout(preloaderTimer)
    }
  }, [loading])

  if (loading) {
    return <Preloader />
  }

  return (
    <Router>
      <div className="app">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

            <Route
              path="/login"
              element={
                <PublicRoute user={user}>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute user={user}>
                  <Signup />
                </PublicRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library"
              element={
                <ProtectedRoute user={user}>
                  <Library />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkins"
              element={
                <ProtectedRoute user={user}>
                  <Checkins />
                </ProtectedRoute>
              }
            />  
            <Route
              path="/card-settings"
              element={
                <ProtectedRoute user={user}>
                  <CardSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute user={user}>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scholarships"
              element={
                <ProtectedRoute user={user}>
                  <Scholarships />
                </ProtectedRoute>
              }
            />
            

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App
