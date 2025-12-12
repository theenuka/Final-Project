import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { hotelTypes } from "../../config/hotel-options-config";
import { cn } from "../../lib/utils";
import { HotelFormData } from "./ManageHotelForm";

const TypeSection = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<HotelFormData>();

  const typeWatch = watch("type") || [];

  useEffect(() => {
    register("type", {
      validate: (value) =>
        value && value.length > 0 ? true : "Select at least one hotel type",
    });
  }, [register]);

  const toggleType = (selectedType: string) => {
    const currentTypes = Array.isArray(typeWatch) ? [...typeWatch] : [];
    const exists = currentTypes.includes(selectedType);
    const updated = exists
      ? currentTypes.filter((t) => t !== selectedType)
      : [...currentTypes, selectedType];
    setValue("type", updated, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-400">
          02 · Hotel style
        </p>
        <h2 className="text-3xl font-semibold text-white">Choose the vibe</h2>
        <p className="text-base text-gray-400">
          Select every category that fits. We highlight these tags on your listing cards for the right guests.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hotelTypes.map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => toggleType(type)}
            className={cn(
              "flex items-center justify-between rounded-2xl border px-5 py-3 text-left text-base font-semibold transition",
              typeWatch.includes(type)
                ? "border-brand-500 bg-brand-500/10 text-brand-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
            )}
          >
            <span>{type}</span>
            <span
              className={cn(
                "h-4 w-4 rounded-full border-2",
                typeWatch.includes(type)
                  ? "border-brand-500 bg-brand-500"
                  : "border-white/20"
              )}
            />
          </button>
        ))}
      </div>
      {errors.type && (
        <span className="mt-3 block text-sm font-semibold text-rose-500">
          {errors.type.message}
        </span>
      )}
    </section>
  );
};

export default TypeSection;
