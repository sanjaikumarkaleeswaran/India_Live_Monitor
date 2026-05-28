const Parser = require('rss-parser')
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8'
  },
  customFields: {
    item: [
      ['geo:Point', 'geoPoint'],
      ['gdacs:alertlevel', 'alertLevel'],
      ['gdacs:eventtype', 'eventType'],
      ['gdacs:country', 'country'],
      ['gdacs:severity', 'severity']
    ]
  }
})

/**
 * Fetch live disaster alerts from GDACS (Global Disaster Alert and Coordination System)
 * and convert them into our system's alert schema format.
 */
const fetchLiveGDACSAlerts = async () => {
  try {
    const feed = await parser.parseURL('https://www.gdacs.org/xml/rss.xml')
    
    // Filter for events that might be relevant (e.g. in India, or nearby, or high severity globally)
    // For this implementation, we will filter for events happening in "India" or high severity events
    const relevantEvents = feed.items.filter(item => {
      const isIndia = item.title?.includes('India') || item.description?.includes('India') || item.country === 'India'
      return isIndia || item.alertLevel === 'Red' || item.alertLevel === 'Orange'
    })

    return relevantEvents.map(item => {
      // Parse coordinates (geo:Point format is usually "lat lon")
      let coordinates = [78.9629, 20.5937] // Default India center
      if (typeof item.geoPoint === 'string') {
        const parts = item.geoPoint.split(' ')
        if (parts.length === 2) {
          // geo:Point is lat lon. MongoDB wants [lon, lat]
          coordinates = [parseFloat(parts[1]), parseFloat(parts[0])]
        }
      }

      // Map GDACS alert levels to our severity
      let severity = 'low'
      if (item.alertLevel === 'Red') severity = 'critical'
      else if (item.alertLevel === 'Orange') severity = 'high'
      else if (item.alertLevel === 'Green') severity = 'low'

      // Map GDACS event types to our categories
      let category = 'disaster'
      const typeStr = item.eventType || ''
      if (typeStr === 'TC' || typeStr === 'FL') category = 'weather' // Tropical Cyclone, Flood
      else if (typeStr === 'EQ' || typeStr === 'VO' || typeStr === 'DR') category = 'disaster' // Earthquake, Volcano, Drought

      return {
        title: item.title?.replace(/<[^>]*>?/gm, '') || 'Global Alert',
        description: item.description?.replace(/<[^>]*>?/gm, '') || 'Live alert from GDACS',
        type: typeStr || 'Disaster Warning',
        severity,
        category,
        affectedStates: [item.country || 'International'],
        location: {
          type: 'Point',
          coordinates
        },
        source: 'GDACS Live Feed',
        isActive: true,
        isVerified: true,
        createdAt: item.pubDate ? new Date(item.pubDate) : new Date()
      }
    })
  } catch (error) {
    console.error('Error fetching live GDACS alerts:', error.message)
    return []
  }
}

module.exports = {
  fetchLiveGDACSAlerts
}
