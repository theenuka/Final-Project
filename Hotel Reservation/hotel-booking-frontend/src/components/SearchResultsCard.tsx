import { Link } from "react-router-dom";
import { HotelType } from "../../../shared/types";
import { AiFillStar } from "react-icons/ai";
import {
  MapPin,
  Building2,
  Users,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Plane,
  Building,
} from "lucide-react";
import { Badge } from "./ui/badge";

type Props = {
  hotel: HotelType;
};

const SearchResultsCard = ({ hotel }: Props) => {
  const getFacilityIcon = (facility: string) => {
    const iconMap: { [key: string]: any } = {
      "Free WiFi": Wifi,
      "Free Parking": Car,
      "Swimming Pool": Waves,
      "Fitness Center": Dumbbell,
      Spa: Sparkles,
      Restaurant: UtensilsCrossed,
      "Bar/Lounge": Coffee,
      "Airport Shuttle": Plane,
      "Business Center": Building,
    };
    return iconMap[facility] || Building2;
  };

  const fallbackImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23091c32;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%231d3f72;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='26' fill='white' opacity='0.85'%3EImage coming soon%3C/text%3E%3C/svg%3E";
  const heroImage = hotel.imageUrls.find((url) => url && url.trim().length > 0) ?? fallbackImage;

  return (
    <div className="group rounded-2xl border border-white/10 bg-dark/50 overflow-hidden shadow-lg transition-shadow hover:shadow-neon-pink/20 hover:border-white/20">
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.5fr]">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden xl:h-full">
          <img
            src={heroImage}
            alt={`${hotel.name} hero image`}
            loading="lazy"
            className="object-cover object-center w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/10 to-transparent" />

          <div className="absolute flex flex-col gap-2 text-white top-4 left-4">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-black/40 backdrop-blur-md">
              {hotel.isFeatured ? "Spotlight" : "Collection"}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <AiFillStar className="text-yellow-400" />
              <span>{hotel.starRating}.0 rating</span>
            </div>
          </div>

          <div className="absolute text-white bottom-4 left-4">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-300">
              From
            </p>
            <p className="text-3xl font-semibold">
              ${hotel.minPricePerNight || 0}
              <span className="text-sm text-gray-300"> / night</span>
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-6 p-6 text-light-gray sm:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-yellow-400">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <AiFillStar key={i} className="w-4 h-4" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {Array.isArray(hotel.type)
                  ? hotel.type.slice(0, 3).map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="text-medium-gray border-white/20 bg-white/5"
                      >
                        {type}
                      </Badge>
                    ))
                  : (
                      <Badge
                        variant="outline"
                        className="text-medium-gray border-white/20 bg-white/5"
                      >
                        {hotel.type}
                      </Badge>
                    )}
              </div>
            </div>

            <Link
              to={`/detail/${hotel._id}`}
              className="text-3xl font-semibold transition-colors font-display text-white hover:text-neon-pink"
            >
              {hotel.name}
            </Link>

            <div className="flex items-center text-sm text-medium-gray">
              <MapPin className="w-4 h-4 mr-2" />
              {hotel.city}, {hotel.country}
            </div>
            <p className="leading-relaxed text-medium-gray line-clamp-3">
              {hotel.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-medium-gray">
            {hotel.totalBookings && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{hotel.totalBookings} hosted stays</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <AiFillStar className="text-yellow-400" />
              <span>
                {hotel.averageRating && hotel.averageRating > 0
                  ? `${hotel.averageRating.toFixed(1)} guest score`
                  : "Awaiting first review"}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-[0.35em] text-gray-500 mb-3">
              Key amenities
            </h4>
            <div className="flex flex-wrap gap-2">
              {hotel.facilities.slice(0, 6).map((facility) => {
                const IconComponent = getFacilityIcon(facility);
                return (
                  <Badge
                    key={facility}
                    variant="outline"
                    className="flex items-center gap-2 border-white/10 bg-dark/50 text-light-gray px-3 py-1.5"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-neon-teal" />
                    <span>{facility}</span>
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t sm:flex-row sm:items-center sm:justify-between border-white/10">
            <div className="text-sm text-gray-400">
              Instant confirmation • Secure checkout
            </div>
            <Link
              to={`/detail/${hotel._id}`}
              className="inline-flex items-center justify-center px-6 py-3 font-semibold transition-transform bg-neon-pink text-white rounded-xl shadow-lg shadow-neon-pink/20 hover:shadow-xl hover:shadow-neon-pink/40 hover:-translate-y-0.5"
            >
              View details & book
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsCard;
