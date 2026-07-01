export interface TourPackage {
  id: string;
  title: string;
  category: 'India' | 'International' | 'Theme';
  duration: string;
  bestFor: string;
  startingPrice: string;
  description: string;
  imageUrl: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  content: string;
  rating: number;
  avatarUrl?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AITripRequest {
  destination: string;
  travellers: string;
  travelDate: string;
  days: string;
  budget: string;
  travelType: string;
  startingCity: string;
  hotelPreference?: string;
  vehicleRequirement?: string;
  specialNeeds?: string;
}
