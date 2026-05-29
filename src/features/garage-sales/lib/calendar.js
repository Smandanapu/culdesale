export function generateICS(sale) {
  // Format date to ICS standard: YYYYMMDDTHHmm00
  const formatICSDate = (dateString, timeString) => {
    // dateString: YYYY-MM-DD
    // timeString: HH:MM
    const dateStr = dateString.replace(/-/g, '')
    const timeStr = timeString.replace(':', '') + '00'
    return `${dateStr}T${timeStr}`
  }

  const startDate = formatICSDate(sale.start_date, sale.start_time)
  const endDate = formatICSDate(sale.end_date || sale.start_date, sale.end_time)

  const address = `${sale.address}, ${sale.city}, ${sale.state} ${sale.zip_code}`

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulDeSale//Garage Sales//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART;TZID=America/New_York:${startDate}`,
    `DTEND;TZID=America/New_York:${endDate}`,
    `SUMMARY:Garage Sale: ${sale.title}`,
    `DESCRIPTION:${sale.description || 'Join us for this garage sale!'}`,
    `LOCATION:${address}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return icsContent
}

export function downloadICS(sale) {
  const content = generateICS(sale)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${sale.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_garage_sale.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
