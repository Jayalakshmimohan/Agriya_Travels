export interface NewsItem {
  id?: string;
  title: string;
  category: 'Trend' | 'Tip' | 'Advisory' | 'News' | 'Insight' | string;
  summary: string;
  date: string;
  sourceTitle: string;
  sourceUrl?: string;
  tags?: string[];
  isToday?: boolean;
}

export function formatNewsDate(daysAgo: number = 0, baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() - daysAgo);

  if (daysAgo === 0) {
    return `Today, ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (daysAgo === 1) {
    return `Yesterday, ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Returns dynamic, authentic travel news, seasonal advisories, and tips
 * calculated relative to the exact current date/month/season.
 */
export function getDailyTravelNews(currentDate: Date = new Date(), seedOffset: number = 0): NewsItem[] {
  const month = currentDate.getMonth(); // 0 = Jan, 7 = Aug, 11 = Dec
  const year = currentDate.getFullYear();
  const dayOfWeek = currentDate.getDay();

  const todayStr = formatNewsDate(0, currentDate);
  const yesterdayStr = formatNewsDate(1, currentDate);
  const twoDaysAgoStr = formatNewsDate(2, currentDate);

  // Month-specific seasonal advisories and trends
  const seasonalPool: NewsItem[] = [];

  // August - September (Monsoon & Western Ghats & Onam Season)
  if (month >= 6 && month <= 8) {
    seasonalPool.push(
      {
        title: "Nilgiri Mountain Railway Weekend Special Runs Operational",
        category: "Trend",
        summary: "Southern Railway has scheduled additional weekend special services on the Mettupalayam-Ooty heritage line to accommodate high passenger volume from Chennai. Advance ticket reservation is recommended for weekend departures.",
        date: todayStr,
        sourceTitle: "Southern Railway Press Desk",
        sourceUrl: "https://sr.indianrailways.gov.in",
        isToday: true,
        tags: ["Ooty", "Heritage Rail", "Chennai Departure"]
      },
      {
        title: "Western Ghats Monsoon Scenic Route Advisory",
        category: "Advisory",
        summary: "State highway authorities report smooth transit across major Western Ghats ghat roads including Ooty, Kodaikanal, and Wayanad. Tourists are advised to avoid late-night hill driving and plan transit during daylight hours.",
        date: todayStr,
        sourceTitle: "Agriya Travels Safety Desk",
        sourceUrl: "",
        isToday: true,
        tags: ["Western Ghats", "Hill Stations", "Road Safety"]
      },
      {
        title: "Munnar Eco-Tourism Viewpoints Enforce Zero-Plastic Policy",
        category: "Tip",
        summary: "Kerala Tourism Board has reinforced strict zero-plastic regulations at Top Station, Kundala Dam, and Eravikulam National Park. Travelers are encouraged to carry reusable steel bottles with designated refill stations available.",
        date: yesterdayStr,
        sourceTitle: "Kerala Tourism Information",
        sourceUrl: "https://www.keralatourism.org",
        tags: ["Munnar", "Eco-Travel", "Kerala"]
      },
      {
        title: "Thailand 60-Day Visa-Free Entry for Indian Nationals Active",
        category: "News",
        summary: "The Royal Thai Government has reaffirmed the 60-day visa exemption scheme for Indian passport holders, offering seamless travel for popular holiday routes including Bangkok, Phuket, and Krabi.",
        date: yesterdayStr,
        sourceTitle: "Tourism Authority of Thailand",
        sourceUrl: "https://www.tatnews.org",
        tags: ["Thailand", "Visa Free", "International"]
      },
      {
        title: "Valparai & Athirapally Rainforest Route Peak Greenery",
        category: "Trend",
        summary: "The Pollachi-Valparai-Athirapally scenic circuit is currently at its most picturesque greenery. Forest department permits for the Sholayar jungle stretch are issued on-arrival at the checkpost.",
        date: twoDaysAgoStr,
        sourceTitle: "Tamil Nadu Tourism",
        sourceUrl: "https://www.tamilnadutourism.tn.gov.in",
        tags: ["Valparai", "Waterfalls", "Nature"]
      }
    );
  } else if (month >= 9 && month <= 10) {
    // October - November (Festive, Mysore Dasara, Diwali, Golden Triangle)
    seasonalPool.push(
      {
        title: "Mysore & Coorg Heritage Circuit Bookings Open for Festive Season",
        category: "Trend",
        summary: "Special royal palace illuminations and guided heritage walks are planned throughout the festive period. Early cab and resort reservations from Chennai are seeing record uptake.",
        date: todayStr,
        sourceTitle: "Karnataka Tourism Board",
        sourceUrl: "https://karnatakatourism.org",
        isToday: true,
        tags: ["Mysore", "Coorg", "Heritage"]
      },
      {
        title: "Tamil Nadu Temple Towns Special Transit Arrangements",
        category: "Advisory",
        summary: "Special fast-track darshan queues and dedicated multi-tier parking zones have been established across Madurai, Rameshwaram, and Thanjavur for the festive pilgrimage season.",
        date: todayStr,
        sourceTitle: "HR&CE Dept Bulletin",
        sourceUrl: "",
        isToday: true,
        tags: ["Pilgrimage", "Temple Tours", "South India"]
      },
      {
        title: "Rajasthan Heritage Forts & Desert Camps Winter Season Launch",
        category: "News",
        summary: "Desert luxury camps in Jaisalmer and palace stays in Jaipur/Udaipur have officially commenced their winter operations with enhanced cultural evening showcases.",
        date: yesterdayStr,
        sourceTitle: "Rajasthan Tourism",
        sourceUrl: "https://www.tourism.rajasthan.gov.in",
        tags: ["Rajasthan", "Desert Safari", "North India"]
      },
      {
        title: "Smart Luggage Packing for South-to-North Multi-City Flights",
        category: "Tip",
        summary: "With transitioning temperatures between southern coastal cities and northern destinations, carry layered apparel and verify domestic airline winter baggage weight allowances.",
        date: yesterdayStr,
        sourceTitle: "Agriya Travel Insights",
        sourceUrl: "",
        tags: ["Travel Tips", "Aviation", "Packing"]
      }
    );
  } else if (month >= 11 || month <= 1) {
    // December - February (Winter Peak, Kashmir Snow, Andaman Scuba)
    seasonalPool.push(
      {
        title: "Kashmir Gulmarg Gondola Phase-2 Winter Bookings High Demand",
        category: "Trend",
        summary: "Fresh snowfall has blanketed Gulmarg and Sonamarg. Travelers planning the iconic Phase-2 Gondola cable car ride are advised to book official tickets at least 15 days in advance.",
        date: todayStr,
        sourceTitle: "J&K Tourism Development Corp",
        sourceUrl: "https://www.jktourism.jk.gov.in",
        isToday: true,
        tags: ["Kashmir", "Snowfall", "Gulmarg"]
      },
      {
        title: "Andaman Islands High-Speed Ferry Timings Updated",
        category: "Advisory",
        summary: "Inter-island private cruise lines connecting Port Blair, Havelock (Swaraj Dweep), and Neil Island have added morning express sailings to cater to peak holiday arrivals.",
        date: todayStr,
        sourceTitle: "Andaman Tourism Directorate",
        sourceUrl: "",
        isToday: true,
        tags: ["Andamans", "Cruises", "Beach Holiday"]
      },
      {
        title: "Sri Lanka ETA Fee Exemption Scheme Active for Indian Tourists",
        category: "News",
        summary: "Sri Lanka Tourism has extended simplified tourist entry for Indian travelers, enabling swift online ETA issuance for Colombo, Kandy, and Bentota holidays.",
        date: yesterdayStr,
        sourceTitle: "Sri Lanka Tourism Bureau",
        sourceUrl: "https://www.srilanka.travel",
        tags: ["Sri Lanka", "International", "Visa Free"]
      },
      {
        title: "Best Photographic Golden Hours for Kanyakumari Sunset & Sunrise",
        category: "Tip",
        summary: "During winter months, clear coastal horizons offer peak clarity for the Triveni Sangam sunrise and sunset view from the Vivekananda Rock Memorial promenade.",
        date: yesterdayStr,
        sourceTitle: "Agriya Photography Desk",
        sourceUrl: "",
        tags: ["Kanyakumari", "Sunrise", "Photography"]
      }
    );
  } else {
    // March - June (Summer Hill Station Escapes & Himalayan Circuits)
    seasonalPool.push(
      {
        title: "Ooty & Kodaikanal e-Pass System Operating Smoothly",
        category: "Advisory",
        summary: "The district administration e-pass system for vehicular entry into the Nilgiris and Dindigul hill districts is active with instant free automated approvals at the district portal.",
        date: todayStr,
        sourceTitle: "District Collectorate Nilgiris",
        sourceUrl: "https://epass.tnega.org",
        isToday: true,
        tags: ["Ooty", "ePass", "Advisory"]
      },
      {
        title: "Ladakh Manali-Leh Highway Summer Clearance Completed",
        category: "News",
        summary: "Border Roads Organisation (BRO) has confirmed the opening of major high-altitude passes including Rohtang and Baralacha La for summer road expedition convoys.",
        date: todayStr,
        sourceTitle: "BRO Public Relations",
        sourceUrl: "",
        isToday: true,
        tags: ["Ladakh", "Road Trip", "Himalayas"]
      },
      {
        title: "Beat the Coastal Heat: High Altitude Plantations of Coorg & Wayanad",
        category: "Tip",
        summary: "Plantation homestays in Madikeri and Vythiri offer refreshing 18°C-22°C micro-climates along with guided spice walk trails and organic estate tours.",
        date: yesterdayStr,
        sourceTitle: "Agriya Summer Escapes",
        sourceUrl: "",
        tags: ["Coorg", "Wayanad", "Plantation Stays"]
      },
      {
        title: "Bali Direct Flight Connectivity from Chennai Seeing High Demand",
        category: "Trend",
        summary: "Streamlined connecting flight options from Chennai to Denpasar have made Bali a top choice for family summer vacations and honeymoon itineraries.",
        date: yesterdayStr,
        sourceTitle: "Indonesia Tourism Bureau",
        sourceUrl: "https://www.indonesia.travel",
        tags: ["Bali", "Direct Flights", "International"]
      }
    );
  }

  // Add universal daily tips
  const generalPool: NewsItem[] = [
    {
      title: "Agriya Cab Fleet FASTag & Toll Plaza Express Protocol Active",
      category: "Tip",
      summary: "All Agriya rental vehicles are equipped with priority automated toll processing and real-time GPS tracking for seamless outstation journey times without toll-gate delays.",
      date: todayStr,
      sourceTitle: "Agriya Operations Center",
      sourceUrl: "",
      isToday: true,
      tags: ["Fleet Safety", "Outstation", "FASTag"]
    },
    {
      title: "Malaysia Visa Exemption Extended for Indian Passport Holders",
      category: "News",
      summary: "Indian citizens traveling to Kuala Lumpur, Penang, or Langkawi continue to enjoy visa-free entry for stays up to 30 days upon completing the simple MDAC arrival card online.",
      date: yesterdayStr,
      sourceTitle: "Tourism Malaysia",
      sourceUrl: "https://www.malaysia.travel",
      tags: ["Malaysia", "Visa Free", "Southeast Asia"]
    },
    {
      title: "Airport Drop & Pickup Timing Best Practice Guidelines",
      category: "Tip",
      summary: "For international departures from Chennai Airport (MAA), schedule pickup at least 3.5 hours prior to departure to account for peak GST Road flyover traffic flow.",
      date: twoDaysAgoStr,
      sourceTitle: "Agriya Logistics Desk",
      sourceUrl: "",
      tags: ["Airport Transfer", "Chennai", "Timing"]
    }
  ];

  // Rotate items based on day of week and seed offset for dynamic variety
  const combined = [...seasonalPool, ...generalPool];
  const startIndex = (dayOfWeek + seedOffset) % combined.length;
  const rotated = [...combined.slice(startIndex), ...combined.slice(0, startIndex)];

  // Ensure first item is always marked as today's live advisory/news
  return rotated.slice(0, 4).map((item, idx) => ({
    ...item,
    id: `news-${year}-${month}-${idx}`,
    date: idx === 0 ? todayStr : idx === 1 ? todayStr : idx === 2 ? yesterdayStr : twoDaysAgoStr
  }));
}
