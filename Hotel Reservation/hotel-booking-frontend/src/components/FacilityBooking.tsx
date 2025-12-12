import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import useAppContext from "../hooks/useAppContext";
import * as apiClient from "../api-client";
import { FacilityBookingInput } from "../api-client";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Sparkles,
  Dumbbell,
  Users,
  Coffee,
  Waves,
  UtensilsCrossed,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface FacilitySpace {
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
  images?: string[];
}

interface FacilityBookingProps {
  hotelId: string;
  facilitySpaces?: FacilitySpace[];
}

interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  guestCount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  specialRequests: string;
}

const facilityIcons: Record<string, React.ReactNode> = {
  spa: <Sparkles className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  conference: <Users className="w-5 h-5" />,
  pool: <Waves className="w-5 h-5" />,
  restaurant: <UtensilsCrossed className="w-5 h-5" />,
  lounge: <Coffee className="w-5 h-5" />,
  other: <Users className="w-5 h-5" />,
};

const facilityTypeMap: Record<string, "spa" | "gym" | "conference" | "pool" | "restaurant" | "other"> = {
  spa: "spa",
  wellness: "spa",
  massage: "spa",
  gym: "gym",
  fitness: "gym",
  conference: "conference",
  meeting: "conference",
  boardroom: "conference",
  pool: "pool",
  swimming: "pool",
  restaurant: "restaurant",
  dining: "restaurant",
  lounge: "other",
  other: "other",
};

const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

