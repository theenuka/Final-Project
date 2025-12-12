import { FormEvent, useState, useEffect, useRef } from "react";
import useSearchContext from "../hooks/useSearchContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Compass, CalendarDays, Users } from "lucide-react";
import { resolveApiBaseUrl } from "../lib/runtime-config";

const SearchBar = () => {
  const navigate = useNavigate();
  const search = useSearchContext();

  const [destination, setDestination] = useState<string>(search.destination);
  const [showDropdown, setShowDropdown] = useState(false);
  const [places, setPlaces] = useState<string[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<string[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>(search.checkIn);
  const [checkOut, setCheckOut] = useState<Date>(search.checkOut);
  const [adultCount, setAdultCount] = useState<number>(search.adultCount);
  const [childCount, setChildCount] = useState<number>(search.childCount);
  const hasFetchedRef = useRef(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  // Fetch hotel places on mount
  // You can replace this fetch with context if you already have hotel data

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

  // Clear dropdown state when component mounts (for search page)
  useEffect(() => {
    setShowDropdown(false);
    setFilteredPlaces([]);
    // Mark that initial mount is complete after a short delay
    setTimeout(() => {
      setIsInitialMount(false);
    }, 100);
  }, []);

  // Prevent dropdown from opening when destination is pre-filled from search context
  useEffect(() => {
    if (destination && places.length > 0) {
      const filtered = places.filter((place) =>
        place.toLowerCase().includes(destination.toLowerCase())
      );
      setFilteredPlaces(filtered);
      // Don't automatically show dropdown when destination is pre-filled
      setShowDropdown(false);
      // Reset user interaction state when destination is pre-filled
      setHasUserInteracted(false);
      // Force dropdown to stay closed during initial mount
      if (isInitialMount) {
        setShowDropdown(false);
      }
    }
  }, [destination, places, isInitialMount]);

  // Filter places as user types
  useEffect(() => {
    if (destination.length > 0) {
      const filtered = places.filter((place) =>
        place.toLowerCase().includes(destination.toLowerCase())
      );
      setFilteredPlaces(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [destination, places]);

  const resetFormValues = () => {
    const today = new Date();
    setDestination("");
    setCheckIn(today);
    setCheckOut(today);
    setAdultCount(1);
    setChildCount(0);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    // Allow empty destination to show all hotels
    // Only proceed if destination is not empty
    if (!destination || destination.trim() === "") {
      // Show all hotels when destination is empty
      search.saveSearchValues(
        "", // Empty destination to show all hotels
        checkIn,
        checkOut,
        adultCount,
        childCount,
        1,
        ""
      );

      // Close dropdown before navigation
      setShowDropdown(false);
      setFilteredPlaces([]);

      navigate("/search");

      setTimeout(() => {
        resetFormValues();
      }, 100);
      return;
    }

    search.saveSearchValues(
      destination.trim(),
      checkIn,
      checkOut,
      adultCount,
      childCount,
      1,
      ""
    );

    // Close dropdown before navigation
    setShowDropdown(false);
    setFilteredPlaces([]);

    navigate("/search");

    setTimeout(() => {
      resetFormValues();
    }, 100);
  };

  const handleClear = () => {
    resetFormValues();
    search.clearSearchValues();
    setShowDropdown(false);
    setHasUserInteracted(false);
    setIsInitialMount(false);
  };
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr] 2xl:grid-cols-[1.3fr_repeat(3,1fr)] items-end gap-4"
        autoComplete="off"
      >
        <div className="relative">
          <label
            htmlFor="destination"
            className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2 block"
          >
            Destination
          </label>
          <div className="relative">
            <Compass className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              id="destination"
              placeholder="City, region, or landmark"
              className="pl-11 pr-4 py-3 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-brand-400 focus-visible:ring-offset-night-900"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                setHasUserInteracted(true);
              }}
              onFocus={() => {
                if (
                  filteredPlaces.length > 0 &&
                  destination.length > 0 &&
                  hasUserInteracted &&
                  !isInitialMount
                ) {
                  setShowDropdown(true);
                }
              }}
              onBlur={() => setShowDropdown(false)}
            />
            {showDropdown && !isInitialMount && (
              <ul className="absolute top-full mt-2 left-0 w-full glass-panel rounded-2xl border border-white/15 shadow-large z-20 max-h-56 overflow-y-auto text-white">
                {filteredPlaces.map((place) => (
                  <li
                    key={place}
                    className="px-4 py-2 cursor-pointer hover:bg-white/10 text-sm"
                    onMouseDown={() => {
                      setDestination(place);
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

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2 block">
            Check-in
          </label>
          <div className="relative">
            <CalendarDays className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <DatePicker
              selected={checkIn}
              onChange={(date) => setCheckIn(date as Date)}
              selectsStart
              startDate={checkIn}
              endDate={checkOut}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Arrival"
              aria-label="Check-in date"
              className="w-full rounded-2xl border border-white/15 bg-white/10 text-white placeholder:text-white/60 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
              wrapperClassName="min-w-full"
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2 block">
            Check-out
          </label>
          <div className="relative">
            <CalendarDays className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <DatePicker
              selected={checkOut}
              onChange={(date) => setCheckOut(date as Date)}
              selectsStart
              startDate={checkIn}
              endDate={checkOut}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Departure"
              aria-label="Check-out date"
              className="w-full rounded-2xl border border-white/15 bg-white/10 text-white placeholder:text-white/60 py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
              wrapperClassName="min-w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2 block">
              Adults
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="number"
                min={1}
                max={20}
                value={adultCount}
                onChange={(event) =>
                  setAdultCount(parseInt(event.target.value) || 1)
                }
                className="pl-11 pr-4 py-3 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-brand-400 focus-visible:ring-offset-night-900"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-white/60 mb-2 block">
              Children
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="number"
                min={0}
                max={20}
                value={childCount}
                onChange={(event) =>
                  setChildCount(parseInt(event.target.value) || 0)
                }
                className="pl-11 pr-4 py-3 rounded-2xl border-white/15 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-brand-400 focus-visible:ring-offset-night-900"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 col-span-1 lg:col-span-full">
          <Button
            type="submit"
            className="flex-1 rounded-2xl border border-white/15 bg-[#0C1424] text-white font-semibold py-3 shadow-[0_20px_35px_rgba(1,3,10,0.6)] hover:border-white/35 hover:-translate-y-0.5 transition"
          >
            Search stays
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 text-white/80 hover:text-white"
            onClick={handleClear}
          >
            Clear filters
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
