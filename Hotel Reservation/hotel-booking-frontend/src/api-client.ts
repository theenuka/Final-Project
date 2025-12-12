import axiosInstance from "./lib/api-client";
import {
  HotelSearchResponse,
  HotelType,
  PaymentIntentResponse,
  UserType,
  HotelWithBookingsType,
  BookingType,
  RoomType,
  Room,
} from "../../shared/types";
import { BookingFormData } from "./forms/BookingForm/BookingForm";

// NOTE: We removed 'register' and 'signIn' functions because Asgardeo handles auth now.

export const fetchCurrentUser = async (): Promise<UserType> => {
  const response = await axiosInstance.get("/api/users/me");
  return response.data;
};

// Development utility to clear all browser storage
export const clearAllStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

export const addMyHotel = async (hotelFormData: FormData) => {
  const response = await axiosInstance.post("/api/my-hotels", hotelFormData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const fetchMyHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/my-hotels");
  return response.data;
};

export const fetchMyHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export const updateMyHotelById = async (hotelFormData: FormData) => {
  const hotelId = hotelFormData.get("hotelId");
  const response = await axiosInstance.put(
    `/api/my-hotels/${hotelId}`,
    hotelFormData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteMyHotelById = async (hotelId: string) => {
  const response = await axiosInstance.delete(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export const getRoomTypes = async (hotelId: string): Promise<RoomType[]> => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}/room-types`);
  return response.data;
};

export const createRoomType = async (hotelId: string, roomTypeData: FormData): Promise<RoomType> => {
  const response = await axiosInstance.post(`/api/hotels/${hotelId}/room-types`, roomTypeData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateRoomType = async (hotelId: string, roomTypeId: string, roomTypeData: FormData): Promise<RoomType> => {
  const response = await axiosInstance.patch(`/api/hotels/${hotelId}/room-types/${roomTypeId}`, roomTypeData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteRoomType = async (hotelId: string, roomTypeId: string) => {
  const response = await axiosInstance.delete(`/api/hotels/${hotelId}/room-types/${roomTypeId}`);
  return response.data;
};

export const getRooms = async (hotelId: string, roomTypeId: string): Promise<Room[]> => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}/rooms`, {
    params: { roomTypeId },
  });
  return response.data;
};

export const createRoom = async (hotelId: string, roomData: { roomNumber: string; roomTypeId: string }): Promise<Room> => {
  const response = await axiosInstance.post(`/api/hotels/${hotelId}/rooms`, roomData);
  return response.data;
};

export const updateRoom = async (hotelId: string, roomId: string, roomData: { roomNumber: string; isAvailable: boolean }): Promise<Room> => {
  const response = await axiosInstance.patch(`/api/hotels/${hotelId}/rooms/${roomId}`, roomData);
  return response.data;
};

export const deleteRoom = async (hotelId: string, roomId: string) => {
  const response = await axiosInstance.delete(`/api/hotels/${hotelId}/rooms/${roomId}`);
  return response.data;
};

export const getAllRoomTypes = async (): Promise<RoomType[]> => {
  const response = await axiosInstance.get("/api/room-types");
  return response.data;
};



export type SearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adultCount?: string;
  childCount?: string;
  page?: string;
  facilities?: string[];
  types?: string[];
  stars?: string[];
  maxPrice?: string;
  sortOption?: string;
  roomTypeId?: string;
};

export const searchHotels = async (
  searchParams: SearchParams
): Promise<HotelSearchResponse> => {
  const queryParams = new URLSearchParams();

  if (searchParams.destination && searchParams.destination.trim() !== "") {
    queryParams.append("destination", searchParams.destination.trim());
  }

  if (searchParams.checkIn) queryParams.append("checkIn", searchParams.checkIn);
  if (searchParams.checkOut) queryParams.append("checkOut", searchParams.checkOut);
  if (searchParams.adultCount) queryParams.append("adultCount", searchParams.adultCount);
  if (searchParams.childCount) queryParams.append("childCount", searchParams.childCount);
  if (searchParams.page) queryParams.append("page", searchParams.page);
  if (searchParams.maxPrice) queryParams.append("maxPrice", searchParams.maxPrice);
  if (searchParams.sortOption) queryParams.append("sortOption", searchParams.sortOption);
  if (searchParams.roomTypeId) queryParams.append("roomTypeId", searchParams.roomTypeId);

  searchParams.facilities?.forEach((facility) =>
    queryParams.append("facilities", facility)
  );

  searchParams.types?.forEach((type) => queryParams.append("types", type));
  searchParams.stars?.forEach((star) => queryParams.append("stars", star));

  const response = await axiosInstance.get(`/api/hotels/search?${queryParams}`);
  return response.data;
};

export const fetchHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/hotels");
  return response.data;
};

export const fetchHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}`);
  return response.data;
};

export const createPaymentIntent = async (
  hotelId: string,
  numberOfNights: string,
  roomCount: number = 1,
  roomTypeId: string
): Promise<PaymentIntentResponse> => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/bookings/payment-intent`,
    { numberOfNights, roomCount, roomTypeId }
  );
  return response.data;
};

