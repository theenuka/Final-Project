import { useFormContext } from "react-hook-form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { HotelFormData } from "./ManageHotelForm";

const DetailsSection = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<HotelFormData>();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/5">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-400">
          01 · Essentials
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          Tell guests about your property
        </h2>
        <p className="mt-3 text-base text-gray-400">
          This is the first impression guests see across search results and recommendation cards.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <Label className="text-sm font-semibold text-gray-300">Property name</Label>
          <Input
            type="text"
            placeholder="Aurora Boutique Suites"
            className="mt-2 h-12 rounded-xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
            {...register("name", { required: "This field is required" })}
          />
          {errors.name && (
            <span className="mt-1 block text-sm font-medium text-rose-500">
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-sm font-semibold text-gray-300">City</Label>
            <Input
              type="text"
              placeholder="Lisbon"
              className="mt-2 h-12 rounded-xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
              {...register("city", { required: "This field is required" })}
            />
            {errors.city && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.city.message}
              </span>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-300">Country</Label>
            <Input
              type="text"
              placeholder="Portugal"
              className="mt-2 h-12 rounded-xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
              {...register("country", { required: "This field is required" })}
            />
            {errors.country && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.country.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold text-gray-300">Story & highlights</Label>
          <Textarea
            rows={6}
            placeholder="Share what makes this stay unforgettable..."
            className="mt-2 rounded-2xl border-white/10 bg-white/5 text-base leading-relaxed text-white placeholder:text-gray-500 focus:border-brand-500/50"
            {...register("description", { required: "This field is required" })}
          />
          {errors.description && (
            <span className="mt-1 block text-sm font-medium text-rose-500">
              {errors.description.message}
            </span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-sm font-semibold text-gray-300">Price per night</Label>
            <Input
              type="number"
              min={1}
              placeholder="180"
              className="mt-2 h-12 rounded-xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
              {...register("pricePerNight", { required: "This field is required" })}
            />
            {errors.pricePerNight && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.pricePerNight.message}
              </span>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-300">Star rating</Label>
            <select
              {...register("starRating", {
                required: "This field is required",
              })}
              className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="" className="bg-night-900">Select a rating</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num} className="bg-night-900">
                  {num} star{num > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            {errors.starRating && (
              <span className="mt-1 block text-sm font-medium text-rose-500">
                {errors.starRating.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailsSection;
