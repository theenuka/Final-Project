import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import BookingForm from "../forms/BookingForm/BookingForm";
import useSearchContext from "../hooks/useSearchContext";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BookingDetailsSummary from "../components/BookingDetailsSummary";
import { Elements } from "@stripe/react-stripe-js";
import useAppContext from "../hooks/useAppContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, CreditCard, Calendar, Users } from "lucide-react";

const Booking = () => {
  const { stripePromise } = useAppContext();
  const search = useSearchContext();
  const { hotelId } = useParams();

  const [numberOfNights, setNumberOfNights] = useState<number>(0);

  useEffect(() => {
    if (search.checkIn && search.checkOut) {
      const nights =
        Math.abs(search.checkOut.getTime() - search.checkIn.getTime()) /
        (1000 * 60 * 60 * 24);

      setNumberOfNights(Math.ceil(nights));
    }
  }, [search.checkIn, search.checkOut]);

  const { data: paymentIntentData, isLoading: isLoadingPayment } = useQuery(
    ["createPaymentIntent", numberOfNights, search.roomCount, search.roomTypeId],
    () =>
      apiClient.createPaymentIntent(
        hotelId as string,
        numberOfNights.toString(),
        search.roomCount || 1,
        search.roomTypeId
      ),
    {
      enabled: !!hotelId && numberOfNights > 0 && !!search.roomTypeId,
    }
  );

  const { data: hotel, isLoading: isLoadingHotel } = useQuery(
    "fetchHotelByID",
    () => apiClient.fetchHotelById(hotelId as string),
    {
      enabled: !!hotelId,
    }
  );

  const { data: currentUser, isLoading: isLoadingUser } = useQuery(
    "fetchCurrentUser",
    apiClient.fetchCurrentUser
  );

  if (isLoadingHotel || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">
            Loading booking details...
          </span>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Hotel Not Found
          </h2>
          <p className="text-gray-600">
            The hotel you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-6 w-6 text-brand-400" />
            <h1 className="text-3xl font-bold text-white">
              Complete Your Booking
            </h1>
          </div>
          <p className="text-gray-400">
            Please review your details and complete the payment to confirm your
            reservation.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="shadow-lg border-white/10 bg-night-800">
              <CardHeader className="pb-4 border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Calendar className="h-5 w-5 text-brand-400" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <BookingDetailsSummary
                  checkIn={search.checkIn}
                  checkOut={search.checkOut}
                  adultCount={search.adultCount}
                  childCount={search.childCount}
                  numberOfNights={numberOfNights}
                  roomCount={search.roomCount}
                  hotel={hotel}
                />
              </CardContent>
            </Card>

            {/* Hotel Info Card */}
            <Card className="shadow-lg border-white/10 bg-night-800">
              <CardHeader className="pb-4 border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Users className="h-5 w-5 text-brand-400" />
                  Hotel Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    {hotel.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {hotel.city}, {hotel.country}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                      {hotel.starRating} Stars
                    </Badge>
                    <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                      £{hotel.roomTypes?.[0]?.pricePerNight || 0}/night
                    </Badge>
                  </div>
                  {hotel.type && hotel.type.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hotel.type.map((type, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-white/20 text-gray-300"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            {isLoadingPayment ? (
              <Card className="shadow-lg border-white/10 bg-night-800">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
                    <span className="text-gray-300">Preparing payment...</span>
                  </div>
                </CardContent>
              </Card>
            ) : currentUser && paymentIntentData ? (
              <Card className="shadow-lg border-white/10 bg-night-800">
                <CardContent className="p-0">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentIntentData.clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#4F82FF',
                          colorBackground: '#0B1730',
                          colorText: '#ffffff',
                          colorDanger: '#ef4444',
                          fontFamily: 'Manrope, system-ui, sans-serif',
                          spacingUnit: '4px',
                          borderRadius: '8px',
                        },
                      },
                    }}
                    key={paymentIntentData.clientSecret}
                  >
                    <BookingForm
                      currentUser={currentUser}
                      paymentIntent={paymentIntentData}
                    />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-white/10 bg-night-800">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-400 mx-auto mb-3" />
                    <p className="text-gray-300">Loading payment form...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
