import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "react-query";
import * as apiClient from "../api-client";
import { FacilityBooking } from "../api-client";
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
  Clock,
  Sparkles,
  Dumbbell,
  Waves,
  UtensilsCrossed,
  Coffee,
  XCircle,
  Loader2,
  AlertTriangle,
  Package,
  DollarSign,
  Building,
} from "lucide-react";

const facilityIcons: Record<string, React.ReactNode> = {
  spa: <Sparkles className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  conference: <Users className="w-5 h-5" />,
  pool: <Waves className="w-5 h-5" />,
  restaurant: <UtensilsCrossed className="w-5 h-5" />,
  other: <Coffee className="w-5 h-5" />,
};

const MyFacilityBookings = () => {
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<FacilityBooking | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const { data: bookings, isLoading } = useQuery(
    "myFacilityBookings",
    apiClient.getMyFacilityBookings
  );

  const cancelBookingMutation = useMutation(
    ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      apiClient.cancelFacilityBooking(bookingId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("myFacilityBookings");
        showToast({
          title: "Booking Cancelled",
          description: "Your facility booking has been cancelled successfully.",
          type: "SUCCESS",
        });
        setCancelDialogOpen(false);
        setSelectedBooking(null);
        setCancellationReason("");
      },
      onError: () => {
        showToast({
          title: "Cancellation Failed",
          description: "Failed to cancel booking. Please try again.",
          type: "ERROR",
        });
      },
    }
  );

  const handleCancelClick = (booking: FacilityBooking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      cancelBookingMutation.mutate({
        bookingId: selectedBooking._id,
        reason: cancellationReason,
      });
    }
  };

  const canCancelBooking = (booking: FacilityBooking) => {
    const cancelableStatuses = ["confirmed", "pending"];
    if (!cancelableStatuses.includes(booking.status)) {
      return false;
    }
    const bookingDate = new Date(booking.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  };

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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your facility bookings...</p>
        </div>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Facility Bookings Found
          </h3>
          <p className="text-gray-400">
            You haven't booked any spa, gym, or conference room sessions yet.
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalBookings = bookings.length;
  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const facilityTypes = [...new Set(bookings.map((b) => b.facilityType))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">My Facility Bookings</h1>
          <p className="text-purple-100 text-lg">
            Track your spa, gym, conference room, and other facility reservations
          </p>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-purple-100">
                {totalBookings} Total Bookings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              <span className="text-purple-100">
                {facilityTypes.length} Facility Types
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-purple-100">
                £{totalSpent.toFixed(2)} Total Spent
              </span>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => {
            const bookingDate = new Date(booking.bookingDate);
            const createdAt = new Date(booking.createdAt);
            const canCancel = canCancelBooking(booking);
            const icon = facilityIcons[booking.facilityType] || facilityIcons.other;

            return (
              <div
                key={booking._id}
                className="bg-night-800 rounded-xl shadow-lg border border-white/10 overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Header */}
                <div className="bg-night-900 p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-brand-400/20 text-brand-400">
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {booking.facilityName}
                        </h3>
                        <p className="text-sm text-gray-400 capitalize">
                          {booking.facilityType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(booking.status)} border`}>
                        {booking.status}
                      </Badge>
                      <Badge
                        className={`${getPaymentStatusColor(booking.paymentStatus)} border`}
                      >
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-4">
                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-night-900 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-brand-400" />
                        <span className="text-sm text-gray-400">Date</span>
                      </div>
                      <p className="text-white font-medium">
                        {bookingDate.toDateString()}
                      </p>
                    </div>
                    <div className="bg-night-900 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Time</span>
                      </div>
                      <p className="text-white font-medium">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>

                  {/* Guests & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-night-900 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-400">Guests</span>
                      </div>
                      <p className="text-white font-medium">
                        {booking.guestCount} {booking.guestCount > 1 ? "people" : "person"}
                      </p>
                    </div>
                    <div className="bg-night-900 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-gray-400">Total</span>
                      </div>
                      <p className="text-brand-400 font-bold text-lg">
                        £{booking.totalCost}
                      </p>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-400 font-medium">
                          Special Requests
                        </span>
                      </div>
                      <p className="text-blue-300 text-sm">
                        {booking.specialRequests}
                      </p>
                    </div>
                  )}

                  {/* Booked Info */}
                  <p className="text-xs text-gray-500">
                    Booked on {createdAt.toLocaleDateString()} at{" "}
                    {createdAt.toLocaleTimeString()}
                  </p>

                  {/* Actions */}
                  {canCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelClick(booking)}
                      className="w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-night-800 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Cancel Facility Booking
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel your{" "}
              <span className="text-white font-medium">
                {selectedBooking?.facilityName}
              </span>{" "}
              booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                <strong>Cancellation Policy:</strong> Refunds are processed
                within 5-7 business days depending on the facility's policy.
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

export default MyFacilityBookings;
