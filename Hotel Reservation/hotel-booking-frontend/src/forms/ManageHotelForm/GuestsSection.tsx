import { Users, UserRound } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Input } from "../../components/ui/input";
import { HotelFormData } from "./ManageHotelForm";

const GuestsSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<HotelFormData>();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-400">
          04 · Capacity
        </p>
        <h2 className="text-3xl font-semibold text-white">Guest capacity & comfort</h2>
        <p className="text-base text-gray-400">
          Set realistic occupancy to keep satisfaction scores high.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300">
          <span className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand-400" /> Adults
          </span>
          <Input
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
            type="number"
            min={1}
            {...register("adultCount", {
              required: "This field is required",
            })}
          />
          {errors.adultCount?.message && (
            <span className="text-sm font-medium text-rose-500">
              {errors.adultCount?.message}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300">
          <span className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-brand-400" /> Children
          </span>
          <Input
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
            type="number"
            min={0}
            {...register("childCount", {
              required: "This field is required",
            })}
          />
          {errors.childCount?.message && (
            <span className="text-sm font-medium text-rose-500">
              {errors.childCount?.message}
            </span>
          )}
        </label>
      </div>
    </section>
  );
};

export default GuestsSection;
