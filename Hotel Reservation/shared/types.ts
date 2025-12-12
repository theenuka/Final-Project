export type UserType = {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "user" | "admin" | "hotel_owner" | "staff";
  phone?: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  totalBookings?: number;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  preferences?: {
    preferredDestinations: string[];
    preferredHotelTypes: string[];
    budgetRange: {
      min: number;
      max: number;
    };
  };
  notificationPreferences?: {
    emailBookingConfirmation: boolean;
    emailReminders: boolean;
    emailPromotions: boolean;
    smsBookingConfirmation: boolean;
    smsReminders: boolean;
  };
  lastLogin?: Date;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type FacilitySpaceType = {
  name: string;
  type: string;
  description?: string;
  capacity?: number;
  areaSqFt?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  currency?: string;
  amenities?: string[];
  bookingRules?: string[];
  isAvailable?: boolean;
  lastMaintainedAt?: Date;
  images?: string[];
};

export type RoomType = {
  _id: string;
  hotelId: string;
  name: string;
  description: string;
  adultCount: number;
  childCount: number;
  pricePerNight: number;
  amenities: string[];
  imageUrls: string[];
};

export type HotelType = {
  _id: string;
  userId: string;
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  facilities: string[];
  facilitySpaces?: FacilitySpaceType[];
  roomTypes: RoomType[];
  starRating: number;
  imageUrls: string[];
  lastUpdated: Date;
  // Remove embedded bookings - using separate collection now
  // bookings: BookingType[];

  // New fields
  location?: {
    latitude: number;
    longitude: number;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  contact?: {
    phone: string;
    email: string;
    website: string;
  };
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    petPolicy: string;
    smokingPolicy: string;
  };
  amenities?: {
    parking: boolean;
    wifi: boolean;
    pool: boolean;
    gym: boolean;
    spa: boolean;
    restaurant: boolean;
    bar: boolean;
    airportShuttle: boolean;
    businessCenter: boolean;
  };
  totalBookings?: number;
  totalRevenue?: number;
  averageRating?: number;
  reviewCount?: number;
  occupancyRate?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  minPricePerNight?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RoomAllocationType = {
  roomType: string;
  roomNumber?: string;
  adultCount: number;
  childCount: number;
  pricePerNight: number;
  specialRequests?: string;
};

export type BookingType = {
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCost: number;
  // Multi-room support
  roomCount?: number;
  rooms?: RoomAllocationType[];
  status?: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  specialRequests?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Room = {
  _id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  isAvailable: boolean;
  lastMaintainedAt?: Date;
};

export type HotelWithBookingsType = HotelType & {
  bookings: BookingType[];
};

export type HotelSearchResponse = {
  data: HotelType[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
};

export type PaymentIntentResponse = {
  paymentIntentId: string;
  clientSecret: string;
  totalCost: number;
};