export const createRoomBooking = async (formData: BookingFormData) => {
  const response = await axiosInstance.post(
    `/api/hotels/${formData.hotelId}/bookings`,
    formData
  );
  return response.data;
};

export const fetchMyBookings = async (): Promise<HotelWithBookingsType[]> => {
  const response = await axiosInstance.get("/api/my-bookings");
  return response.data;
};

export const fetchHotelBookings = async (
  hotelId: string
): Promise<BookingType[]> => {
  const response = await axiosInstance.get(`/api/bookings/hotel/${hotelId}`);
  return response.data;
};

// Business Insights API functions
export const fetchBusinessInsightsDashboard = async () => {
  const response = await axiosInstance.get("/api/business-insights/dashboard");
  return response.data;
};

export const fetchBusinessInsightsForecast = async () => {
  const response = await axiosInstance.get("/api/business-insights/forecast");
  return response.data;
};

export const fetchBusinessInsightsPerformance = async () => {
  const response = await axiosInstance.get(
    "/api/business-insights/performance"
  );
  return response.data;
};

// User Profile API functions
export const fetchAllUsers = async (): Promise<UserType[]> => {
  const response = await axiosInstance.get("/api/admin/users");
  return response.data;
};

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export const updateUserProfile = async (data: UpdateProfileData): Promise<UserType> => {
  const response = await axiosInstance.patch("/api/users/me", data);
  return response.data;
};

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.patch("/api/users/me/notifications", preferences);
  return response.data;
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await axiosInstance.get("/api/users/me/notifications");
  return response.data;
};

// Loyalty Program API functions
export interface LoyaltyInfo {
  tier: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  totalBookings: number;
  memberSince: string;
  nextTierPoints?: number;
  benefits: string[];
}

export const getLoyaltyInfo = async (): Promise<LoyaltyInfo> => {
  const response = await axiosInstance.get("/api/users/me/loyalty");
  return response.data;
};

// Booking Cancellation API
export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; refundAmount?: number }> => {
  const response = await axiosInstance.post(`/api/bookings/${bookingId}/cancel`, {
    reason,
  });
  return response.data;
};

// Notifications API
export interface Notification {
  _id: string;
  type: "booking" | "reminder" | "promotion" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await axiosInstance.get("/api/notifications");
  return response.data;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await axiosInstance.patch(`/api/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await axiosInstance.patch("/api/notifications/read-all");
};

export const getUnreadNotificationCount = async (): Promise<{ count: number }> => {
  const response = await axiosInstance.get("/api/notifications/unread-count");
  return response.data;
};

// ============================================================================
// FACILITY BOOKING API FUNCTIONS (Spa, Gym, Conference Rooms)
// ============================================================================

export interface FacilityBooking {
  _id: string;
  userId: string;
  hotelId: string;
  facilityName: string;
  facilityType: "spa" | "gym" | "conference" | "pool" | "restaurant" | "other";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  guestCount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacilityAvailability {
  date: string;
  facilityName: string;
  bookedSlots: Array<{
    startTime: string;
    endTime: string;
    guestCount: number;
  }>;
}

export interface FacilityBookingInput {
  facilityName: string;
  facilityType: "spa" | "gym" | "conference" | "pool" | "restaurant" | "other";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  guestCount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: number;
  specialRequests?: string;
}

// Get facility availability for a specific date
export const getFacilityAvailability = async (
  hotelId: string,
  facilityName: string,
  date: string
): Promise<FacilityAvailability> => {
  const response = await axiosInstance.get(
    `/api/hotels/${hotelId}/facilities/${encodeURIComponent(facilityName)}/availability`,
    { params: { date } }
  );
  return response.data;
};

// Book a facility (spa, gym, conference room, etc.)
export const bookFacility = async (
  hotelId: string,
  bookingData: FacilityBookingInput
): Promise<{ bookingId: string; booking: FacilityBooking }> => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/facilities/book`,
    bookingData
  );
  return response.data;
};

// Get user's facility bookings
export const getMyFacilityBookings = async (): Promise<FacilityBooking[]> => {
  const response = await axiosInstance.get("/api/my-facility-bookings");
  return response.data;
};

// Get facility bookings for a hotel (hotel owner)
export const getHotelFacilityBookings = async (
  hotelId: string,
  filters?: {
    facilityName?: string;
    status?: string;
    date?: string;
  }
): Promise<FacilityBooking[]> => {
  const response = await axiosInstance.get(
    `/api/hotels/${hotelId}/facility-bookings`,
    { params: filters }
  );
  return response.data;
};

// Cancel a facility booking
export const cancelFacilityBooking = async (
  bookingId: string,
  reason?: string
): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(
    `/api/facility-bookings/${bookingId}/cancel`,
    { reason }
  );
  return response.data;
};

// Update a facility booking
export const updateFacilityBooking = async (
  bookingId: string,
  updates: Partial<{
    bookingDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    specialRequests: string;
  }>
): Promise<FacilityBooking> => {
  const response = await axiosInstance.patch(
    `/api/facility-bookings/${bookingId}`,
    updates
  );
  return response.data;
};
