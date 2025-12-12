import { FormProvider, useForm } from "react-hook-form";
import { Building2, Camera, ClipboardList, Sparkles } from "lucide-react";
import DetailsSection from "./DetailsSection";
import TypeSection from "./TypeSection";
import FacilitiesSection from "./FacilitiesSection";
import GuestsSection from "./GuestsSection";
import ImagesSection from "./ImagesSection";
import ContactSection from "./ContactSection";
import PoliciesSection from "./PoliciesSection";
import { HotelType } from "../../../../shared/types";
import { useEffect } from "react";

export type HotelFormData = {
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  pricePerNight: number;
  starRating: number;
  facilities: string[];
  imageFiles?: FileList;
  imageUrls: string[];
  adultCount: number;
  childCount: number;
  // New fields
  contact?: {
    phone: string;
    email: string;
    website: string;
  };
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    petPolicy: string;
    smokingPolicy: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  isFeatured: boolean;
};

type Props = {
  hotel?: HotelType;
  onSave: (hotelFormData: FormData) => void;
  isLoading: boolean;
};

const ManageHotelForm = ({ onSave, isLoading, hotel }: Props) => {
  const formMethods = useForm<HotelFormData>({
    defaultValues: {
      type: [],
      facilities: [],
      imageUrls: [],
      adultCount: 1,
      childCount: 0,
      contact: { phone: "", email: "", website: "" },
      policies: {
        checkInTime: "",
        checkOutTime: "",
        cancellationPolicy: "",
        petPolicy: "",
        smokingPolicy: "",
      },
      isFeatured: false,
    },
  });
  const { handleSubmit, reset } = formMethods;

  useEffect(() => {
    if (hotel) {
      // Ensure contact and policies are properly initialized
      const formData = {
        ...hotel,
        type: hotel.type || [],
        facilities: hotel.facilities || [],
        imageUrls: hotel.imageUrls || [],
        contact: hotel.contact || {
          phone: "",
          email: "",
          website: "",
        },
        policies: hotel.policies || {
          checkInTime: "",
          checkOutTime: "",
          cancellationPolicy: "",
          petPolicy: "",
          smokingPolicy: "",
        },
      };
      reset(formData);
    }
  }, [hotel, reset]);

  const onSubmit = handleSubmit((formDataJson: HotelFormData) => {
    const formData = new FormData();
    if (hotel) {
      formData.append("hotelId", hotel._id);
    }
    formData.append("name", formDataJson.name);
    formData.append("city", formDataJson.city);
    formData.append("country", formDataJson.country);
    formData.append("description", formDataJson.description);
    formDataJson.type.forEach((t, idx) => {
      formData.append(`type[${idx}]`, t);
    });
    formData.append("pricePerNight", formDataJson.pricePerNight.toString());
    formData.append("starRating", formDataJson.starRating.toString());
    formData.append("adultCount", formDataJson.adultCount.toString());
    formData.append("childCount", formDataJson.childCount.toString());

    formDataJson.facilities.forEach((facility, index) => {
      formData.append(`facilities[${index}]`, facility);
    });

    // Add contact information
    if (formDataJson.contact) {
      formData.append("contact.phone", formDataJson.contact.phone || "");
      formData.append("contact.email", formDataJson.contact.email || "");
      formData.append("contact.website", formDataJson.contact.website || "");
    }

    // Add policies
    if (formDataJson.policies) {
      formData.append(
        "policies.checkInTime",
        formDataJson.policies.checkInTime || ""
      );
      formData.append(
        "policies.checkOutTime",
        formDataJson.policies.checkOutTime || ""
      );
      formData.append(
        "policies.cancellationPolicy",
        formDataJson.policies.cancellationPolicy || ""
      );
      formData.append(
        "policies.petPolicy",
        formDataJson.policies.petPolicy || ""
      );
      formData.append(
        "policies.smokingPolicy",
        formDataJson.policies.smokingPolicy || ""
      );
    }

    (formDataJson.imageUrls || []).forEach((url, index) => {
      formData.append(`imageUrls[${index}]`, url);
    });

    if (formDataJson.imageFiles && formDataJson.imageFiles.length > 0) {
      Array.from(formDataJson.imageFiles).forEach((imageFile) => {
        formData.append(`imageFiles`, imageFile);
      });
    }

    onSave(formData);
  });

  return (
    <FormProvider {...formMethods}>
      <form className="space-y-12" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Essentials",
              description: "Identity, story & pricing",
              icon: Building2,
            },
            {
              label: "Experience",
              description: "Types, facilities & capacity",
              icon: Sparkles,
            },
            {
              label: "Policies",
              description: "Contact & stay rules",
              icon: ClipboardList,
            },
            {
              label: "Gallery",
              description: "Upload hero visuals",
              icon: Camera,
            },
          ].map(({ label, description, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                <Icon className="h-3.5 w-3.5 text-brand-400" />
                Step
              </div>
              <p className="mt-3 text-lg font-semibold text-white">
                {label}
              </p>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          ))}
        </div>

        <DetailsSection />
        <TypeSection />
        <FacilitiesSection />
        <GuestsSection />
        <ContactSection />
        <PoliciesSection />
        <ImagesSection />

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            You can edit this listing any time after publishing. Changes go live instantly.
          </span>
          <button
            disabled={isLoading}
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 via-purple-600 to-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-progress disabled:opacity-70"
          >
            {isLoading ? "Saving your stay..." : "Publish stay"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default ManageHotelForm;