const FacilityBooking = ({ hotelId, facilitySpaces }: FacilityBookingProps) => {
  const { showToast, isLoggedIn } = useAppContext();
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState<FacilitySpace | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      guestCount: 1,
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  const startTime = watch("startTime");
  const endTime = watch("endTime");

  // Fetch availability when facility and date are selected
  const { data: availability, isLoading: loadingAvailability } = useQuery(
    ["facilityAvailability", hotelId, selectedFacility?.name, selectedDate],
    () =>
      apiClient.getFacilityAvailability(hotelId, selectedFacility!.name, selectedDate),
    {
      enabled: !!selectedFacility && !!selectedDate,
    }
  );

  // Calculate duration and cost
  const { duration, totalCost } = useMemo(() => {
    if (!startTime || !endTime || !selectedFacility) {
      return { duration: 0, totalCost: 0 };
    }
    const start = parseInt(startTime.split(":")[0]);
    const end = parseInt(endTime.split(":")[0]);
    const dur = end - start;
    if (dur <= 0) return { duration: 0, totalCost: 0 };

    const pricePerHour = selectedFacility.pricePerHour || 0;
    return { duration: dur, totalCost: dur * pricePerHour };
  }, [startTime, endTime, selectedFacility]);

  // Check if selected time slot is available
  const isTimeSlotAvailable = (start: string, end: string) => {
    if (!availability) return true;
    const bookedSlots = availability.bookedSlots || [];
    return !bookedSlots.some(
      (slot) =>
        (start >= slot.startTime && start < slot.endTime) ||
        (end > slot.startTime && end <= slot.endTime) ||
        (start <= slot.startTime && end >= slot.endTime)
    );
  };

  const currentSlotAvailable = isTimeSlotAvailable(startTime, endTime);

  // Book facility mutation
  const bookFacilityMutation = useMutation(
    (data: FacilityBookingInput) => apiClient.bookFacility(hotelId, data),
    {
      onSuccess: () => {
        showToast({ title: "Facility booked successfully!", type: "SUCCESS" });
        setBookingSuccess(true);
        queryClient.invalidateQueries(["facilityAvailability"]);
        queryClient.invalidateQueries(["myFacilityBookings"]);
        setTimeout(() => {
          setShowBookingForm(false);
          setBookingSuccess(false);
          reset();
        }, 2000);
      },
      onError: (error: Error) => {
        showToast({
          title: "Failed to book facility",
          description: error.message,
          type: "ERROR",
        });
      },
    }
  );

  const onSubmit = (data: BookingFormData) => {
    if (!selectedFacility || !isLoggedIn) return;

    const facilityType =
      facilityTypeMap[selectedFacility.type.toLowerCase()] || "other";

    bookFacilityMutation.mutate({
      facilityName: selectedFacility.name,
      facilityType,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      guestCount: data.guestCount,
      bookingDate: selectedDate,
      startTime: data.startTime,
      endTime: data.endTime,
      duration,
      totalCost,
      specialRequests: data.specialRequests,
    });
  };

  // Date navigation
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  if (!facilitySpaces || facilitySpaces.length === 0) {
    return null;
  }

  const availableFacilities = facilitySpaces.filter((f) => f.isAvailable !== false);

  if (availableFacilities.length === 0) {
    return null;
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-night-800">
      <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-400" />
        Book Facilities & Amenities
      </h3>

      {/* Facility Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {availableFacilities.map((facility) => (
          <div
            key={facility.name}
            onClick={() => {
              setSelectedFacility(facility);
              setShowBookingForm(false);
              setBookingSuccess(false);
            }}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedFacility?.name === facility.name
                ? "border-brand-400 bg-brand-400/10"
                : "border-white/10 bg-night-900 hover:border-white/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="text-brand-400">
                {facilityIcons[facility.type.toLowerCase()] || facilityIcons.other}
              </div>
              <h4 className="font-semibold text-white">{facility.name}</h4>
            </div>
            {facility.description && (
              <p className="text-sm text-gray-400 mb-2">{facility.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              {facility.capacity && (
                <Badge variant="outline" className="text-gray-300 border-white/10">
                  <Users className="w-3 h-3 mr-1" />
                  Up to {facility.capacity}
                </Badge>
              )}
              {facility.pricePerHour && (
                <Badge variant="outline" className="text-green-400 border-green-500/30">
                  £{facility.pricePerHour}/hr
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Facility Details & Booking */}
      {selectedFacility && (
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">
              {selectedFacility.name}
            </h4>
            <Badge className="bg-brand-400/20 text-brand-400">
              £{selectedFacility.pricePerHour || 0}/hour
            </Badge>
          </div>

          {/* Amenities */}
          {selectedFacility.amenities && selectedFacility.amenities.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Included amenities:</p>
              <div className="flex flex-wrap gap-2">
                {selectedFacility.amenities.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant="outline"
                    className="text-gray-300 border-white/10"
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Booking Rules */}
          {selectedFacility.bookingRules && selectedFacility.bookingRules.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-sm font-medium text-yellow-400 mb-1">Booking Rules:</p>
              <ul className="text-sm text-yellow-300/80 list-disc list-inside">
                {selectedFacility.bookingRules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Date Selection */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => changeDate(-1)}
                disabled={selectedDate <= new Date().toISOString().split("T")[0]}
                className="bg-night-900 border-white/10 text-white hover:bg-night-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Select booking date"
                title="Select booking date"
                className="flex-1 p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => changeDate(1)}
                className="bg-night-900 border-white/10 text-white hover:bg-night-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Time Slots Availability */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Available Time Slots
            </label>
            {loadingAvailability ? (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-400"></div>
                Loading availability...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((time) => {
                  const isBooked = availability?.bookedSlots?.some(
                    (slot) => time >= slot.startTime && time < slot.endTime
                  );
                  return (
                    <Badge
                      key={time}
                      variant="outline"
                      className={
                        isBooked
                          ? "bg-red-900/20 text-red-400 border-red-500/30 line-through"
                          : "bg-green-900/20 text-green-400 border-green-500/30"
                      }
                    >
                      {time}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Login prompt or Book button */}
          {!isLoggedIn ? (
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-center">
              <p className="text-yellow-400">Please sign in to book this facility</p>
            </div>
          ) : !showBookingForm ? (
            <Button
              onClick={() => setShowBookingForm(true)}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white"
            >
              Book {selectedFacility.name}
            </Button>
          ) : bookingSuccess ? (
            <div className="p-6 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-green-400">
                Booking Confirmed!
              </h4>
              <p className="text-gray-400">
                You'll receive a confirmation email shortly.
              </p>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    {...register("firstName", { required: "First name is required" })}
                    className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    {...register("lastName", { required: "Last name is required" })}
                    className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>

                {/* Guest Count */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedFacility.capacity || 10}
                    {...register("guestCount", {
                      required: "Guest count is required",
                      min: { value: 1, message: "At least 1 guest" },
                      max: {
                        value: selectedFacility.capacity || 10,
                        message: `Maximum ${selectedFacility.capacity || 10} guests`,
                      },
                    })}
                    className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  {errors.guestCount && (
                    <p className="text-red-400 text-sm mt-1">{errors.guestCount.message}</p>
                  )}
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Start Time *
                    </label>
                    <select
                      {...register("startTime", { required: "Start time is required" })}
                      className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      {timeSlots.slice(0, -1).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      End Time *
                    </label>
                    <select
                      {...register("endTime", { required: "End time is required" })}
                      className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      {timeSlots.slice(1).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Special Requests
                </label>
                <textarea
                  {...register("specialRequests")}
                  rows={3}
                  className="w-full p-2 rounded-lg bg-night-900 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Any special requirements or requests..."
                />
              </div>

              {/* Cost Summary */}
              <div className="p-4 bg-night-900 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white font-medium">
                    {duration > 0 ? `${duration} hour${duration > 1 ? "s" : ""}` : "Invalid time range"}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Rate:</span>
                  <span className="text-white font-medium">
                    £{selectedFacility.pricePerHour || 0}/hour
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-xl font-bold text-brand-400">
                      £{totalCost}
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability Warning */}
              {!currentSlotAvailable && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">
                    This time slot is already booked. Please choose a different time.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 bg-night-900 border-white/10 text-white hover:bg-night-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    bookFacilityMutation.isLoading ||
                    duration <= 0 ||
                    !currentSlotAvailable
                  }
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
                >
                  {bookFacilityMutation.isLoading ? "Booking..." : `Book for £${totalCost}`}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default FacilityBooking;
