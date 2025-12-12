import { useForm } from "react-hook-form";
import { PaymentIntentResponse, UserType } from "../../../../shared/types";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import useSearchContext from "../../hooks/useSearchContext";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import * as apiClient from "../../api-client";
import useAppContext from "../../hooks/useAppContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Shield,
  CheckCircle,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

type Props = {
  currentUser: UserType;
  paymentIntent: PaymentIntentResponse;
};

export type BookingFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  roomCount: number;
  checkIn: string;
  checkOut: string;
  hotelId: string;
  paymentIntentId: string;
  totalCost: number;
  specialRequests?: string;
  rooms: {
    roomTypeId: string;
    numberOfRooms: number;
  }[];
};

const BookingForm = ({ currentUser, paymentIntent }: Props) => {
  const stripe = useStripe();
  const elements = useElements();

  const search = useSearchContext();
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const { showToast } = useAppContext();

  // Use local state for form fields to prevent losing data
  const [phone, setPhone] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const { mutate: bookRoom, isLoading } = useMutation(
    apiClient.createRoomBooking,
    {
      onSuccess: () => {
        showToast({
          title: "Booking Successful",
          description: "Your hotel booking has been confirmed successfully!",
          type: "SUCCESS",
        });

        // Navigate to My Bookings page after a short delay
        setTimeout(() => {
          navigate("/my-bookings");
        }, 1500);
      },
      onError: () => {
        showToast({
          title: "Booking Failed",
          description:
            "There was an error processing your booking. Please try again.",
          type: "ERROR",
        });
      },
    }
  );

  const { handleSubmit, register } = useForm<BookingFormData>({
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      adultCount: search.adultCount,
      childCount: search.childCount,
      roomCount: search.roomCount || 1,
      checkIn: search.checkIn.toISOString(),
      checkOut: search.checkOut.toISOString(),
      hotelId: hotelId,
      totalCost: paymentIntent.totalCost,
      paymentIntentId: paymentIntent.paymentIntentId,
      rooms: [{ roomTypeId: search.roomTypeId, numberOfRooms: search.roomCount || 1 }],
    },
    mode: "onChange",
    shouldUnregister: false,
  });

  const handleCopyCredentials = async () => {
    const credentials = `Card: 4242 4242 4242 4242
MM/YY: 12/35 CVC: 123`;

    try {
      await navigator.clipboard.writeText(credentials);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy credentials:", err);
    }
  };

  const onSubmit = async (formData: BookingFormData) => {
    if (!stripe || !elements) {
      return;
    }

    // Add the local state values to the form data
    const completeFormData = {
      ...formData,
      phone,
      specialRequests,
    };

    const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement) as StripeCardElement,
      },
    });

    if (result.paymentIntent?.status === "succeeded") {
      bookRoom({
        ...completeFormData,
        paymentIntentId: result.paymentIntent.id,
      });
    }
  };

  return (
    <div className="p-6">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-white">
          <User className="h-6 w-6 text-brand-400" />
          Confirm Your Details
        </CardTitle>
        <p className="text-gray-400 mt-2">
          Please review and complete your booking information
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-brand-400" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  First Name
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-night-900/50 border-white/10 text-gray-400"
                  {...register("firstName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  Last Name
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  className="bg-night-900/50 border-white/10 text-gray-400"
                  {...register("lastName")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                  Email
                </Label>
                <Input
                  type="email"
                  readOnly
                  disabled
                  className="bg-night-900/50 border-white/10 text-gray-400"
                  {...register("email")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone (Optional)
                </Label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="bg-night-900 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-brand-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-400" />
              Special Requests (Optional)
            </h3>

            <div className="space-y-2">
              <textarea
                rows={4}
                placeholder="Any special requests, preferences, or additional information..."
                className="w-full rounded-md border border-white/10 bg-night-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Let us know if you have any special requirements or preferences
                for your stay.
              </p>
            </div>
          </div>

          {/* Price Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-400" />
              Price Summary
            </h3>

            <div className="bg-night-900/50 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Total Cost</span>
                <span className="text-2xl font-bold text-brand-400">
                  £{paymentIntent.totalCost.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Includes taxes and charges
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-400" />
              Payment Details
            </h3>

            <div className="border border-white/10 rounded-lg p-4 bg-night-900">
              <CardElement
                id="payment-element"
                className="text-sm"
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#ffffff",
                      "::placeholder": {
                        color: "#6b7280",
                      },
                    },
                    invalid: {
                      color: "#ef4444",
                    },
                  },
                }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield className="h-3 w-3 text-green-500" />
              Your payment information is secure and encrypted
            </div>
          </div>

          {/* Test Credentials Note */}
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-500 mb-2">
                    For Testing Purpose
                  </h4>
                  <p className="text-sm text-yellow-200/80 mb-3">
                    You can use these dummy credentials to complete checkout and
                    see the booking status page, analytical page, or other pages
                    to see the interactive results:
                  </p>
                  <div className="bg-night-900 border border-yellow-700/30 rounded-md p-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-mono text-gray-300">
                        <div>Card: 4242 4242 4242 4242</div>
                        <div>MM/YY: 12/35 CVC: 123 ZIP: 12345</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCredentials}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 rounded transition-colors duration-200"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              disabled={isLoading}
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Confirm Booking
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Trust Indicators */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              Secure Payment
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Instant Confirmation
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-green-500" />
              24/7 Support
            </div>
          </div>
        </div>










      </CardContent>
    </div>
  );
};

export default BookingForm;
