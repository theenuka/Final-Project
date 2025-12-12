type Props = {
  selectedPrice?: number;
  onChange: (value?: number) => void;
};

const PriceFilter = ({ selectedPrice, onChange }: Props) => {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.35em] text-white/50 mb-3">
        Max Price
      </h4>
      <select
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        value={selectedPrice}
        aria-label="Maximum nightly rate"
        onChange={(event) =>
          onChange(
            event.target.value ? parseInt(event.target.value) : undefined
          )
        }
      >
        <option value="">Select Max Price</option>
        {[50, 100, 200, 300, 500].map((price) => (
          <option key={price} value={price}>
            ${price}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PriceFilter;
