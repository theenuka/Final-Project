type Props = {
  selectedStars: string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const StarRatingFilter = ({ selectedStars, onChange }: Props) => {
  return (
    <div className="border-b border-white/10 pb-5">
      <h4 className="text-xs uppercase tracking-[0.35em] text-white/50 mb-3">
        Property Rating
      </h4>
      {["5", "4", "3", "2", "1"].map((star) => (
        <label
          key={star}
          className="flex items-center justify-between py-1.5 text-sm text-white/80"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-white/30 bg-transparent text-brand-400 focus:ring-brand-400 accent-brand-400"
              value={star}
              checked={selectedStars.includes(star)}
              onChange={onChange}
            />
            <span className="font-medium">{star} stars</span>
          </div>
        </label>
      ))}
    </div>
  );
};

export default StarRatingFilter;
