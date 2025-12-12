import { HotelType } from "../../../shared/types";
import { BedDouble, Users } from "lucide-react";

type Props = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  numberOfNights: number;
  roomCount?: number;
  hotel: HotelType;
};

const BookingDetailsSummary = ({
  checkIn,
  checkOut,
  adultCount,
  childCount,
  numberOfNights,
  roomCount = 1,
  hotel,
}: Props) => {
  return (
    <div className="grid gap-4 rounded-lg border border-white/10 bg-night-900/50 p-5 h-fit text-gray-300">
      <h2 className="text-xl font-bold text-white">Your Booking Details</h2>
      <div className="border-b border-white/10 py-2">
        Location:
        <div className="font-bold text-white">{`${hotel.name}, ${hotel.city}, ${hotel.country}`}</div>
      </div>
      <div className="flex justify-between">
        <div>
          Check-in
          <div className="font-bold text-white"> {checkIn.toDateString()}</div>
        </div>
        <div>
          Check-out
          <div className="font-bold text-white"> {checkOut.toDateString()}</div>
        </div>
      </div>
      <div className="border-t border-b border-white/10 py-2">
        Total length of stay:
        <div className="font-bold text-white">{numberOfNights} nights</div>
      </div>

      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-400" />
          Guests
          <div className="font-bold text-white">
            {adultCount} adults & {childCount} children
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="text-sm text-gray-400">
          Price per night:{" "}
          <span className="font-bold text-white">
            £{hotel.roomTypes?.[0]?.pricePerNight || 0}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          Total rooms: <span className="font-bold text-white">{roomCount}</span>
        </div>
      </div>

      {roomCount > 1 && (
        <div className="flex items-center gap-2 bg-brand-900/20 p-3 rounded-lg border border-brand-500/30">
          <BedDouble className="h-5 w-5 text-brand-400" />
          <span className="text-brand-300">
            Multi-room booking: <span className="font-bold text-white">{roomCount} rooms</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsSummary;
