import { useParams } from "react-router-dom";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "./../api-client";
import { AiFillStar } from "react-icons/ai";
import GuestInfoForm from "../forms/GuestInfoForm/GuestInfoForm";
import FacilityBooking from "../components/FacilityBooking";
import { Badge } from "../components/ui/badge";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Car,
  Wifi,
  Waves,
  Dumbbell,
  Sparkles,
  Plane,
  Building2,
  Utensils,
  Coffee,
  Monitor,
  ShieldCheck,
  Info
} from "lucide-react";

const Detail = () => {
  const { hotelId } = useParams();

  const { data: hotel } = useQueryWithLoading(
    "fetchHotelById",
    () => apiClient.fetchHotelById(hotelId || ""),
    {
      enabled: !!hotelId,
      loadingMessage: "Loading hotel details...",
    }
  );

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-night-900">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Hotel Not Found</h2>
          <p className="text-gray-400">The hotel you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const getFacilityIcon = (facility: string) => {
    switch (facility) {
      case "Free WiFi": return <Wifi className="w-4 h-4" />;
      case "Parking": return <Car className="w-4 h-4" />;
      case "Airport Shuttle": return <Plane className="w-4 h-4" />;
      case "Outdoor Pool": return <Waves className="w-4 h-4" />;
      case "Spa": return <Sparkles className="w-4 h-4" />;
      case "Fitness Center": return <Dumbbell className="w-4 h-4" />;
      case "Restaurant": return <Utensils className="w-4 h-4" />;
      case "Bar": return <Coffee className="w-4 h-4" />;
      case "Business Center": return <Monitor className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-night-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-900/20 to-night-900 pointer-events-none" />
      <div className="absolute -top-40 right-0 w-[32rem] h-[32rem] bg-brand-500/10 blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <AiFillStar key={i} className="w-4 h-4 text-yellow-500" />
              ))}
              <span className="ml-1 text-xs font-medium text-yellow-500">{hotel.starRating} Star Hotel</span>
            </div>
            {hotel.type?.map((type, index) => (
              <Badge key={index} variant="outline" className="bg-brand-500/10 text-brand-400 border-brand-500/20">
                {type}
              </Badge>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">{hotel.name}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4 text-brand-400" />
                <span>{hotel.city}, {hotel.country}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {(hotel?.totalBookings ?? 0) > 0 && (
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-2xl font-bold text-white">{hotel?.totalBookings}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Bookings</p>
                </div>
              )}
              {(hotel?.averageRating ?? 0) > 0 && (
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-2xl font-bold text-brand-400">{(hotel?.averageRating ?? 0).toFixed(1)}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Rating</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[500px]">
          {hotel.imageUrls.slice(0, 5).map((image, i) => (
            <div 
              key={i} 
              className={`relative rounded-2xl overflow-hidden group ${
                i === 0 ? "md:col-span-2 md:row-span-2" : "col-span-1 row-span-1"
              }`}
            >
              <img
                src={image}
                alt={`${hotel.name} view ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Description */}
            <div className="glass-panel rounded-2xl p-8 space-y-4">
              <h2 className="text-2xl font-bold text-white">About this stay</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {hotel.description}
              </p>
            </div>

            {/* Facilities */}
            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white">Amenities & Facilities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.facilities.map((facility) => (
                  <div key={facility} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                      {getFacilityIcon(facility)}
                    </div>
                    <span className="text-gray-300 text-sm font-medium">{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Facility Booking */}
            {hotel.facilitySpaces && hotel.facilitySpaces.length > 0 && (
              <FacilityBooking hotelId={hotel._id} facilitySpaces={hotel.facilitySpaces} />
            )}

            {/* Policies */}
            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-brand-400" />
                Hotel Policies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">Check-in</span>
                    </div>
                    <span className="text-white font-medium">{hotel.policies?.checkInTime || "14:00"}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">Check-out</span>
                    </div>
                    <span className="text-white font-medium">{hotel.policies?.checkOutTime || "11:00"}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {hotel.policies?.cancellationPolicy && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <span className="text-sm text-gray-400 uppercase tracking-wider">Cancellation</span>
                      <p className="text-white">{hotel.policies.cancellationPolicy}</p>
                    </div>
                  )}
                  {hotel.policies?.petPolicy && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <span className="text-sm text-gray-400 uppercase tracking-wider">Pets</span>
                      <p className="text-white">{hotel.policies.petPolicy}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="glass-panel rounded-2xl p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Info className="w-6 h-6 text-brand-400" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotel.contact?.phone && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{hotel.contact.phone}</span>
                  </div>
                )}
                {hotel.contact?.email && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <span>{hotel.contact.email}</span>
                  </div>
                )}
                {hotel.contact?.website && (
                  <div className="flex items-center gap-3 text-gray-300 md:col-span-2">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a
                      href={hotel.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:text-brand-300 hover:underline transition-colors"
                    >
                      Visit Official Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:sticky lg:top-8 h-fit space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-brand-500/20 shadow-glow">
              <div className="flex items-end justify-between mb-6 pb-6 border-b border-white/10">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Price starts from</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">£{hotel.roomTypes?.[0]?.pricePerNight || 0}</span>
                    <span className="text-gray-400">/ night</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                    <Utensils className="w-3 h-3" />
                    <span>Breakfast included</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Free cancellation</span>
                  </div>
                </div>
              </div>
              
              <GuestInfoForm
                pricePerNight={hotel.roomTypes?.[0]?.pricePerNight || 0}
                hotelId={hotel._id}
              />
            </div>

            <div className="p-6 rounded-2xl bg-brand-900/20 border border-brand-500/20">
              <h3 className="font-semibold text-white mb-2">Why book with us?</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  Best price guarantee
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  No hidden booking fees
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  Instant confirmation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
