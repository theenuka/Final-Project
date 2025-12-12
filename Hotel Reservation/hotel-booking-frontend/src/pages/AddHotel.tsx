import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, ShieldCheck, Sparkles } from "lucide-react";
import ManageHotelForm from "../forms/ManageHotelForm/ManageHotelForm";
import useAppContext from "../hooks/useAppContext";
import * as apiClient from "../api-client";

const AddHotel = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation(apiClient.addMyHotel, {
    onSuccess: () => {
      showToast({
        title: "Hotel Added Successfully",
        description:
          "Your hotel has been added to the platform successfully! Redirecting to My Hotels...",
        type: "SUCCESS",
      });
      // Redirect to My Hotels page after successful save
      setTimeout(() => {
        navigate("/my-hotels");
      }, 1500); // Give user time to see the success message
    },
    onError: () => {
      showToast({
        title: "Failed to Add Hotel",
        description: "There was an error saving your hotel. Please try again.",
        type: "ERROR",
      });
    },
  });

  const handleSave = (hotelFormData: FormData) => {
    mutate(hotelFormData);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-night-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.15),_transparent_55%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 lg:px-0">
        <section className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600 via-purple-600 to-blue-600 p-10 shadow-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              Host Hub
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Showcase your stay with a polished, guided submission flow
            </h1>
            <p className="mt-6 text-lg text-white/80">
              Curate every detail of your property, highlight amenities guests love, and publish with confidence. We designed this flow to feel like concierge onboarding for premium hosts.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Listing quality score", value: "96%", icon: Sparkles },
                { label: "Avg. approval time", value: "< 12h", icon: CalendarCheck },
                { label: "Guest trust boost", value: "+34%", icon: ShieldCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-sm uppercase tracking-wider text-white/70">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">What to expect</h2>
            <p className="mt-2 text-gray-400">
              The redesigned Add Hotel flow breaks your submission into guided sections so nothing feels overwhelming.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                Share essentials like name, story, and nightly rates.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-purple-400" />
                Toggle curated facility chips and guest capacity with live validation.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                Upload hero imagery with inline previews before publishing.
              </li>
            </ul>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              Need help? Our concierge team can audit your listing before it goes live. Contact <span className="font-semibold text-white">hosts@aurora.travel</span>.
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="rounded-[30px] bg-night-800 px-4 py-10 sm:px-10">
            <ManageHotelForm onSave={handleSave} isLoading={isLoading} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AddHotel;
