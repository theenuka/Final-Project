import { hotelFacilities } from "../config/hotel-options-config";

type Props = {
  selectedFacilities: string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const FacilitiesFilter = ({ selectedFacilities, onChange }: Props) => {
  return (
    <div className="border-b border-white/10 pb-5">
      <h4 className="text-xs uppercase tracking-[0.35em] text-white/50 mb-3">
        Facilities
      </h4>
      <div className="space-y-2">
        {hotelFacilities.map((facility) => (
          <label
            key={facility}
            className="flex items-center justify-between text-sm text-white/80"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-white/30 bg-transparent text-brand-400 focus:ring-brand-400 accent-brand-400"
                value={facility}
                checked={selectedFacilities.includes(facility)}
                onChange={onChange}
              />
              <span>{facility}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default FacilitiesFilter;
