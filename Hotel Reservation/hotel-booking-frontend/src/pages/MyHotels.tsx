import { Link } from "react-router-dom";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import { BsBuilding, BsMap } from "react-icons/bs";
import { BiHotel, BiMoney } from "react-icons/bi";
import {
  Plus,
  Edit,
  Eye,
  TrendingUp,
  Users,
  Star,
  Building2,
  Calendar,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import BookingLogModal from "../components/BookingLogModal";
import { useState } from "react";

const MyHotels = () => {
  const [selectedHotel, setSelectedHotel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isBookingLogOpen, setIsBookingLogOpen] = useState(false);

  const { data: hotelData } = useQueryWithLoading(
    "fetchMyHotels",
    apiClient.fetchMyHotels,
    {
      onError: () => {},
      loadingMessage: "Loading your hotels...",
    }
  );

  const handleOpenBookingLog = (hotelId: string, hotelName: string) => {
    setSelectedHotel({ id: hotelId, name: hotelName });
    setIsBookingLogOpen(true);
  };

  const handleCloseBookingLog = () => {
    setIsBookingLogOpen(false);
    setSelectedHotel(null);
  };

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-night-900 flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto text-center border border-white/10">
          <BsBuilding className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Hotels Found
          </h3>
          <p className="text-gray-400 mb-6">
            You haven't added any hotels yet.
          </p>
          <Link
            to="/add-hotel"
            className="inline-flex items-center bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Hotel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-900/20 to-night-900 pointer-events-none" />
      <div className="absolute -top-40 right-0 w-[32rem] h-[32rem] bg-brand-500/10 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">My Hotels</h1>
            <p className="text-gray-400 mt-1">
              Manage your hotel listings and bookings
            </p>
          </div>
          <Link
            to="/add-hotel"
            className="inline-flex items-center bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transform hover:scale-105 transition-all duration-200 shadow-glow"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Hotel
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Hotels</p>
                <p className="text-2xl font-bold text-white">
                  {hotelData.length}
                </p>
              </div>
              <div className="bg-brand-500/20 p-3 rounded-xl">
                <Building2 className="w-6 h-6 text-brand-400" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-white">
                  {hotelData.reduce(
                    (sum, hotel) => sum + (hotel.totalBookings || 0),
                    0
                  )}
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  £
                  {hotelData
                    .reduce((sum, hotel) => sum + (hotel.totalRevenue || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Avg Rating</p>
                <p className="text-2xl font-bold text-white">
                  {hotelData.length > 0
                    ? (
                        hotelData.reduce(
                          (sum, hotel) => sum + (hotel.averageRating || 0),
                          0
                        ) / hotelData.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-xl">
                <Star className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {hotelData.map((hotel) => (
            <div
              key={hotel._id}
              data-testid="hotel-card"
              className="glass-panel rounded-2xl border border-white/10 overflow-hidden group flex flex-col h-full hover:border-brand-500/30 transition-colors"
            >
              {/* Hotel Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={hotel.imageUrls[0]}
                  alt={hotel.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night-900 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col space-y-2">
                  <Badge className="bg-brand-600 text-white border-none">
                    £{hotel.roomTypes?.[0]?.pricePerNight || 0}/night
                  </Badge>
                  {hotel.isFeatured && (
                    <Badge className="bg-yellow-500 text-white border-none">Featured</Badge>
                  )}
                </div>

                <div className="absolute top-4 right-4">
                  <Badge className="bg-night-900/80 backdrop-blur-md text-white border border-white/10">
                    <Star className="w-3 h-3 mr-1 text-yellow-500" />
                    {hotel.starRating}
                  </Badge>
                </div>
              </div>

              {/* Hotel Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">
                  {hotel.name}
                </h2>

                <p className="text-gray-400 mb-4 line-clamp-2">
                  {hotel.description}
                </p>

                {/* Hotel Details */}
                <div className="grid grid-cols-2 gap-4 mb-6 flex-grow">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <BsMap className="w-4 h-4 text-brand-400" />
                    <span>
                      {hotel.city}, {hotel.country}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <BsBuilding className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1 min-h-[24px]">
                      {Array.isArray(hotel.type) ? (
                        hotel.type.map((type, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 bg-brand-500/10 text-brand-300 border-brand-500/20"
                          >
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-1 bg-brand-500/10 text-brand-300 border-brand-500/20"
                        >
                          {hotel.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <BiMoney className="w-4 h-4 text-brand-400" />
                    <span>£{hotel.roomTypes?.[0]?.pricePerNight || 0} per night</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <BiHotel className="w-4 h-4 text-brand-400" />
                    <span>
                      {hotel.roomTypes?.[0]?.adultCount || 0} adults, {hotel.roomTypes?.[0]?.childCount || 0} children
                    </span>
                  </div>
                </div>

                {/* Hotel Stats */}
                <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-xl mt-auto border border-white/5">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {hotel.totalBookings || 0}
                    </p>
                    <p className="text-xs text-gray-400">Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      £{(hotel.totalRevenue || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {hotel.averageRating?.toFixed(1) || "0.0"}
                    </p>
                    <p className="text-xs text-gray-400">Rating</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Link
                    to={`/edit-hotel/${hotel._id}`}
                    className="flex-1 bg-brand-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-brand-700 transition-colors text-center flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                  <Link
                    to={`/detail/${hotel._id}`}
                    className="flex-1 bg-white/10 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/20 transition-colors text-center flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                  <button
                    onClick={() => handleOpenBookingLog(hotel._id, hotel.name)}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors text-center flex items-center justify-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Log
                  </button>
                  <Link
                    to={`/my-hotels/${hotel._id}/rooms`}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-center flex items-center justify-center"
                  >
                    <BiHotel className="w-4 h-4 mr-2" />
                    Manage Rooms
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Log Modal */}
        {selectedHotel && (
          <BookingLogModal
            isOpen={isBookingLogOpen}
            onClose={handleCloseBookingLog}
            hotelId={selectedHotel.id}
            hotelName={selectedHotel.name}
          />
        )}
      </div>
    </div>
  );
};

export default MyHotels;
