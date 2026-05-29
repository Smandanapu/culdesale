import { createContext, useContext, useState, useEffect } from 'react'

const RouteContext = createContext()

export function RouteProvider({ children }) {
  const [route, setRoute] = useState(() => {
    try {
      const saved = localStorage.getItem('garage_sale_route')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('garage_sale_route', JSON.stringify(route))
  }, [route])

  const addSaleToRoute = (sale) => {
    setRoute(prev => {
      if (prev.find(s => s.id === sale.id)) return prev
      return [...prev, sale]
    })
  }

  const removeSaleFromRoute = (saleId) => {
    setRoute(prev => prev.filter(s => s.id !== saleId))
  }

  const clearRoute = () => {
    setRoute([])
  }

  const reorderRoute = (startIndex, endIndex) => {
    setRoute(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }

  const isInRoute = (saleId) => {
    return route.some(s => s.id === saleId)
  }

  return (
    <RouteContext.Provider value={{ route, addSaleToRoute, removeSaleFromRoute, clearRoute, reorderRoute, isInRoute }}>
      {children}
    </RouteContext.Provider>
  )
}

export function useRoute() {
  const context = useContext(RouteContext)
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider')
  }
  return context
}
