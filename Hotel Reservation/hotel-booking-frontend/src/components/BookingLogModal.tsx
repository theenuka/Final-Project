import React, { useState } from "react";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import { BookingType } from "../../../shared/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
// import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Building2,
  Star,
  CreditCard,
  FileText,
  // X,
  Filter,
} from "lucide-react";

interface BookingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
}

const BookingLogModal: React.FC<BookingLogModalProps> = ({
  isOpen,
  onClose,
  hotelId,
  hotelName,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: bookings, isLoading } = useQueryWithLoading(
    "fetchHotelBookings",
    () => apiClient.fetchHotelBookings(hotelId),
    {
      enabled: isOpen && !!hotelId,
      loadingMessage: "Loading booking data...",
    }
  );

  const getStatusColor = (status: string | undefined) => {
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
        return "bg-purple-900/30 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-700/30 text-gray-400 border-gray-500/30";
    }
  };

  const getPaymentStatusColor = (paymentStatus: string | undefined) => {
    switch (paymentStatus) {
      case "paid":
        return "bg-green-900/30 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-900/30 text-red-400 border-red-500/30";
      case "refunded":
        return "bg-purple-900/30 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-700/30 text-gray-400 border-gray-500/30";
    }
  };

  const getDateCategory = (checkIn: Date) => {
    const today = new Date();
    const checkInDate = new Date(checkIn);
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "past";
    } else if (diffDays <= 7) {
      return "upcoming";
    } else {
      return "future";
    }
  };

  const filteredBookings = bookings?.filter((booking: BookingType) => {
    const statusMatch =
      statusFilter === "all" || booking.status === statusFilter;
    const dateMatch =
      dateFilter === "all" || getDateCategory(booking.checkIn) === dateFilter;
    return statusMatch && dateMatch;
  });

  const groupedBookings = filteredBookings?.reduce(
    (groups: any, booking: BookingType) => {
      const category = getDateCategory(booking.checkIn);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(booking);
      return groups;
    },
    {}
  );

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "upcoming":
        return "Upcoming Bookings (Next 7 Days)";
      case "future":
        return "Future Bookings";
      case "past":
        return "Past Bookings";
      default:
        return "All Bookings";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "upcoming":
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case "future":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "past":
        return <Calendar className="w-4 h-4 text-gray-500" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] min-h-[600px] overflow-y-auto bg-night-800 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-brand-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Booking Log - {hotelName}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Manage and track all bookings for this hotel
                </p>
              </div>
            </div>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-night-800 border-white/10">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by booking status"
            title="Filter by booking status"
            className="px-3 py-1 text-sm text-white border rounded-md bg-night-900 border-white/20 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date range"
            title="Filter by date range"
            className="px-3 py-1 text-sm text-white border rounded-md bg-night-900 border-white/20 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming (Next 7 Days)</option>
            <option value="future">Future</option>
            <option value="past">Past</option>
          </select>
        </div>

        {/* Booking Statistics */}
        {bookings && bookings.length > 0 && (
          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
            <Card className="bg-night-900 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Total Bookings
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {bookings.length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-900/30">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-night-900 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Confirmed
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {
                        bookings.filter(
                          (b: BookingType) => b.status === "confirmed"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-900/30">
                    <Star className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-night-900 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-brand-400">
                      £
                      {bookings
                        .filter((b: BookingType) => b.paymentStatus === "paid")
                        .reduce(
                          (sum: number, b: BookingType) =>
                            sum + (b.totalCost || 0),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-900/30">
                    <CreditCard className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-night-900 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {
                        bookings.filter(
                          (b: BookingType) => b.status === "pending"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-900/30">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings List Container */}
        <div className="flex flex-col flex-1">
          {/* Bookings List */}
          <div className="space-y-6 flex-1 min-h-[400px]">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 mx-auto border-b-2 rounded-full animate-spin border-brand-400"></div>
                <p className="mt-2 text-gray-400">Loading bookings...</p>
              </div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Building2 className="w-16 h-16 mb-4 text-gray-500" />
                <h3 className="mb-2 text-xl font-semibold text-gray-300">
                  No Bookings Found
                </h3>
                <p className="mb-4 text-gray-500">
                  This hotel doesn't have any bookings yet.
                </p>
                <div className="max-w-md p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                  <p className="text-sm text-blue-300">
                    When guests make bookings for this hotel, they will appear
                    here with all their details, special requests, and payment
                    information.
                  </p>
                </div>
              </div>
            ) : !filteredBookings || filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Filter className="w-16 h-16 mb-4 text-gray-500" />
                <h3 className="mb-2 text-xl font-semibold text-gray-300">
                  No Matching Bookings
                </h3>
                <p className="mb-4 text-gray-500">
                  No bookings match your current filter criteria.
                </p>
                <div className="max-w-md p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
                  <p className="text-sm text-yellow-300">
                    Try adjusting your filters:
                    {statusFilter !== "all" && (
                      <span className="block mt-1">
                        • Status: Currently filtering for "{statusFilter}"
                        bookings
                      </span>
                    )}
                    {dateFilter !== "all" && (
                      <span className="block mt-1">
                        • Date: Currently filtering for "{dateFilter}" bookings
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              Object.entries(groupedBookings || {}).map(
                ([category, categoryBookings]: [string, any]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <h3 className="text-lg font-semibold text-white">
                        {getCategoryTitle(category)}
                      </h3>
                      <Badge variant="outline" className="ml-2 border-white/20 text-gray-300">
                        {categoryBookings.length} booking
                        {categoryBookings.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {categoryBookings.map((booking: BookingType) => (
                        <Card
                          key={booking._id}
                          className="transition-shadow hover:shadow-md bg-night-900 border-white/10"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-brand-500/20">
                                  <Users className="w-5 h-5 text-brand-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">
                                    {booking.firstName} {booking.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-400">
                                    Booking #
                                    {booking._id.slice(-8).toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={getStatusColor(booking.status)}
                                >
                                  {booking.status}
                                </Badge>
                                <Badge
                                  className={getPaymentStatusColor(
                                    booking.paymentStatus
                                  )}
                                >
                                  {booking.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {/* Guest Information */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-300">
                                    {booking.email}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-300">
                                    {booking.phone}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-300">
                                    {booking.adultCount} adults,{" "}
                                    {booking.childCount} children
                                  </span>
                                </div>
                              </div>

                              {/* Stay Information */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-300">
                                    Check-in:{" "}
                                    {new Date(
                                      booking.checkIn
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-300">
                                    Check-out:{" "}
                                    {new Date(
                                      booking.checkOut
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-300">
                                    Booked:{" "}
                                    {booking.createdAt
                                      ? new Date(
                                          booking.createdAt
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>

                              {/* Financial Information */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                  <CreditCard className="w-4 h-4 text-gray-500" />
                                  <span className="text-brand-400 font-medium">
                                    Total: £
                                    {booking.totalCost?.toLocaleString()}
                                  </span>
                                </div>
                                {booking.refundAmount !== undefined &&
                                  booking.refundAmount > 0 && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <CreditCard className="w-4 h-4 text-red-500" />
                                      <span className="text-red-400">
                                        Refunded: £
                                        {booking.refundAmount.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Special Requests */}
                            {booking.specialRequests && (
                              <div className="p-3 mt-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                                <div className="flex items-start space-x-2">
                                  <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="mb-1 text-sm font-medium text-blue-300">
                                      Special Requests:
                                    </p>
                                    <p className="text-sm text-blue-200">
                                      {booking.specialRequests}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingLogModal;
