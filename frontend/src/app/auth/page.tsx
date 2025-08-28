"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import type { Company } from "@/lib/types"
import { Building2, UserCheck, Users, Lock, User, Eye, EyeOff } from "lucide-react"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState<"admin" | "customer">("customer")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    company_id: "",
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLogin && userType === "customer") {
      fetchCompanies()
    }
  }, [isLogin, userType])

  const fetchCompanies = async () => {
    try {
      const companiesData = await api.getCompanies()
      setCompanies(companiesData)
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isLogin) {
        // Login
        const response = await api.login(formData.username, formData.password, userType)
        login(response.user)

        if (response.user.userType === "admin") {
          router.push("/")
        } else {
          router.push("/customer")
        }
      } else {
        // Register
        if (!formData.company_id) {
          setError("Please select a company")
          return
        }

        const response = await api.register(formData.username, formData.password, Number.parseInt(formData.company_id))

        // Auto-login after registration
        const loginResponse = await api.login(formData.username, formData.password, "customer")
        login(loginResponse.user)
        router.push("/customer")
      }
    } catch (error: any) {
      setError(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-muted flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Smart Rental System</h1>
          <p className="text-muted-foreground">Equipment rental management platform</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8">
          {/* Tab Switcher */}
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-l-lg font-medium transition-colors ${
                isLogin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-r-lg font-medium transition-colors ${
                !isLogin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Register
            </button>
          </div>

          {/* User Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-3">
              {isLogin ? "Login as:" : "Register as:"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("customer")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  userType === "customer"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-border bg-muted text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <Users className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Customer</div>
              </button>
              <button
                type="button"
                onClick={() => setUserType("admin")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  userType === "admin"
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-muted text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <UserCheck className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Admin</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder={userType === "admin" ? "Enter admin username" : "Enter your username"}
                  required
                />
              </div>
              {userType === "admin" && isLogin && <p className="text-xs text-muted-foreground mt-1">Default: admin</p>}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder={userType === "admin" ? "Enter admin password" : "Enter your password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {userType === "admin" && isLogin && <p className="text-xs text-muted-foreground mt-1">Default: admin</p>}
            </div>

            {/* Company Selection (for customer registration) */}
            {!isLogin && userType === "customer" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-card-foreground mb-2">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <select
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  >
                    <option value="">Select your company</option>
                    {companies.map((company) => (
                      <option key={company.company_id} value={company.company_id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                userType === "admin"
                  ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                  : "bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? "Signing in..." : "Creating account..."}
                </div>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          {isLogin && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium text-card-foreground mb-3">Demo Credentials:</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="text-primary">admin / admin</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="text-accent">demo_user / password123</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>&copy; 2024 Smart Rental System. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
