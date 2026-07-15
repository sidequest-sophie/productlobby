import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RegionData {
  name: string
  count: number
  percentage: number
}

interface CountryData {
  name: string
  count: number
}

// Map of regions based on user location strings
const locationToRegion = (location: string | null | undefined): string => {
  if (!location) return 'Unknown'
  
  const loc = location.toLowerCase()
  
  // North America
  if (['usa', 'us', 'united states', 'canada', 'mexico'].some(c => loc.includes(c))) {
    return 'North America'
  }
  
  // Europe
  if (['uk', 'united kingdom', 'france', 'germany', 'spain', 'italy', 'netherlands', 
       'belgium', 'switzerland', 'sweden', 'norway', 'denmark', 'finland', 'poland',
       'portugal', 'austria', 'ireland', 'greece', 'czech', 'hungary', 'romania',
       'europe'].some(c => loc.includes(c))) {
    return 'Europe'
  }
  
  // Asia
  if (['china', 'japan', 'india', 'korea', 'singapore', 'thailand', 'vietnam',
       'malaysia', 'indonesia', 'philippines', 'pakistan', 'bangladesh', 'hong kong',
       'taiwan', 'asia'].some(c => loc.includes(c))) {
    return 'Asia'
  }
  
  // South America
  if (['brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela', 'south america'].some(c => loc.includes(c))) {
    return 'South America'
  }
  
  // Africa
  if (['south africa', 'nigeria', 'egypt', 'kenya', 'ethiopia', 'ghana', 'uganda',
       'tanzania', 'morocco', 'algeria', 'africa'].some(c => loc.includes(c))) {
    return 'Africa'
  }
  
  // Oceania
  if (['australia', 'new zealand', 'fiji', 'samoa', 'oceania', 'aotearoa'].some(c => loc.includes(c))) {
    return 'Oceania'
  }
  
  return 'Other'
}

// Extract country from location string
const extractCountry = (location: string | null | undefined): string => {
  if (!location) return 'Unknown'
  
  // Try to get the last part after comma (usually the country)
  const parts = location.split(',').map(p => p.trim())
  if (parts.length > 1) {
    return parts[parts.length - 1]
  }
  
  return location
}

// GET /api/campaigns/[id]/geo - Get geographic data for campaign supporters
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all supporters (lobbies) with user location data
    const lobbies = await prisma.lobby.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            location: true
          }
        }
      }
    })

    // Aggregate regional data
    const regionCounts: { [key: string]: number } = {
      'North America': 0,
      'Europe': 0,
      'Asia': 0,
      'South America': 0,
      'Africa': 0,
      'Oceania': 0,
      'Other': 0,
      'Unknown': 0
    }

    const countryCounts: { [key: string]: number } = {}

    lobbies.forEach(lobby => {
      const location = lobby.user.location
      const region = locationToRegion(location)
      regionCounts[region] = (regionCounts[region] || 0) + 1

      const country = extractCountry(location)
      if (country !== 'Unknown' && country !== 'Other') {
        countryCounts[country] = (countryCounts[country] || 0) + 1
      }
    })

    const total = lobbies.length

    // Calculate percentages for regions
    const regions: RegionData[] = [
      'North America',
      'Europe',
      'Asia',
      'South America',
      'Africa',
      'Oceania'
    ].map(name => ({
      name,
      count: regionCounts[name] || 0,
      percentage: total > 0 ? ((regionCounts[name] || 0) / total) * 100 : 0
    })).filter(r => r.count > 0 || r.name) // Include all regions
      .sort((a, b) => b.count - a.count)

    // Get top 5 countries
    const topCountries: CountryData[] = Object.entries(countryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      regions,
      topCountries,
      total
    })
  } catch (error) {
    console.error('Geographic data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
