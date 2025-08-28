"use client"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import Loader from "@/components/Loader"
import ErrorState from "@/components/ErrorState"
import { KpiCard } from "@/components/KpiCard"
import { useDashboardRealTime } from "@/hooks/useRealTimeData"

import dynamic from "next/dynamic"

const FleetMap = dynamic(() => import("@/components/Map").then((mod) => ({ default: mod.FleetMap })), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">Loading map...</div>,
})
import { EnhancedDataTable } from "@/components/EnhancedDataTable"
import { AssetTypeChart } from "@/components/charts/AssetTypeChart"
import { AvailabilityChart } from "@/components/charts/AvailabilityChart"
import { BillingChart } from "@/components/charts/BillingChart"
import { ContractsChart } from "@/components/charts/ContractsChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, DollarSign, MapPin, Calendar, Users, BarChart3 } from "lucide-react"
import { formatMoney } from "@/lib/format"

function FleetDashboard() {
  // Enable real-time data updates
  useDashboardRealTime();

  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({
    queryKey: ["assets"],
    queryFn: api.getAssets,
  })

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: api.getDashboardAnalytics,
  })

  if (assetsLoading || analyticsLoading) {
    return <Loader />
  }

  if (assetsError || analyticsError) {
    return <ErrorState error={assetsError || analyticsError} />
  }

  if (!assetsData || !analyticsData) {
    return <ErrorState error={new Error("No data available")} />
  }

  const { assets, summary, categoryDistribution } = assetsData

  // Calculate additional metrics
  const totalRevenue = assets.reduce((sum, asset) => sum + Number(asset.rental_price_per_day), 0)
  const averageAge = Math.round(
    assets.reduce((sum, asset) => sum + (2024 - asset.year_of_manufacture), 0) / assets.length,
  )
  const uniqueManufacturers = new Set(assets.map((a) => a.manufacturer)).size

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Fleet Management Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive overview of your entire fleet operations and analytics
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Fleet" value={summary.total.toString()} sub={`${uniqueManufacturers} manufacturers`} />
        <KpiCard
          title="Available Assets"
          value={summary.available.toString()}
          sub={`${summary.rentedPercentage.toFixed(1)}% utilization`}
        />
        <KpiCard title="Revenue Potential" value={formatMoney(totalRevenue)} sub="Daily capacity" />
        <KpiCard title="Fleet Age" value={`${averageAge} years`} sub="Average age" />
      </div>

      {/* Analytics Charts Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Fleet Analytics</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetTypeChart data={analyticsData.assetTypes} />
          <AvailabilityChart data={analyticsData.availability} />
          <BillingChart data={analyticsData.billing} />
          <ContractsChart data={analyticsData.contracts} />
        </div>
      </div>

      {/* Fleet Map Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold">Fleet Distribution</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Global Fleet Locations
            </CardTitle>
            <CardDescription>Real-time geographic distribution of all fleet assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full">
              <FleetMap assets={assets} />
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-1"></div>
                <span>Available ({summary.available})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary"></div>
                <span>Rented ({summary.rented})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-2"></div>
                <span>Maintenance ({assets.filter((a) => a.status === "under_maintenance").length})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Categories Overview */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Asset Categories</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(categoryDistribution)
            .filter(([_, count]) => count > 1)
            .map(([type, count]) => (
              <Card key={type} className="text-center p-4">
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize mt-1">{type.replace(/\d+/g, "")}</div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {((count / summary.total) * 100).toFixed(1)}%
                  </Badge>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.contracts.ongoing}</div>
            <p className="text-xs text-muted-foreground">{analyticsData.contracts.completed} completed this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{analyticsData.billing.completed}</div>
            <p className="text-xs text-muted-foreground">{analyticsData.billing.pending} pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.rentedPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.rented} of {summary.total} assets in use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Asset Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Complete Asset Inventory</h2>
          </div>
          <Badge variant="secondary" className="text-sm">
            {assets.length} Total Assets
          </Badge>
        </div>

        <EnhancedDataTable
          assets={assets}
          onViewDetail={(asset) => {
            // Handle asset detail view - could navigate to detail page
            console.log("View asset details:", asset)
          }}
        />
      </div>
    </div>
  )
}

export default function Page() {
  return <FleetDashboard />
}
