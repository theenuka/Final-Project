import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useSearchContext from "../../hooks/useSearchContext";
import useAppContext from "../../hooks/useAppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Calendar, Users, User, Baby, CreditCard, BedDouble, Plus, Minus } from "lucide-react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useState } from "react";

type Props = {
  hotelId: string;
  pricePerNight: number;
};

type GuestInfoFormData = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  roomCount: number;
};

const GuestInfoForm = ({ hotelId, pricePerNight }: Props) => {
  const search = useSearchContext();
  const { isLoggedIn } = useAppContext();
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const [roomCount, setRoomCount] = useState(1);

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuestInfoFormData>({
    defaultValues: {
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adultCount: search.adultCount,
      childCount: search.childCount,
      roomCount: 1,
    },
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");

  // Calculate number of nights
  let numberOfNights = 1;
  if (checkIn && checkOut) {
    const diff = checkOut.getTime() - checkIn.getTime();
    numberOfNights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  const totalPrice = pricePerNight * numberOfNights * roomCount;

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const handleRoomCountChange = (change: number) => {
    const newCount = Math.max(1, Math.min(10, roomCount + change));
    setRoomCount(newCount);
    setValue("roomCount", newCount);
  };

  const onSignInClick = (data: GuestInfoFormData) => {
    search.saveSearchValues(
      "",
      data.checkIn,
      data.checkOut,
      data.adultCount,
      data.childCount,
      roomCount
    );
    signIn();
  };

  const onSubmit = (data: GuestInfoFormData) => {
    search.saveSearchValues(
      "",
      data.checkIn,
      data.checkOut,
      data.adultCount,
      data.childCount,
      roomCount
    );
    navigate(`/hotel/${hotelId}/booking`);
  };

  return (
    <>
      <style>
        {`
          .react-datepicker {
            background-color: #0B1730 !important;
            border: 1px solid #1e293b !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3) !important;
            font-family: inherit !important;
            color: #ffffff !important;
          }
          .react-datepicker__header {
            background-color: #0F2145 !important;
            border-bottom: 1px solid #1e293b !important;
            border-radius: 8px 8px 0 0 !important;
          }
          .react-datepicker__current-month {
            color: #ffffff !important;
            font-weight: 600 !important;
          }
          .react-datepicker__day-name {
            color: #9ca3af !important;
            font-weight: 500 !important;
          }
          .react-datepicker__day {
            color: #e5e7eb !important;
            border-radius: 6px !important;
            margin: 2px !important;
          }
          .react-datepicker__day:hover {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
          }
          .react-datepicker__day--selected {
            background-color: #3b82f6 !important;
            color: white !important;
          }
          .react-datepicker__day--in-range {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
          }
          .react-datepicker__day--keyboard-selected {
            background-color: #3b82f6 !important;
            color: white !important;
          }
          .react-datepicker__day--outside-month {
            color: #4b5563 !important;
          }
          .react-datepicker__navigation {
            color: #9ca3af !important;
          }
          .react-datepicker__navigation:hover {
            color: #ffffff !important;
          }
        `}
      </style>
      <Card className="w-full shadow-lg border border-white/10 bg-night-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg font-semibold text-white">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-400" />
              <span>Booking Summary</span>
            </div>
            <Badge variant="outline" className="text-sm border-white/20 text-gray-300">
              £{pricePerNight}/night
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Price Display */}
          <div className="flex justify-between items-center p-4 bg-night-900 rounded-lg border border-white/10 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-gray-400 text-sm">
                £{pricePerNight} × {numberOfNights} night{numberOfNights > 1 ? "s" : ""} × {roomCount} room{roomCount > 1 ? "s" : ""}
              </span>
              {roomCount > 1 && (
                <span className="text-xs text-green-400">
                  Multi-room booking
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-400">
                £{totalPrice}
              </div>
              <div className="text-xs text-gray-500">Total Price</div>
            </div>
          </div>

          <form
            onSubmit={
              isLoggedIn ? handleSubmit(onSubmit) : handleSubmit(onSignInClick)
            }
            className="space-y-4"
          >
            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Calendar className="h-4 w-4" />
                Select Dates
              </Label>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <DatePicker
                    required
                    selected={checkIn}
                    onChange={(date) => setValue("checkIn", date as Date)}
                    selectsStart
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={minDate}
                    maxDate={maxDate}
                    placeholderText="Check-in Date"
                    className="w-full bg-night-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                    wrapperClassName="w-full"
                  />
                </div>

                <div className="relative">
                  <DatePicker
                    required
                    selected={checkOut}
                    onChange={(date) => setValue("checkOut", date as Date)}
                    selectsStart
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={minDate}
                    maxDate={maxDate}
                    placeholderText="Check-out Date"
                    className="w-full bg-night-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Users className="h-4 w-4" />
                Guest Information
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs text-gray-400">
                    <User className="h-3 w-3" />
                    Adults
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    className="text-center font-semibold bg-night-900 border-white/10 text-white"
                    {...register("adultCount", {
                      required: "This field is required",
                      min: {
                        value: 1,
                        message: "There must be at least one adult",
                      },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.adultCount && (
                    <span className="text-red-500 text-xs">
                      {errors.adultCount.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs text-gray-400">
                    <Baby className="h-3 w-3" />
                    Children
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    className="text-center font-semibold bg-night-900 border-white/10 text-white"
                    {...register("childCount", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Room Count */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <BedDouble className="h-4 w-4" />
                Number of Rooms
              </Label>
              <div className="flex items-center justify-center gap-4 p-3 bg-night-900 rounded-lg border border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRoomCountChange(-1)}
                  disabled={roomCount <= 1}
                  className="h-10 w-10 rounded-full border-white/20 bg-night-800 hover:bg-night-700 disabled:opacity-50"
                >
                  <Minus className="h-4 w-4 text-white" />
                </Button>
                <div className="flex flex-col items-center min-w-[60px]">
                  <span className="text-2xl font-bold text-white">{roomCount}</span>
                  <span className="text-xs text-gray-400">room{roomCount > 1 ? "s" : ""}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRoomCountChange(1)}
                  disabled={roomCount >= 10}
                  className="h-10 w-10 rounded-full border-white/20 bg-night-800 hover:bg-night-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </div>
              {roomCount > 1 && (
                <p className="text-xs text-center text-gray-500">
                  Book multiple rooms for your group
                </p>
              )}
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Book Now
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Sign in to Book
                </div>
              )}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-white/10">
            Free cancellation • No booking fees • Instant confirmation
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default GuestInfoForm;
