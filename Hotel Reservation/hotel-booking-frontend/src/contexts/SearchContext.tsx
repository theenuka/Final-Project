import React, { useState } from "react";

export type SearchContext = {
  destination: string;
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  roomCount: number;
  hotelId: string;
  roomTypeId: string;
  saveSearchValues: (
    destination: string,
    checkIn: Date,
    checkOut: Date,
    adultCount: number,
    childCount: number,
    roomCount?: number,
    roomTypeId?: string
  ) => void;
  clearSearchValues: () => void;
};

export const SearchContext = React.createContext<SearchContext | undefined>(
  undefined
);

type SearchContextProviderProps = {
  children: React.ReactNode;
};

export const SearchContextProvider = ({
  children,
}: SearchContextProviderProps) => {
  const [destination, setDestination] = useState<string>(
    () => sessionStorage.getItem("destination") || ""
  );
  const [checkIn, setCheckIn] = useState<Date>(
    () =>
      new Date(sessionStorage.getItem("checkIn") || new Date().toISOString())
  );
  const [checkOut, setCheckOut] = useState<Date>(
    () =>
      new Date(sessionStorage.getItem("checkOut") || new Date().toISOString())
  );
  const [adultCount, setAdultCount] = useState<number>(() =>
    parseInt(sessionStorage.getItem("adultCount") || "1")
  );
  const [childCount, setChildCount] = useState<number>(() =>
    parseInt(sessionStorage.getItem("childCount") || "1")
  );
  const [roomCount, setRoomCount] = useState<number>(() =>
    parseInt(sessionStorage.getItem("roomCount") || "1")
  );
  const [hotelId, setHotelId] = useState<string>(
    () => sessionStorage.getItem("hotelID") || ""
  );
  const [roomTypeId, setRoomTypeId] = useState<string>(
    () => sessionStorage.getItem("roomTypeId") || ""
  );

  const saveSearchValues = (
    destination: string,
    checkIn: Date,
    checkOut: Date,
    adultCount: number,
    childCount: number,
    roomCount?: number,
    hotelId?: string,
    roomTypeId?: string
  ) => {
    setDestination(destination);
    setCheckIn(checkIn);
    setCheckOut(checkOut);
    setAdultCount(adultCount);
    setChildCount(childCount);
    if (roomCount) {
      setRoomCount(roomCount);
    }
    if (hotelId) {
      setHotelId(hotelId);
    }
    if (roomTypeId) {
      setRoomTypeId(roomTypeId);
    }

    sessionStorage.setItem("destination", destination);
    sessionStorage.setItem("checkIn", checkIn.toISOString());
    sessionStorage.setItem("checkOut", checkOut.toISOString());
    sessionStorage.setItem("adultCount", adultCount.toString());
    sessionStorage.setItem("childCount", childCount.toString());
    if (roomCount) {
      sessionStorage.setItem("roomCount", roomCount.toString());
    }

    if (hotelId) {
      sessionStorage.setItem("hotelId", hotelId);
    }
    if (roomTypeId) {
      sessionStorage.setItem("roomTypeId", roomTypeId);
    }
  };

  const clearSearchValues = () => {
    setDestination("");
    setCheckIn(new Date());
    setCheckOut(new Date());
    setAdultCount(1);
    setChildCount(0);
    setRoomCount(1);
    setHotelId("");
    setRoomTypeId("");

    sessionStorage.removeItem("destination");
    sessionStorage.removeItem("checkIn");
    sessionStorage.removeItem("checkOut");
    sessionStorage.removeItem("adultCount");
    sessionStorage.removeItem("childCount");
    sessionStorage.removeItem("roomCount");
    sessionStorage.removeItem("hotelId");
    sessionStorage.removeItem("roomTypeId");

    // Clear cached places data if it's older than 5 minutes
    const cacheTime = localStorage.getItem("hotelPlacesTime");
    if (cacheTime) {
      const now = Date.now();
      if (now - parseInt(cacheTime) > 5 * 60 * 1000) {
        localStorage.removeItem("hotelPlaces");
        localStorage.removeItem("hotelPlacesTime");
      }
    }
  };

  return (
    <SearchContext.Provider
      value={{
        destination,
        checkIn,
        checkOut,
        adultCount,
        childCount,
        roomCount,
        hotelId,
        roomTypeId,
        saveSearchValues,
        clearSearchValues,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

// ...existing code...
