import { TourPackage, Testimonial } from '../types';

export const WHATSAPP_NUMBER = '919380054540'; 
export const CAB_BOOKING_EMAIL = 'cabbooking@agriyatravels.com';
export const TOUR_ENQUIRY_EMAIL = 'tourenquiry@agriyatravels.com';
export const TOUR_ENQUIRY_CC_EMAIL = 'saravana@agriyatravels.com';

export const tourPackages: TourPackage[] = [
  // India
  {
    id: 'ind-1',
    title: 'Kerala Family Holiday',
    category: 'India',
    duration: '5 Nights / 6 Days',
    bestFor: 'Family, Relaxation',
    startingPrice: '₹15,000',
    description: 'Experience the serene backwaters, lush tea gardens, and pristine beaches of "God\'s Own Country" with curated family-friendly stays.',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800', // Kerala
    weatherInfo: {
      historical: '24°C - 32°C',
      bestMonths: 'September to March',
      clothing: 'Light cotton clothing, sunglasses, and comfortable walking shoes.'
    }
  },
  {
    id: 'ind-2',
    title: 'Kashmir Scenic Escape',
    category: 'India',
    duration: '6 Nights / 7 Days',
    bestFor: 'Couples, Nature Lovers',
    startingPrice: '₹22,500',
    description: 'Discover the paradise on earth with romantic Shikara rides, snow-capped peaks, and breathtaking valley view resorts.',
    imageUrl: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800', // Kashmir
    weatherInfo: {
      historical: '-2°C to 20°C',
      bestMonths: 'March to August (Summer), Dec to Feb (Snow)',
      clothing: 'Heavy woolens in winter, light woolens and layers in summer.'
    }
  },
  {
    id: 'ind-3',
    title: 'South India Temple Tour',
    category: 'India',
    duration: '7 Nights / 8 Days',
    bestFor: 'Pilgrimage, Culture',
    startingPrice: '₹18,000',
    description: 'A deeply divine journey through the majestic and ancient temples of Tamil Nadu and Karnataka, guided by local experts.',
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800', // Temple
    weatherInfo: {
      historical: '22°C - 35°C',
      bestMonths: 'October to March',
      clothing: 'Modest cotton clothing (required for temples), easy-to-remove footwear.'
    }
  },
  {
    id: 'ind-4',
    title: 'Goa Premium Vacation',
    category: 'India',
    duration: '4 Nights / 5 Days',
    bestFor: 'Friends, Couples',
    startingPrice: '₹12,000',
    description: 'Relax on sun-kissed golden sands, explore rich Portuguese heritage, and enjoy vibrant nightlife with our exclusive itineraries.',
    imageUrl: 'https://images.unsplash.com/photo-1496566084516-c5b96fcbd5c8?auto=format&fit=crop&q=80&w=800', // Goa
    weatherInfo: {
      historical: '24°C - 33°C',
      bestMonths: 'November to February',
      clothing: 'Beachwear, light cottons, sunglasses, and hats.'
    }
  },
  {
    id: 'ind-5',
    title: 'Rajasthan Heritage Tour',
    category: 'India',
    duration: '8 Nights / 9 Days',
    bestFor: 'History, Family',
    startingPrice: '₹25,000',
    description: 'Step back in time to the majestic land of Maharajas, imposing forts, and colorful cultural performances.',
    imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=800', // Rajasthan
    weatherInfo: {
      historical: '10°C - 45°C (Seasonal extremes)',
      bestMonths: 'October to March',
      clothing: 'Cotton clothes for day, light jackets for chilly evenings in winter.'
    }
  },
  {
    id: 'ind-6',
    title: 'Tirupati VIP Darshan',
    category: 'India',
    duration: '1 Night / 2 Days',
    bestFor: 'Pilgrimage, Devotion',
    startingPrice: '₹4,500',
    description: 'A hassle-free divine trip with confirmed VIP Darshan tickets and comfortable transit from Chennai to Tirumala.',
    imageUrl: 'https://images.unsplash.com/photo-1741004437852-b5364488b628?auto=format&fit=crop&q=80&w=800', // Tirupati placeholder
    weatherInfo: {
      historical: '20°C - 40°C',
      bestMonths: 'September to February',
      clothing: 'Traditional modest wear (Mandatory: Dhoti/Kurta for men, Saree/Chudidhar for women).'
    }
  },
  {
    id: 'ind-7',
    title: 'Golden Triangle Heritage Tour',
    category: 'India',
    duration: '5 Nights / 6 Days',
    bestFor: 'History, Architecture',
    startingPrice: '₹19,500',
    description: 'Explore the iconic heritage arc of Delhi, Agra, and Jaipur. Witness the breathtaking Taj Mahal, majestic Amber Fort, and Delhi\'s historic monuments with local expert guides.',
    imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800',
    weatherInfo: {
      historical: '15°C - 38°C',
      bestMonths: 'October to March',
      clothing: 'Comfortable light cottons for daytime, light jacket for winter nights.'
    }
  },
  {
    id: 'ind-8',
    title: 'Leh Ladakh Wilderness Adventure',
    category: 'India',
    duration: '6 Nights / 7 Days',
    bestFor: 'Adventure, Landscapes',
    startingPrice: '₹28,000',
    description: 'Embark on a soul-stirring journey across the high mountain passes of Ladakh. Traverse Pangong Lake, Nubra Valley, and experience magnetic hill magic under the northern sky.',
    imageUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=800',
    weatherInfo: {
      historical: '-15°C to 25°C',
      bestMonths: 'May to September',
      clothing: 'Windproof jacket, heavy thermal layers, sunglasses, and trekking shoes.'
    }
  },
  {
    id: 'ind-9',
    title: 'Himachal Hills Escape',
    category: 'India',
    duration: '5 Nights / 6 Days',
    bestFor: 'Couples, Snow Lovers',
    startingPrice: '₹16,500',
    description: 'Escape the city heat to the beautiful snow peaks of Shimla and Manali. Enjoy Solang Valley adventure sports, scenic Mall Road walks, and pine forest exploration.',
    imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800',
    weatherInfo: {
      historical: '-2°C to 22°C',
      bestMonths: 'October to June',
      clothing: 'Warm layers, gloves, boots, heavy woolens if visiting during snowfall.'
    }
  },
  {
    id: 'ind-10',
    title: 'Hampi Monolithic Wonders',
    category: 'India',
    duration: '3 Nights / 4 Days',
    bestFor: 'Culture, Heritage',
    startingPrice: '₹11,000',
    description: 'Discover the surreal ruins of the Vijayanagara Empire. Wander among monolithic boulders, historic stone chariots, beautiful temples, and scenic Tungabhadra riverbanks.',
    imageUrl: 'https://images.unsplash.com/photo-1722934804353-0d9f6a55ab5e?auto=format&fit=crop&q=80&w=800',
    weatherInfo: {
      historical: '20°C - 38°C',
      bestMonths: 'October to March',
      clothing: 'Light breathable clothes, sunblock, comfortable walking shoes.'
    }
  },
  
  // International
  {
    id: 'int-1',
    title: 'Dubai Luxury Escape',
    category: 'International',
    duration: '4 Nights / 5 Days',
    bestFor: 'Family, Leisure',
    startingPrice: '₹45,000',
    description: 'Marvel at futuristic skyscrapers, enjoy premium desert safaris, and indulge in ultimate tax-free luxury shopping.',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800', // Dubai
    weatherInfo: {
      historical: '20°C - 45°C (Desert Climate)',
      bestMonths: 'November to March',
      clothing: 'Light breathable clothing, modesty in public areas, sunglasses, and hats.'
    }
  },
  {
    id: 'int-2',
    title: 'Singapore Explorer Tour',
    category: 'International',
    duration: '5 Nights / 6 Days',
    bestFor: 'Family, Adventure',
    startingPrice: '₹55,000',
    description: 'Experience the magic of Gardens by the Bay, Sentosa Island resorts, and world-class integrated theme parks.',
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=800', // Singapore
    weatherInfo: {
      historical: '26°C - 31°C (Humid year-round)',
      bestMonths: 'December to June',
      clothing: 'Light cottons, umbrellas/raincoats for sudden showers, comfortable walking shoes.'
    }
  },
  {
    id: 'int-3',
    title: 'Thailand Tropical Getaway',
    category: 'International',
    duration: '4 Nights / 5 Days',
    bestFor: 'Budget, Friends',
    startingPrice: '₹25,000',
    description: 'Immerse yourself in pristine beaches, vibrant night markets, and rich Buddhist culture with seamless end-to-end planning.',
    imageUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=800', // Thailand
    weatherInfo: {
      historical: '28°C - 35°C (Tropical Climate)',
      bestMonths: 'November to early April',
      clothing: 'Beachwear, light cottons, modest clothing for temple visits.'
    }
  },
  {
    id: 'int-4',
    title: 'Grand Europe Tour',
    category: 'International',
    duration: '12 Nights / 13 Days',
    bestFor: 'Couples, Luxury',
    startingPrice: '₹1,80,000',
    description: 'A meticulously crafted grand tour spanning Paris, the Swiss Alps, Rome, and Venice in unparalleled comfort.',
    imageUrl: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&q=80&w=800', // Europe
    weatherInfo: {
      historical: '0°C - 30°C (Varies widely by region)',
      bestMonths: 'May to September (Summer), Dec to Feb (Winter sports)',
      clothing: 'Layers are essential. Comfortable walking shoes, light jackets in summer, heavy coats in winter.'
    }
  },
  {
    id: 'int-5',
    title: 'Maldives Overwater Bliss',
    category: 'International',
    duration: '3 Nights / 4 Days',
    bestFor: 'Honeymoon, Couples',
    startingPrice: '₹85,000',
    description: 'Experience pure romance with luxury overwater villas, crystal clear turquoise waters, and unmatched privacy.',
    imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800', // Maldives
    weatherInfo: {
      historical: '25°C - 31°C (Tropical)',
      bestMonths: 'November to April',
      clothing: 'Swimwear, light resort wear, sun protection, flip flops.'
    }
  },
  {
    id: 'int-6',
    title: 'Bali Tropical Paradise',
    category: 'International',
    duration: '5 Nights / 6 Days',
    bestFor: 'Couples, Relaxation',
    startingPrice: '₹48,000',
    description: 'Indulge in spiritual temple visits, emerald green rice terraces of Ubud, vibrant volcanic sunsets, and luxury beach clubs in beautiful Bali.',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    weatherInfo: {
      historical: '24°C - 31°C (Tropical)',
      bestMonths: 'April to October (Dry Season)',
      clothing: 'Summer clothing, swimwear, light cardigan for breezy coastal nights.'
    }
  },
  {
    id: 'int-7',
    title: 'Swiss Alps Explorer',
    category: 'International',
    duration: '6 Nights / 7 Days',
    bestFor: 'Leisure, Nature',
    startingPrice: '₹1,45,000',
    description: 'Ride the famous Glacier Express, marvel at the mighty Matterhorn peak, and sail on serene alpine lakes in Interlaken and Lucerne. A fairytale Swiss getaway.',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800',
    weatherInfo: {
      historical: '-5°C to 20°C',
      bestMonths: 'June to September (Summer), Dec to March (Snow)',
      clothing: 'Warm layers, windproof outer coat, winter boots, and woolens.'
    }
  },
  {
    id: 'int-8',
    title: 'Japan Sakura Heritage',
    category: 'International',
    duration: '7 Nights / 8 Days',
    bestFor: 'Culture, Technology',
    startingPrice: '₹1,60,000',
    description: 'Behold Mount Fuji, travel by hyper-fast Shinkansen bullet train, explore ancient Kyoto shrines, and dive into Tokyo\'s neon-futuristic pop culture hubs.',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    weatherInfo: {
      historical: '3°C - 26°C',
      bestMonths: 'March to May (Cherry Blossom), September to November (Autumn)',
      clothing: 'Comfortable layers, light coat, walking shoes suitable for exploring temples.'
    }
  },

  // Theme
  {
    id: 'thm-1',
    title: 'Romantic Getaways',
    category: 'Theme',
    duration: 'Custom',
    bestFor: 'Couples, Honeymoon',
    startingPrice: 'Custom Quote',
    description: 'Bespoke romantic experiences designed to celebrate your love globally, tailored entirely to your preferences.',
    imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=800' 
  },
  {
    id: 'thm-2',
    title: 'Corporate Packages',
    category: 'Theme',
    duration: 'Flexible',
    bestFor: 'Corporate, Teams',
    startingPrice: 'Custom Quote',
    description: 'Professional team-building offshore trips combining highly productive workspaces and exclusive leisure activities.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800' 
  },
  {
    id: 'thm-3',
    title: 'Senior Citizen Tours',
    category: 'Theme',
    duration: 'Flexible',
    bestFor: 'Seniors, Leisure',
    startingPrice: 'Custom Quote',
    description: 'Thoughtfully paced itineraries with premium medical support, accessibility considerations, and comfortable transit.',
    imageUrl: 'https://images.unsplash.com/photo-1517672651691-24622a91b550?auto=format&fit=crop&q=80&w=800' 
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 't-1',
    name: 'Priya Sundaram',
    location: 'Chennai',
    content: 'Agriya Travels planned our entire Europe trip meticulously. From visas to local transfers, everything was flawless. Highly recommend them!',
    rating: 5,
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Priya&backgroundColor=f8fafc',
  },
  {
    id: 't-2',
    name: 'Rajesh Kumar',
    location: 'Bangalore',
    content: 'Our family trip to Kerala was amazing. The driver was very courteous and the hotels arranged were premium. Great value for money.',
    rating: 5,
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Rajesh&backgroundColor=f8fafc',
  },
  {
    id: 't-3',
    name: 'Anita Desai',
    location: 'Mumbai',
    content: 'Booked a Maldives honeymooon package. They customized it to perfectly fit our budget and gave us some lovely surprises.',
    rating: 5,
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Anita&backgroundColor=f8fafc',
  }
];
