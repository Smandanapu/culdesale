export function generateMultiStopUrl(sales, userLocation) {
  if (!sales || sales.length === 0) return ''

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  // Construct standard address strings
  const formatAddress = (sale) => encodeURIComponent(`${sale.address}, ${sale.city}, ${sale.state} ${sale.zip_code}`)

  if (isIOS) {
    // Apple Maps URL Scheme
    // e.g. maps://?saddr=Current+Location&daddr=Stop1+to:Stop2+to:Stop3
    let url = 'maps://?'
    if (userLocation) {
      url += 'saddr=Current+Location&'
    }
    
    // daddr supports multi-stop on newer iOS if formatted with +to:
    // Fallback: mostly routes to the first or last, but let's try the modern format
    const destinations = sales.map(formatAddress).join('+to:')
    url += `daddr=${destinations}`
    return url
  } else {
    // Google Maps URL Scheme
    // e.g. https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=End&waypoints=Stop1|Stop2
    let url = 'https://www.google.com/maps/dir/?api=1'
    
    // If we only have 1 stop
    if (sales.length === 1) {
      url += `&destination=${formatAddress(sales[0])}`
      return url
    }

    const destination = formatAddress(sales[sales.length - 1])
    const waypoints = sales.slice(0, sales.length - 1).map(formatAddress).join('|')

    url += `&destination=${destination}&waypoints=${waypoints}`
    return url
  }
}
