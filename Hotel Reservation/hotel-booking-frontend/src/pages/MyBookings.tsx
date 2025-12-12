import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import type { BookingType, HotelWithBookingsType } from "../../../shared/types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import useAppContext from "../hooks/useAppContext";
import {
  Calendar,
  Users,
  CreditCard,
  Clock,
  MapPin,
  Phone,
  Star,
  Building,
  TrendingUp,
  Package,
  DollarSign,
  XCircle,
  Loader2,
  AlertTriangle,
  BedDouble,
} from "lucide-react";

const MyBookings = () => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    bookingId: string;
    hotelId: string;
    hotelName: string;
  } | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const { data: hotels } = useQueryWithLoading<HotelWithBookingsType[]>(
    "fetchMyBookings",
    apiClient.fetchMyBookings,
    {
      loadingMessage: "Loading your bookings...",
    }
  );

  const cancelBookingMutation = useMutation(
    ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      apiClient.cancelBooking(bookingId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("fetchMyBookings");
        showToast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully. Refund will be processed within 5-7 business days.",
          type: "SUCCESS",
        });
        setCancelDialogOpen(false);
        setSelectedBooking(null);
        setCancellationReason("");
      },
      onError: () => {
        showToast({
          title: "Cancellation Failed",
          description: "Failed to cancel booking. Please try again or contact support.",
          type: "ERROR",
        });
      },
    }
  );

  const handleCancelClick = (bookingId: string, hotelId: string, hotelName: string) => {
    setSelectedBooking({ bookingId, hotelId, hotelName });
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      cancelBookingMutation.mutate({
        bookingId: selectedBooking.bookingId,
        reason: cancellationReason,
      });
    }
  };

  const canCancelBooking = (booking: BookingType) => {
    // Can cancel if status is confirmed or pending
    const cancelableStatuses = ["confirmed", "pending"];
    if (!cancelableStatuses.includes(booking.status || "pending")) {
      return false;
    }
    
    // Can cancel if check-in date is in the future
    const checkInDate = new Date(booking.checkIn);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return checkInDate > today;
  };

  if (!hotels || hotels.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-400">You haven't made any bookings yet.</p>
        </div>
      </div>
    );
  }

  // Calculate booking statistics
  const totalBookings = hotels.reduce(
    (total, hotel) => total + hotel.bookings.length,
    0
  );

  const uniqueHotelIds = new Set(hotels.map((hotel) => hotel._id));
  const differentHotels = uniqueHotelIds.size;

      const totalSpent = hotels.reduce((total, hotel) => {
      return (
        total +
        hotel.bookings.reduce((hotelTotal, booking) => {
          const checkInDate = new Date(booking.checkIn);
          const checkOutDate = new Date(booking.checkOut);
          const nights = Math.max(
            1,
            Math.ceil(
              (checkOutDate.getTime() - checkInDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          return hotelTotal + (hotel.roomTypes?.[0]?.pricePerNight || 0) * nights;
        }, 0)
      );
    }, 0);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-900/30 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-900/30 text-red-400 border-red-500/30";
      case "completed":
        return "bg-blue-900/30 text-blue-400 border-blue-500/30";
      case "refunded":
        return "bg-gray-700/30 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-700/30 text-gray-400 border-gray-500/30";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-900/30 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-900/30 text-red-400 border-red-500/30";
      case "refunded":
        return "bg-gray-700/30 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-700/30 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <TrendingUp className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <Star className="w-4 h-4" />;
      case "refunded":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">My Bookings History</h1>
          <p className="text-blue-100 text-lg">
            Track all your hotel reservations and booking details
          </p>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-blue-100">
                {totalBookings} Total Bookings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-blue-100">
                {differentHotels} Different Hotels
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-blue-100">
                £{totalSpent.toFixed(2)} Total Spent
              </span>
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 gap-8">
          {hotels.map((hotel, hotelIndex) => (
            <div
              key={`${hotel._id}-${hotelIndex}`}
              className="bg-night-800 rounded-xl shadow-lg border border-white/10 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Hotel Header */}
              <div className="bg-night-900 p-6 border-b border-white/10">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img
                      src={hotel.imageUrls[0]}
                      className="w-24 h-24 rounded-lg object-cover object-center shadow-md"
                      alt={hotel.name}
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      {hotel.starRating}★
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {hotel.name}
                    </h2>
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {hotel.city}, {hotel.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        <span>£{hotel.roomTypes?.[0]?.pricePerNight || 0}/night</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="p-6">
                <div className="space-y-6">
                  {hotel.bookings.map((booking: BookingType) => {
                    const checkInDate = new Date(booking.checkIn);
                    const checkOutDate = new Date(booking.checkOut);
                    const createdAt = new Date(
                      booking.createdAt || booking.checkIn
                    );
                    const nights = Math.max(
                      1,
                      Math.ceil(
                        (checkOutDate.getTime() - checkInDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    const totalPrice = (hotel.roomTypes?.[0]?.pricePerNight || 0) * nights;
                    const canCancel = canCancelBooking(booking);

                    return (
                      <div
                        key={booking._id}
                        className="bg-night-900 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200"
                      >
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${getStatusColor(
                                booking.status || "pending"
                              )}`}
                            >
                              {getStatusIcon(booking.status || "pending")}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">
                                Booking #{booking._id.slice(-8).toUpperCase()}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Booked on {createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getStatusColor(
                                booking.status || "pending"
                              )} border`}
                            >
                              {getStatusIcon(booking.status || "pending")}
                              <span className="ml-1">
                                {booking.status || "pending"}
                              </span>
                            </Badge>
                            <Badge
                              className={`${getPaymentStatusColor(
                                booking.paymentStatus || "pending"
                              )} border`}
                            >
                              {booking.paymentStatus || "pending"}
                            </Badge>
                            {canCancel && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleCancelClick(booking._id, hotel._id, hotel.name)
                                }
                                className="ml-2"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Dates */}
                          <div className="bg-night-800 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-brand-400" />
                              <span className="font-semibold text-white">
                                Stay Dates
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              <div className="mb-1">
                                <span className="font-medium text-gray-300">Check-in:</span>{" "}
                                {checkInDate.toDateString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-300">Check-out:</span>{" "}
                                {checkOutDate.toDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Guests */}
                          <div className="bg-night-800 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-green-400" />
                              <span className="font-semibold text-white">
                                Guests
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              <div className="mb-1">
                                <span className="font-medium text-gray-300">
                                  {booking.adultCount}
                                </span>{" "}
                                Adults
                              </div>
                              <div>
                                <span className="font-medium text-gray-300">
                                  {booking.childCount}
                                </span>{" "}
                                Children
                              </div>
                              {booking.roomCount && booking.roomCount > 1 && (
                                <div className="mt-2 flex items-center gap-1 text-brand-400">
                                  <BedDouble className="w-3 h-3" />
                                  <span className="font-medium">
                                    {booking.roomCount} Rooms
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contact */}
                          <div className="bg-night-800 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4 text-purple-400" />
                              <span className="font-semibold text-white">
                                Contact
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              <div className="mb-1 truncate">{booking.email}</div>
                              {booking.phone && <div>{booking.phone}</div>}
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="bg-night-800 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-4 h-4 text-orange-400" />
                              <span className="font-semibold text-white">
                                Pricing
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">
                              <div className="mb-1">
                                <span className="font-medium text-gray-300">{nights}</span>{" "}
                                Nights
                              </div>
                              <div className="text-lg font-bold text-brand-400">
                                £{totalPrice}
                              </div>
                              {booking.refundAmount !== undefined &&
                                booking.refundAmount !== null &&
                                booking.refundAmount > 0 && (
                                  <div className="text-sm text-red-400">
                                    Refund: £{booking.refundAmount}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Special Requests & Cancellation */}
                        {(booking.specialRequests ||
                          booking.cancellationReason) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {booking.specialRequests && (
                              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  Special Requests
                                </h4>
                                <p className="text-blue-300 text-sm">
                                  {booking.specialRequests}
                                </p>
                              </div>
                            )}
                            {booking.cancellationReason && (
                              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                                  <XCircle className="w-4 h-4" />
                                  Cancellation Reason
                                </h4>
                                <p className="text-red-300 text-sm">
                                  {booking.cancellationReason}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-night-800 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel your booking at{" "}
              <span className="text-white font-medium">
                {selectedBooking?.hotelName}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                <strong>Cancellation Policy:</strong> Refunds are processed
                within 5-7 business days. Depending on when you cancel,
                cancellation fees may apply.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Reason for cancellation (optional)
              </Label>
              <Textarea
                placeholder="Let us know why you're cancelling..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="bg-night-900 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setSelectedBooking(null);
                setCancellationReason("");
              }}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelBookingMutation.isLoading}
            >
              {cancelBookingMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Cancellation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
