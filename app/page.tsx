"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  MapPin,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  AlertCircle,
  History,
  X,
  RefreshCw,
  Menu,
  ChevronLeft,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types
interface City {
  id: number
  name: string
  country: string
  lat: number
  lng: number
}

interface SearchResult {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  display_name: string
}

interface WeatherData {
  current: {
    temp: number
    feels_like: number
    humidity: number
    wind_speed: number
    visibility: number
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
  }
  hourly: Array<{
    dt: number
    temp: number
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
    humidity: number
    wind_speed: number
    pop: number // Probability of precipitation
  }>
  daily: Array<{
    dt: number
    temp: {
      day: number
      night: number
      min: number
      max: number
    }
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
    humidity: number
    wind_speed: number
    pop: number
    sunrise: number
    sunset: number
  }>
}

// Sample cities data
const cities: City[] = [
  { id: 1, name: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { id: 2, name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { id: 3, name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { id: 4, name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { id: 5, name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { id: 6, name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { id: 7, name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { id: 8, name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { id: 9, name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { id: 10, name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { id: 11, name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6176 },
  { id: 12, name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { id: 13, name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { id: 14, name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { id: 15, name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { id: 16, name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { id: 17, name: "Buenos Aires", country: "Argentina", lat: -34.6118, lng: -58.396 },
  { id: 18, name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { id: 19, name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { id: 20, name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
]

// Weather icon mapping
const getWeatherIcon = (iconCode: string) => {
  const iconMap: { [key: string]: any } = {
    "01d": Sun,
    "01n": Sun,
    "02d": Cloud,
    "02n": Cloud,
    "03d": Cloud,
    "03n": Cloud,
    "04d": Cloud,
    "04n": Cloud,
    "09d": CloudRain,
    "09n": CloudRain,
    "10d": CloudRain,
    "10n": CloudRain,
    "11d": CloudRain,
    "11n": CloudRain,
    "13d": Cloud,
    "13n": Cloud,
    "50d": Cloud,
    "50n": Cloud,
  }
  return iconMap[iconCode] || Cloud
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  })
}

const formatDetailedDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export default function WeatherMapApp() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showWeatherPopup, setShowWeatherPopup] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [mapboxError, setMapboxError] = useState<string | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const markers = useRef<any[]>([])
  const [mapMoved, setMapMoved] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("weatherMapSearchHistory")
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error("Error loading search history:", error)
      }
    }
  }, [])

  // Save search history to localStorage
  const saveSearchHistory = (history: SearchResult[]) => {
    try {
      localStorage.setItem("weatherMapSearchHistory", JSON.stringify(history))
    } catch (error) {
      console.error("Error saving search history:", error)
    }
  }

  // Add to search history
  const addToSearchHistory = (result: SearchResult) => {
    const newHistory = [result, ...searchHistory.filter((item) => item.id !== result.id)].slice(0, 5) // Keep only last 5 searches

    setSearchHistory(newHistory)
    saveSearchHistory(newHistory)
  }

  // Remove from search history
  const removeFromSearchHistory = (id: string) => {
    const newHistory = searchHistory.filter((item) => item.id !== id)
    setSearchHistory(newHistory)
    saveSearchHistory(newHistory)
  }

  // Add debug logging
  const addDebugInfo = (info: string) => {
    console.log(info)
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
  }

  // Filter cities based on search term
  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Search for places using Nominatim API
  const searchPlaces = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`,
      )
      const data = await response.json()

      const results: SearchResult[] = data.map((item: any, index: number) => ({
        id: `${item.place_id || index}`,
        name: item.name || item.display_name.split(",")[0],
        country: item.address?.country || "Unknown",
        lat: Number.parseFloat(item.lat),
        lng: Number.parseFloat(item.lon),
        display_name: item.display_name,
      }))

      setSearchResults(results)
      setShowSearchResults(true)
    } catch (error) {
      console.error("Error searching places:", error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchPlaces(searchTerm)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Get place name from coordinates using reverse geocoding
  const getPlaceName = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      )
      const data = await response.json()

      if (data && data.display_name) {
        const parts = data.display_name.split(",")
        const name = data.name || parts[0]
        const country = data.address?.country || parts[parts.length - 1]
        return `${name.trim()}, ${country.trim()}`
      }
    } catch (error) {
      console.error("Error getting place name:", error)
    }

    return `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`
  }

  // Load Mapbox dynamically
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        addDebugInfo("Starting Mapbox loading process...")

        // Check if Mapbox is already loaded
        if ((window as any).mapboxgl) {
          addDebugInfo("Mapbox already loaded")
          setMapboxLoaded(true)
          return
        }

        addDebugInfo("Loading Mapbox CSS...")
        // Load Mapbox CSS
        const link = document.createElement("link")
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
        link.rel = "stylesheet"
        link.onload = () => addDebugInfo("Mapbox CSS loaded")
        link.onerror = () => addDebugInfo("Failed to load Mapbox CSS")
        document.head.appendChild(link)

        addDebugInfo("Loading Mapbox JS...")
        // Load Mapbox JS
        const script = document.createElement("script")
        script.src = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"
        script.async = false // Load synchronously to ensure proper order

        script.onload = () => {
          addDebugInfo("Mapbox GL JS loaded successfully")
          // Wait a bit to ensure everything is ready
          setTimeout(() => {
            if ((window as any).mapboxgl) {
              addDebugInfo("Mapbox GL available on window")
              setMapboxLoaded(true)
            } else {
              addDebugInfo("Mapbox GL not available after loading")
              setMapboxError("Mapbox GL not available after loading")
            }
          }, 100)
        }

        script.onerror = (error) => {
          addDebugInfo(`Failed to load Mapbox GL JS: ${error}`)
          setMapboxError("Failed to load Mapbox GL JS from CDN")
        }

        document.head.appendChild(script)
      } catch (error) {
        addDebugInfo(`Error loading Mapbox: ${error}`)
        setMapboxError("Error loading Mapbox library")
      }
    }

    loadMapbox()
  }, [])

  // Initialize map when Mapbox is loaded
  useEffect(() => {
    if (!mapboxLoaded || map.current || !mapContainer.current) return

    addDebugInfo("Attempting to initialize map...")

    try {
      const mapboxgl = (window as any).mapboxgl

      if (!mapboxgl) {
        addDebugInfo("Mapbox GL JS not available on window")
        setMapboxError("Mapbox GL JS not available")
        return
      }

      addDebugInfo("Setting Mapbox access token...")
      // Your Mapbox token
      mapboxgl.accessToken =
        "pk.eyJ1IjoiamF5dGVjaGNvIiwiYSI6ImNtMG42ZmdybDAwZ2syanF4OHkwanQ5bmsifQ.-mlYGmZyZhRTxryPehwueQ"

      addDebugInfo("Creating map instance...")
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [0, 20],
        zoom: 2,
        attributionControl: true,
      })

      addDebugInfo("Map instance created, waiting for load event...")

      map.current.on("load", () => {
        addDebugInfo("Map loaded successfully!")
        setMapInitialized(true)

        // Add markers for all cities
        addDebugInfo("Adding city markers...")
        cities.forEach((city, index) => {
          try {
            const marker = new mapboxgl.Marker({
              color: "#3B82F6",
            })
              .setLngLat([city.lng, city.lat])
              .addTo(map.current)

            // Add click event to marker
            marker.getElement().addEventListener("click", (e) => {
              e.stopPropagation() // Prevent map click event
              addDebugInfo(`Clicked on ${city.name}`)
              setSelectedCity(city)
              fetchWeatherData(city)
            })

            markers.current.push(marker)
          } catch (markerError) {
            addDebugInfo(`Error creating marker for ${city.name}: ${markerError}`)
          }
        })
        addDebugInfo(`Added ${markers.current.length} markers`)

        // Add click event to map for any location
        map.current.on("click", async (e) => {
          const { lng, lat } = e.lngLat
          addDebugInfo(`Map clicked at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)

          // Get place name for the clicked location
          const placeName = await getPlaceName(lat, lng)

          // Create a temporary city object for the clicked location
          const clickedLocation: City = {
            id: 999,
            name: placeName.split(",")[0].trim(),
            country: placeName.split(",")[1]?.trim() || "Unknown",
            lat: lat,
            lng: lng,
          }

          setSelectedCity(clickedLocation)
          fetchWeatherDataForLocation(lat, lng, placeName)
        })

        // Track map movement
        map.current.on("moveend", () => {
          const center = map.current.getCenter()
          const zoom = map.current.getZoom()

          // Check if map has moved from initial position
          if (Math.abs(center.lng) > 0.1 || Math.abs(center.lat - 20) > 0.1 || Math.abs(zoom - 2) > 0.1) {
            setMapMoved(true)
          }
        })
      })

      map.current.on("error", (e: any) => {
        addDebugInfo(`Map error: ${JSON.stringify(e)}`)
        let errorMessage = "Map initialization error"

        if (e.error) {
          if (e.error.message) {
            errorMessage = e.error.message
          } else if (typeof e.error === "string") {
            errorMessage = e.error
          }
        }

        setMapboxError(errorMessage)
      })

      map.current.on("style.load", () => {
        addDebugInfo("Map style loaded")
      })
    } catch (error) {
      addDebugInfo(`Error initializing map: ${error}`)
      setMapboxError(`Failed to initialize map: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    return () => {
      if (map.current) {
        try {
          addDebugInfo("Cleaning up map...")
          map.current.remove()
          map.current = null
        } catch (error) {
          addDebugInfo(`Error removing map: ${error}`)
        }
      }
    }
  }, [mapboxLoaded])

  // Fetch weather data
  const fetchWeatherData = async (city: City) => {
    setLoading(true)
    setShowWeatherPopup(true)

    try {
      // Generate hourly data for next 24 hours
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        dt: Date.now() / 1000 + i * 3600, // Each hour
        temp: Math.round(Math.random() * 30 + 5 + Math.sin(i * 0.5) * 8), // Temperature variation
        weather: [
          {
            main: ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
            description: ["Clear sky", "Partly cloudy", "Light rain"][Math.floor(Math.random() * 3)],
            icon: ["01d", "02d", "10d"][Math.floor(Math.random() * 3)],
          },
        ],
        humidity: Math.round(Math.random() * 50 + 30),
        wind_speed: Math.round(Math.random() * 10 + 2),
        pop: Math.round(Math.random() * 100), // Probability of precipitation
      }))

      const mockWeatherData: WeatherData = {
        current: {
          temp: Math.round(Math.random() * 30 + 5),
          feels_like: Math.round(Math.random() * 30 + 5),
          humidity: Math.round(Math.random() * 50 + 30),
          wind_speed: Math.round(Math.random() * 10 + 2),
          visibility: Math.round(Math.random() * 5 + 5),
          weather: [
            {
              main: ["Clear", "Clouds", "Rain"][Math.floor(Math.random() * 3)],
              description: ["Clear sky", "Partly cloudy", "Light rain"][Math.floor(Math.random() * 3)],
              icon: ["01d", "02d", "10d"][Math.floor(Math.random() * 3)],
            },
          ],
        },
        hourly: hourlyData,
        daily: [
          {
            dt: Date.now() / 1000,
            temp: {
              day: Math.round(Math.random() * 30 + 5),
              night: Math.round(Math.random() * 20 + 0),
              min: Math.round(Math.random() * 15 + 0),
              max: Math.round(Math.random() * 35 + 10),
            },
            weather: [
              {
                main: "Clear",
                description: "Clear sky",
                icon: "01d",
              },
            ],
            humidity: Math.round(Math.random() * 50 + 30),
            wind_speed: Math.round(Math.random() * 10 + 2),
            pop: Math.round(Math.random() * 100),
            sunrise: Date.now() / 1000 + 6 * 3600, // 6 AM
            sunset: Date.now() / 1000 + 18 * 3600, // 6 PM
          },
          {
            dt: Date.now() / 1000 + 86400,
            temp: {
              day: Math.round(Math.random() * 30 + 5),
              night: Math.round(Math.random() * 20 + 0),
              min: Math.round(Math.random() * 15 + 0),
              max: Math.round(Math.random() * 35 + 10),
            },
            weather: [
              {
                main: "Clouds",
                description: "Partly cloudy",
                icon: "02d",
              },
            ],
            humidity: Math.round(Math.random() * 50 + 30),
            wind_speed: Math.round(Math.random() * 10 + 2),
            pop: Math.round(Math.random() * 100),
            sunrise: Date.now() / 1000 + 86400 + 6 * 3600,
            sunset: Date.now() / 1000 + 86400 + 18 * 3600,
          },
        ],
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setWeatherData(mockWeatherData)
    } catch (error) {
      console.error("Error fetching weather data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch weather data for any location
  const fetchWeatherDataForLocation = async (lat: number, lng: number, locationName: string) => {
    setLoading(true)
    setShowWeatherPopup(true)

    try {
      // Mock weather data with some variation based on location
      const tempVariation = Math.sin(lat * 0.1) * 10 + Math.cos(lng * 0.1) * 5
      const baseTemp = 20 + tempVariation

      // Generate hourly data for next 24 hours
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        dt: Date.now() / 1000 + i * 3600,
        temp: Math.round(baseTemp + Math.random() * 10 - 5 + Math.sin(i * 0.5) * 6),
        weather: [
          {
            main: ["Clear", "Clouds", "Rain", "Snow"][Math.floor(Math.random() * 4)],
            description: ["Clear sky", "Partly cloudy", "Light rain", "Light snow"][Math.floor(Math.random() * 4)],
            icon: ["01d", "02d", "10d", "13d"][Math.floor(Math.random() * 4)],
          },
        ],
        humidity: Math.round(Math.random() * 50 + 30),
        wind_speed: Math.round(Math.random() * 10 + 2),
        pop: Math.round(Math.random() * 100),
      }))

      const mockWeatherData: WeatherData = {
        current: {
          temp: Math.round(baseTemp + Math.random() * 10 - 5),
          feels_like: Math.round(baseTemp + Math.random() * 10 - 3),
          humidity: Math.round(Math.random() * 50 + 30),
          wind_speed: Math.round(Math.random() * 10 + 2),
          visibility: Math.round(Math.random() * 5 + 5),
          weather: [
            {
              main: ["Clear", "Clouds", "Rain", "Snow"][Math.floor(Math.random() * 4)],
              description: ["Clear sky", "Partly cloudy", "Light rain", "Light snow"][Math.floor(Math.random() * 4)],
              icon: ["01d", "02d", "10d", "13d"][Math.floor(Math.random() * 4)],
            },
          ],
        },
        hourly: hourlyData,
        daily: [
          {
            dt: Date.now() / 1000,
            temp: {
              day: Math.round(baseTemp + Math.random() * 8),
              night: Math.round(baseTemp - 5 + Math.random() * 5),
              min: Math.round(baseTemp - 8 + Math.random() * 3),
              max: Math.round(baseTemp + 8 + Math.random() * 5),
            },
            weather: [
              {
                main: "Clear",
                description: "Clear sky",
                icon: "01d",
              },
            ],
            humidity: Math.round(Math.random() * 50 + 30),
            wind_speed: Math.round(Math.random() * 10 + 2),
            pop: Math.round(Math.random() * 100),
            sunrise: Date.now() / 1000 + 6 * 3600,
            sunset: Date.now() / 1000 + 18 * 3600,
          },
          {
            dt: Date.now() / 1000 + 86400,
            temp: {
              day: Math.round(baseTemp + Math.random() * 8),
              night: Math.round(baseTemp - 5 + Math.random() * 5),
              min: Math.round(baseTemp - 8 + Math.random() * 3),
              max: Math.round(baseTemp + 8 + Math.random() * 5),
            },
            weather: [
              {
                main: "Clouds",
                description: "Partly cloudy",
                icon: "02d",
              },
            ],
            humidity: Math.round(Math.random() * 50 + 30),
            wind_speed: Math.round(Math.random() * 10 + 2),
            pop: Math.round(Math.random() * 100),
            sunrise: Date.now() / 1000 + 86400 + 6 * 3600,
            sunset: Date.now() / 1000 + 86400 + 18 * 3600,
          },
        ],
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setWeatherData(mockWeatherData)
    } catch (error) {
      console.error("Error fetching weather data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setSelectedCity(city)

    // Fly to city on map if map is initialized
    if (map.current && mapInitialized) {
      try {
        map.current.flyTo({
          center: [city.lng, city.lat],
          zoom: 10,
          duration: 2000,
        })
        setMapMoved(true)
      } catch (error) {
        console.error("Error flying to city:", error)
      }
    }

    fetchWeatherData(city)
  }

  // Handle search result selection
  const handleSearchResultSelect = (result: SearchResult) => {
    const city: City = {
      id: Number.parseInt(result.id),
      name: result.name,
      country: result.country,
      lat: result.lat,
      lng: result.lng,
    }

    // Add to search history
    addToSearchHistory(result)

    // Clear search
    setSearchTerm("")
    setShowSearchResults(false)
    setShowSearchHistory(false)

    // Select the location
    handleCitySelect(city)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  // Reset map to initial view
  const resetMapView = () => {
    if (map.current && mapInitialized) {
      try {
        setIsResetting(true)
        map.current.flyTo({
          center: [0, 20],
          zoom: 2,
          duration: 2000,
        })

        // Clear selection and close popup
        setSelectedCity(null)
        setShowWeatherPopup(false)

        // Reset map moved state after animation completes
        setTimeout(() => {
          setMapMoved(false)
          setIsResetting(false)
        }, 2000)
      } catch (error) {
        console.error("Error resetting map view:", error)
        setIsResetting(false)
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-full lg:w-80" : "w-0"
        } transition-all duration-300 overflow-hidden bg-white shadow-lg z-10 lg:relative absolute inset-y-0 left-0`}
      >
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Weather Cities</h1>
            <Button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden bg-gray-100 text-gray-600 hover:bg-gray-200"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search cities, countries, places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (searchHistory.length > 0 && !searchTerm) {
                  setShowSearchHistory(true)
                }
              }}
              className="pl-10 text-sm"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Search Results Dropdown */}
            {(showSearchResults || showSearchHistory) && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
                {showSearchHistory && searchHistory.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 flex items-center gap-2">
                      <History className="w-3 h-3" />
                      Recent Searches
                    </div>
                    {searchHistory.map((item) => (
                      <div
                        key={`history-${item.id}`}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center justify-between group"
                        onClick={() => handleSearchResultSelect(item)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <History className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                            <div className="text-xs text-gray-500 truncate">{item.country}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromSearchHistory(item.id)
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}

                {showSearchResults && searchResults.length > 0 && (
                  <>
                    {showSearchHistory && searchHistory.length > 0 && (
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Search Results</div>
                    )}
                    {searchResults.map((result) => (
                      <div
                        key={`search-${result.id}`}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                        onClick={() => handleSearchResultSelect(result)}
                      >
                        <div className="text-sm font-medium text-gray-800 truncate">{result.name}</div>
                        <div className="text-xs text-gray-500 truncate">{result.country}</div>
                        <div className="text-xs text-gray-400 truncate">{result.display_name}</div>
                      </div>
                    ))}
                  </>
                )}

                {showSearchResults && searchResults.length === 0 && !searchLoading && searchTerm && (
                  <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {filteredCities.map((city) => (
            <div
              key={city.id}
              onClick={() => handleCitySelect(city)}
              className={`p-3 sm:p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${
                selectedCity?.id === city.id ? "bg-blue-100 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-800 truncate">{city.name}</div>
                  <div className="text-sm text-gray-500 truncate">{city.country}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map Controls */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-white text-gray-800 hover:bg-gray-100 shadow-md"
            size="sm"
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSidebarOpen ? (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Hide</span>
              </>
            ) : (
              <>
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Menu</span>
              </>
            )}
          </Button>

          <Button
            onClick={resetMapView}
            className={`bg-white text-gray-800 hover:bg-gray-100 shadow-md ${isResetting ? "animate-pulse" : ""}`}
            size="sm"
            aria-label="Reset map view"
            disabled={isResetting}
          >
            <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-2">Reset</span>
          </Button>
        </div>

        {/* Debug Info Button - Hidden on mobile */}
        <Button
          onClick={() => setDebugInfo([])}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 bg-yellow-500 text-white hover:bg-yellow-600 shadow-md hidden sm:flex"
          size="sm"
        >
          <span className="text-xs">Debug</span>
        </Button>

        {/* Map Container */}
        <div className="w-full h-full">
          {mapboxError ? (
            <div className="flex items-center justify-center h-full bg-gray-100 p-2 sm:p-4">
              <div className="max-w-2xl w-full">
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2 text-sm">
                    <strong>Mapbox Error:</strong> {mapboxError}
                  </AlertDescription>
                </Alert>

                <Card className="mb-4 hidden sm:block">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Cloud className="w-5 h-5" />
                      Debug Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                      {debugInfo.map((info, index) => (
                        <div key={index} className="text-xs text-gray-600 mb-1">
                          {info}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Cloud className="w-5 h-5" />
                      Map Unavailable
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      The map couldn't be loaded, but you can still use the weather features.
                    </p>

                    <div className="text-center">
                      <Button onClick={() => window.location.reload()} className="mt-2">
                        Retry Loading Map
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : !mapboxLoaded ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center max-w-md px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600 mb-2">Loading Mapbox...</p>
                <p className="text-sm text-gray-500 mb-4">This may take a few seconds</p>

                {/* Debug info while loading - Hidden on mobile */}
                <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto hidden sm:block">
                  {debugInfo.slice(-5).map((info, index) => (
                    <div key={index} className="text-xs text-gray-600 mb-1">
                      {info}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <div
                ref={mapContainer}
                className="w-full h-full"
                style={{
                  minHeight: "400px",
                  backgroundColor: "#f0f0f0", // Fallback background
                }}
              />
              {!mapInitialized && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <div className="bg-white p-4 rounded-lg shadow-lg max-w-md mx-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 mb-2">Initializing map...</p>
                    <div className="bg-gray-50 p-2 rounded max-h-20 overflow-y-auto hidden sm:block">
                      {debugInfo.slice(-3).map((info, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          {info}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weather Popup */}
        {showWeatherPopup && selectedCity && (
          <div className="absolute top-2 sm:top-16 right-2 sm:right-4 w-full max-w-sm sm:w-96 max-h-[calc(100vh-1rem)] z-20 px-2 sm:px-0">
            <Card className="shadow-xl overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg truncate pr-2">
                    {selectedCity.name}, {selectedCity.country}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWeatherPopup(false)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-8rem)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : weatherData ? (
                  <div className="space-y-6">
                    {/* Current Weather */}
                    <div className="text-center pb-4 border-b">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {(() => {
                          const IconComponent = getWeatherIcon(weatherData.current.weather[0].icon)
                          return <IconComponent className="w-6 sm:w-8 h-6 sm:h-8 text-blue-500" />
                        })()}
                        <span className="text-2xl sm:text-3xl font-bold">{weatherData.current.temp}°C</span>
                      </div>
                      <p className="text-gray-600 capitalize text-sm sm:text-base">
                        {weatherData.current.weather[0].description}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">Feels like {weatherData.current.feels_like}°C</p>
                    </div>

                    {/* Current Weather Details */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{weatherData.current.humidity}% Humidity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{weatherData.current.wind_speed} m/s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{weatherData.current.visibility} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">Feels {weatherData.current.feels_like}°C</span>
                      </div>
                    </div>

                    {/* Today's Hourly Forecast */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Today's Hourly Forecast</h3>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {weatherData.hourly.slice(0, 12).map((hour, index) => (
                          <div key={index} className="flex-shrink-0 text-center bg-gray-50 rounded-lg p-2 min-w-[60px]">
                            <div className="text-xs text-gray-600 mb-1">
                              {index === 0 ? "Now" : formatTime(hour.dt)}
                            </div>
                            {(() => {
                              const IconComponent = getWeatherIcon(hour.weather[0].icon)
                              return <IconComponent className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                            })()}
                            <div className="text-sm font-medium">{hour.temp}°</div>
                            {hour.pop > 30 && <div className="text-xs text-blue-600">{hour.pop}%</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Today's Details */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Today's Details</h3>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">High / Low</span>
                          <span className="text-sm font-medium">
                            {weatherData.daily[0].temp.max}° / {weatherData.daily[0].temp.min}°
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Sunrise</span>
                          <span className="text-sm font-medium">{formatTime(weatherData.daily[0].sunrise)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Sunset</span>
                          <span className="text-sm font-medium">{formatTime(weatherData.daily[0].sunset)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Chance of Rain</span>
                          <span className="text-sm font-medium">{weatherData.daily[0].pop}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Humidity</span>
                          <span className="text-sm font-medium">{weatherData.daily[0].humidity}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Wind Speed</span>
                          <span className="text-sm font-medium">{weatherData.daily[0].wind_speed} m/s</span>
                        </div>
                      </div>
                    </div>

                    {/* Tomorrow's Forecast */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Tomorrow's Forecast</h3>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const IconComponent = getWeatherIcon(weatherData.daily[1].weather[0].icon)
                              return <IconComponent className="w-5 h-5 text-blue-500" />
                            })()}
                            <div>
                              <div className="font-medium text-sm">{formatDetailedDate(weatherData.daily[1].dt)}</div>
                              <div className="text-xs text-gray-600 capitalize">
                                {weatherData.daily[1].weather[0].description}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {weatherData.daily[1].temp.max}° / {weatherData.daily[1].temp.min}°
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Morning</span>
                            <span className="font-medium">
                              {Math.round((weatherData.daily[1].temp.max + weatherData.daily[1].temp.min) / 2 - 3)}°
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Afternoon</span>
                            <span className="font-medium">{weatherData.daily[1].temp.day}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Evening</span>
                            <span className="font-medium">
                              {Math.round((weatherData.daily[1].temp.day + weatherData.daily[1].temp.night) / 2)}°
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Night</span>
                            <span className="font-medium">{weatherData.daily[1].temp.night}°</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-3 gap-3 text-xs">
                          <div className="text-center">
                            <div className="text-gray-600">Rain</div>
                            <div className="font-medium">{weatherData.daily[1].pop}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Humidity</div>
                            <div className="font-medium">{weatherData.daily[1].humidity}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Wind</div>
                            <div className="font-medium">{weatherData.daily[1].wind_speed} m/s</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tomorrow's Hourly Preview */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Tomorrow's Hourly Preview</h3>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {weatherData.hourly.slice(12, 24).map((hour, index) => (
                          <div key={index} className="flex-shrink-0 text-center bg-blue-50 rounded-lg p-2 min-w-[60px]">
                            <div className="text-xs text-gray-600 mb-1">{formatTime(hour.dt)}</div>
                            {(() => {
                              const IconComponent = getWeatherIcon(hour.weather[0].icon)
                              return <IconComponent className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                            })()}
                            <div className="text-sm font-medium">{hour.temp}°</div>
                            {hour.pop > 30 && <div className="text-xs text-blue-600">{hour.pop}%</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
