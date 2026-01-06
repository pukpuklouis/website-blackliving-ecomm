"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { useMobile } from "@/hooks/use-mobile"
import { checkGoogleMapsConfig } from "@/lib/actions"

interface PlaceInfo {
  name: string
  address: string
  hours: string
  phone: string
  coordinates: {
    lat: number
    lng: number
  }
}

interface MapWithInfoCardProps {
  placeInfo: PlaceInfo
}

declare global {
  interface Window {
    google: any
    initMap: () => void
    gm_authFailure: () => void
  }
}

export function MapWithInfoCard({ placeInfo }: MapWithInfoCardProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMobile()

  useEffect(() => {
    // Check if API key is configured
    checkGoogleMapsConfig().then(({ hasApiKey: hasKey }) => {
      setHasApiKey(hasKey)

      if (!hasKey) return

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      window.gm_authFailure = () => {
        setError("Google Maps API 認證失敗。請檢查 API Key 設定和帳單狀態。")
      }

      // Fetch the script URL from our API route
      fetch("/api/maps-script")
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
            return
          }

          // Load Google Maps script using the URL from our API
          const script = document.createElement("script")
          script.src = data.scriptUrl
          script.async = true
          script.defer = true

          script.onerror = () => {
            setError("無法載入 Google Maps API。請檢查網路連線和 API Key 設定。")
          }

          window.initMap = initializeMap

          document.head.appendChild(script)
        })
        .catch((err) => {
          setError("Failed to load Google Maps")
          console.error("Maps loading error:", err)
        })
    })

    return () => {
      // Cleanup function
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
      scripts.forEach((script) => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      })
      delete window.gm_authFailure
    }
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: placeInfo.coordinates,
        zoom: 16,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
      })

      // Add marker
      new window.google.maps.Marker({
        position: placeInfo.coordinates,
        map: map,
        title: placeInfo.name,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C11.0294 2 7 6.02944 7 11C7 18.25 16 30 16 30C16 30 25 18.25 25 11C25 6.02944 20.9706 2 16 2Z" fill="#DC2626"/>
            <circle cx="16" cy="11" r="4" fill="white"/>
          </svg>
        `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
        },
      })

      setIsLoaded(true)
    } catch (err) {
      console.error("Map initialization error:", err)
      setError("地圖初始化失敗。請檢查 Google Maps API 設定。")
    }
  }

  // Loading state while checking API key
  if (hasApiKey === null) {
    return (
      <div className="relative w-full h-full bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">檢查設定中...</div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="relative w-full h-full bg-muted">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <Card className="max-w-md p-6 text-center">
            <h3 className="font-semibold text-lg mb-4 text-destructive">Google Maps 載入錯誤</h3>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>{error}</p>
              <div className="text-left space-y-2 mt-4 p-3 bg-muted rounded-lg">
                <p className="font-medium">常見解決方法：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 確認 Google Cloud Console 已啟用帳單功能</li>
                  <li>• 檢查 Maps JavaScript API 是否已啟用</li>
                  <li>• 驗證 API Key 權限設定正確</li>
                  <li>• 確認 API Key 已加入專案環境變數</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card Preview */}
        <Card
          className={`absolute bg-card/95 backdrop-blur-sm border shadow-lg ${
            isMobile ? "bottom-4 left-4 right-4 p-4" : "left-4 top-1/2 -translate-y-1/2 w-80 p-6"
          }`}
        >
          <div className="space-y-3">
            <h2 className="font-semibold text-lg text-card-foreground leading-tight">{placeInfo.name}</h2>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-xs mt-0.5">📍</span>
                <span className="flex-1">地址：{placeInfo.address}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">🕒</span>
                <span>開放時間：{placeInfo.hours}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">📞</span>
                <span>電話：{placeInfo.phone}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Show API key setup message if not configured
  if (!hasApiKey) {
    return (
      <div className="relative w-full h-full bg-muted">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <Card className="max-w-md p-6 text-center">
            <h3 className="font-semibold text-lg mb-4">Google Maps API Key Required</h3>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>To display the map, you need to:</p>
              <ol className="text-left space-y-2">
                <li>1. Get a Google Maps API key from Google Cloud Console</li>
                <li>
                  2. Add it to your Project Settings as{" "}
                  <code className="bg-muted px-1 rounded">GOOGLE_MAPS_API_KEY</code>
                </li>
                <li>3. Restrict the key to your domain for security</li>
              </ol>
            </div>
          </Card>
        </div>

        {/* Info Card Preview */}
        <Card
          className={`absolute bg-card/95 backdrop-blur-sm border shadow-lg ${
            isMobile ? "bottom-4 left-4 right-4 p-4" : "left-4 top-1/2 -translate-y-1/2 w-80 p-6"
          }`}
        >
          <div className="space-y-3">
            <h2 className="font-semibold text-lg text-card-foreground leading-tight">{placeInfo.name}</h2>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-xs mt-0.5">📍</span>
                <span className="flex-1">地址：{placeInfo.address}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">🕒</span>
                <span>開放時間：{placeInfo.hours}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">📞</span>
                <span>電話：{placeInfo.phone}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Google Maps Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-muted-foreground">載入地圖中...</div>
        </div>
      )}

      {/* Info Card Overlay */}
      <Card
        className={`absolute bg-card/95 backdrop-blur-sm border shadow-lg ${
          isMobile ? "bottom-4 left-4 right-4 p-4" : "left-4 top-1/2 -translate-y-1/2 w-80 p-6"
        }`}
      >
        <div className="space-y-3">
          <h2 className="font-semibold text-lg text-card-foreground leading-tight">{placeInfo.name}</h2>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-xs mt-0.5">📍</span>
              <span className="flex-1">地址：{placeInfo.address}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs">🕒</span>
              <span>開放時間：{placeInfo.hours}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs">📞</span>
              <span>電話：{placeInfo.phone}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
