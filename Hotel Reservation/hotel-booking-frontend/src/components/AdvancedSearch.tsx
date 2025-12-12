import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  Filter,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import useSearchContext from "../hooks/useSearchContext";
import { resolveApiBaseUrl } from "../lib/runtime-config";

interface AdvancedSearchProps {
  onSearch: (searchData: any) => void;
  isExpanded?: boolean;
}

type SearchFormState = {
  destination: string;
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  minPrice: string;
  maxPrice: string;
  starRating: string;
  hotelType: string;
  facilities: string[];
  sortBy: "relevance" | "priceLow" | "priceHigh" | "rating" | "distance";
  radius: "10" | "25" | "50" | "100";
  instantBooking: boolean;
  freeCancellation: boolean;
  breakfast: boolean;
  wifi: boolean;
  parking: boolean;
  pool: boolean;
  gym: boolean;
  spa: boolean;
};

const formatDateInput = (value: Date): string => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }
  return value.toISOString().split("T")[0];
};

const buildClearedState = (): SearchFormState => ({
  destination: "",
  checkIn: new Date(),
  checkOut: new Date(),
  adultCount: 1,
  childCount: 0,
  minPrice: "",
  maxPrice: "",
  starRating: "",
  hotelType: "",
  facilities: [],
  sortBy: "relevance",
  radius: "50",
  instantBooking: false,
  freeCancellation: false,
  breakfast: false,
  wifi: false,
  parking: false,
  pool: false,
  gym: false,
  spa: false,
});

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  isExpanded = false,
}) => {
  const navigate = useNavigate();
  const search = useSearchContext();
  const inputIds = {
    destination: "advanced-destination",
    checkIn: "advanced-check-in",
    checkOut: "advanced-check-out",
    guests: "advanced-guests",
    minPrice: "advanced-min-price",
    maxPrice: "advanced-max-price",
    starRating: "advanced-star-rating",
    hotelType: "advanced-hotel-type",
    sortBy: "advanced-sort-by",
    radius: "advanced-radius",
  } as const;
  const [showAdvanced, setShowAdvanced] = useState(isExpanded);
  const [searchData, setSearchData] = useState<SearchFormState>({
    ...buildClearedState(),
    destination: search.destination,
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    adultCount: search.adultCount,
    childCount: search.childCount,
  });

  // Dropdown functionality for destination
  const [showDropdown, setShowDropdown] = useState(false);
  const [places, setPlaces] = useState<string[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<string[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const hasFetchedRef = useRef(false);

  // Fetch hotel places on mount
  useEffect(() => {
    // Prevent multiple API calls - use a ref to track if we've already fetched
    if (isLoadingPlaces || hasFetchedRef.current) return;

    const fetchPlaces = async () => {
      try {
        setIsLoadingPlaces(true);
        hasFetchedRef.current = true;

        // Check if we have cached places data
        const cachedPlaces = localStorage.getItem("hotelPlaces");
        if (cachedPlaces) {
          const parsedPlaces = JSON.parse(cachedPlaces);
          const cacheTime = localStorage.getItem("hotelPlacesTime");
          const now = Date.now();

          // Cache is valid for 5 minutes
          if (cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
            setPlaces(parsedPlaces);
            setIsLoadingPlaces(false);
            return;
          }
        }

        const apiBaseUrl = resolveApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/hotels`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: { city?: string; place?: string; name?: string }[] =
          await response.json();
        const uniquePlaces: string[] = Array.from(
          new Set(
            data
              .map((hotel) => hotel.city || hotel.place || hotel.name)
              .filter(
                (place): place is string =>
                  typeof place === "string" && place.length > 0
              )
          )
        );

        // Cache the places data
        localStorage.setItem("hotelPlaces", JSON.stringify(uniquePlaces));
        localStorage.setItem("hotelPlacesTime", Date.now().toString());

        setPlaces(uniquePlaces);
      } catch (error) {
        console.error("Error fetching hotels:", error);
        setPlaces([]);
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    fetchPlaces();
  }, []); // Remove all dependencies to run only once on mount

  // Clear dropdown state when component mounts
  useEffect(() => {
    setShowDropdown(false);
    setFilteredPlaces([]);
  }, []);

  // Filter places as user types
  useEffect(() => {
    if (searchData.destination.length > 0) {
      const filtered = places.filter((place) =>
        place.toLowerCase().includes(searchData.destination.toLowerCase())
      );
      setFilteredPlaces(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [searchData.destination, places]);

  const hotelTypes = [
    "Hotel",
    "Resort",
    "Motel",
    "Hostel",
    "Apartment",
    "Villa",
    "Cottage",
    "B&B",
  ];

  const facilityOptions = [
    { id: "wifi", label: "Free WiFi", icon: "📶" },
    { id: "parking", label: "Free Parking", icon: "🚗" },
    { id: "pool", label: "Swimming Pool", icon: "🏊" },
    { id: "gym", label: "Fitness Center", icon: "💪" },
    { id: "spa", label: "Spa", icon: "🧖" },
    { id: "breakfast", label: "Free Breakfast", icon: "🍳" },
    { id: "instantBooking", label: "Instant Booking", icon: "⚡" },
    { id: "freeCancellation", label: "Free Cancellation", icon: "✅" },
  ];

  const handleInputChange = (field: string, value: any) => {
    setSearchData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFacilityToggle = (facilityId: string) => {
    setSearchData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facilityId)
        ? prev.facilities.filter((f) => f !== facilityId)
        : [...prev.facilities, facilityId],
    }));
  };

  const handleSearch = (quickSearchDestination?: string) => {
    // Determine the destination: use quick search if provided, otherwise use form state.
    const destination = quickSearchDestination !== undefined 
      ? quickSearchDestination 
      : (searchData.destination ? searchData.destination.trim() : "");

    // Update search context
    search.saveSearchValues(
      destination,
      searchData.checkIn,
      searchData.checkOut,
      searchData.adultCount,
      searchData.childCount
    );

    // Close dropdown before navigation
    setShowDropdown(false);
    setFilteredPlaces([]);

    // Navigate to search page with advanced filters
    const searchParams = new URLSearchParams();
    searchParams.append("destination", destination);
    searchParams.append("checkIn", searchData.checkIn.toISOString());
    searchParams.append("checkOut", searchData.checkOut.toISOString());
    searchParams.append("adultCount", searchData.adultCount.toString());
    searchParams.append("childCount", searchData.childCount.toString());

    // Add advanced filters
    if (searchData.minPrice)
      searchParams.append("minPrice", searchData.minPrice);
    if (searchData.maxPrice)
      searchParams.append("maxPrice", searchData.maxPrice);
    if (searchData.starRating)
      searchParams.append("starRating", searchData.starRating);
    if (searchData.hotelType)
      searchParams.append("hotelType", searchData.hotelType);
    if (searchData.sortBy) searchParams.append("sortBy", searchData.sortBy);
    if (searchData.radius) searchParams.append("radius", searchData.radius);
    searchData.facilities.forEach((facility) =>
      searchParams.append("facilities", facility)
    );

    navigate(`/search?${searchParams.toString()}`);
    onSearch(searchData);

    // Don't clear search values immediately - let the search page use them
    // Only clear the local form state after a short delay if it's not a quick search
    if (quickSearchDestination === undefined) {
      setTimeout(() => {
        setSearchData(buildClearedState());
      }, 100);
    }
  };

  const handleQuickSearch = (destination: string) => {
    const trimmedDestination = destination ? destination.trim() : "";
    handleSearch(trimmedDestination);
  };

  // const handleClear = () => {
  //   setSearchData({
  //     destination: "",
  //     checkIn: new Date(),
  //     checkOut: new Date(),
  //     adultCount: 1,
  //     childCount: 0,
  //     minPrice: "",
  //     maxPrice: "",
  //     starRating: "",
  //     hotelType: "",
  //     facilities: [],
  //     sortBy: "relevance",
  //     radius: "50",
  //     instantBooking: false,
  //     freeCancellation: false,
  //     breakfast: false,
  //     wifi: false,
  //     parking: false,
  //     pool: false,
  //     gym: false,
  //     spa: false,
  //   });
  //   search.clearSearchValues();
  // };

  const popularDestinations = [
    "New York",
    "London",
    "Paris",
    "Tokyo",
    "Sydney",
    "Dubai",
    "Singapore",
    "Barcelona",
  ];

  const baseLabel =
    "flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-medium-gray";
  const baseField =
    "w-full h-12 rounded-lg border border-white/10 bg-dark/50 text-light-gray placeholder:text-gray-500 focus:ring-1 focus:ring-neon-pink focus:border-neon-pink transition";
  
  return (
    <div className="text-white">
      <div className="relative space-y-6">
        <div className="text-center">
          <h3 className="text-3xl sm:text-4xl font-display leading-tight text-white">
            Search curated stays across the globe
          </h3>
          <p className="text-medium-gray mt-2 text-base max-w-2xl mx-auto">
            Dial in destinations, dates, and all the finishing touches—then launch into search with one expressive action.
          </p>
        </div>
      {/* Basic Search */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Destination */}
        <div className="space-y-2">
          <label htmlFor={inputIds.destination} className={baseLabel}>
            <MapPin className="w-4 h-4 text-neon-pink" />
            Destination
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Where are you going?"
              className={`${baseField} pl-11 pr-4`}
              id={inputIds.destination}
              value={searchData.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              onFocus={() => setShowDropdown(filteredPlaces.length > 0)}
              onBlur={() => setShowDropdown(false)}
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            {showDropdown && (
              <ul className="absolute left-0 z-10 w-full overflow-y-auto bg-dark border border-white/20 rounded-lg shadow-lg top-full max-h-48">
                {filteredPlaces.map((place) => (
                  <li
                    key={place}
                    className="px-4 py-2 text-sm border-b border-white/10 cursor-pointer hover:bg-white/5 last:border-b-0"
                    onMouseDown={() => {
                      handleInputChange("destination", place);
                      setShowDropdown(false);
                    }}
                  >
                    {place}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Check-in / Check-out */}
        <div className="space-y-2">
          <label htmlFor={inputIds.checkIn} className={baseLabel}>
            <Calendar className="w-4 h-4 text-neon-pink" />
            Dates
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className={`${baseField} px-3`}
              id={inputIds.checkIn}
              value={formatDateInput(searchData.checkIn)}
              onChange={(e) => handleInputChange("checkIn", new Date(e.target.value))}
            />
            <input
              type="date"
              className={`${baseField} px-3`}
              id={inputIds.checkOut}
              value={formatDateInput(searchData.checkOut)}
              onChange={(e) => handleInputChange("checkOut", new Date(e.target.value))}
            />
          </div>
        </div>

        {/* Guests */}
        <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
          <label htmlFor={inputIds.guests} className={baseLabel}>
            <Users className="w-4 h-4 text-neon-pink" />
            Guests
          </label>
          <select
            className={`${baseField} pl-11 pr-10 appearance-none`}
            id={inputIds.guests}
            value={`${searchData.adultCount} adults, ${searchData.childCount} children`}
            onChange={(e) => {
              const [adults, children] = e.target.value.split(", ");
              handleInputChange("adultCount", parseInt(adults));
              handleInputChange("childCount", parseInt(children));
            }}
          >
            {[1, 2, 3, 4, 5, 6].map(a => (
              [0, 1, 2, 3, 4].map(c => (
                <option key={`${a}-${c}`} value={`${a} adults, ${c} children`}>
                  {a} adult{a > 1 ? 's' : ''}{c > 0 ? `, ${c} child${c > 1 ? 'ren' : ''}`: ''}
                </option>
              ))
            ))}
          </select>
        </div>
        
        {/* Search Button */}
        <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="flex items-center justify-center w-full gap-3 h-12 px-8 font-semibold text-dark transition-transform duration-200 rounded-lg bg-neon-teal shadow-lg shadow-neon-teal/20 hover:shadow-xl hover:shadow-neon-teal/40 hover:-translate-y-0.5"
            >
              <SearchIcon className="w-5 h-5" />
              Search
            </button>
        </div>
      </div>

      <div className="flex justify-start mt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors rounded-full text-medium-gray hover:text-white"
        >
          <Filter className="w-4 h-4" />
          {showAdvanced ? "Hide" : "Show"} Advanced Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-6 mt-6 space-y-6 border-t border-white/10">
          {/* Price Range, Star Rating, Hotel Type */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={baseLabel}>Price Range</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" className={`${baseField} px-4`} aria-label="Minimum price" value={searchData.minPrice} onChange={(e) => handleInputChange("minPrice", e.target.value)} />
                <span className="flex items-center text-gray-500">-</span>
                <input type="number" placeholder="Max" className={`${baseField} px-4`} aria-label="Maximum price" value={searchData.maxPrice} onChange={(e) => handleInputChange("maxPrice", e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor={inputIds.starRating} className={baseLabel}>Star Rating</label>
              <select className={`${baseField} px-4`} id={inputIds.starRating} value={searchData.starRating} onChange={(e) => handleInputChange("starRating", e.target.value)}>
                <option value="">Any Rating</option>
                {[5, 4, 3, 2].map(s => <option key={s} value={s.toString()}>{s}+ Stars</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={inputIds.hotelType} className={baseLabel}>Hotel Type</label>
              <select className={`${baseField} px-4`} id={inputIds.hotelType} value={searchData.hotelType} onChange={(e) => handleInputChange("hotelType", e.target.value)}>
                <option value="">Any Type</option>
                {hotelTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <label className={`${baseLabel} mb-3`}>Facilities</label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {facilityOptions.map((facility) => (
                <label key={facility.id} className="flex items-center gap-2 p-3 text-sm rounded-lg cursor-pointer border border-white/10 bg-dark/50 hover:bg-white/5">
                  <input type="checkbox" className="w-4 h-4 rounded bg-dark/50 border-white/20 text-neon-pink focus:ring-neon-pink/50" checked={searchData.facilities.includes(facility.id)} onChange={() => handleFacilityToggle(facility.id)} />
                  <span>{facility.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
