import { FC } from "react";

const spotlightCard = {
  heroImage: "/marrakech.jpg",
  locationLabel: "Marrakech skyline",
  location: "Marrakech, Morocco",
  description: "Private riad with desert rituals",
  price: "$340 / night",
  featured: {
    title: "Maison Cyan",
    destination: "Santorini",
    rate: "$520 / night",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=400&q=80",
  },
};

const MemberSpotlightCard: FC = () => {
  return (
    <article 
      className="relative flex min-h-[320px] w-full flex-col justify-end overflow-hidden rounded-[42px] border border-white/10 p-8 text-white shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(4,6,25,0.9)), url(${spotlightCard.heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Gradient Overlays - z-10 */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,_rgba(140,161,255,0.2),_transparent_65%)]" />

      {/* Content - z-20 */}
      <div className="relative z-20 space-y-3">
        <span className="text-xs uppercase tracking-[0.38em] text-white/60">
          {spotlightCard.locationLabel}
        </span>
        <h3 className="text-3xl font-semibold tracking-tight">
          {spotlightCard.location}
        </h3>
        <p className="text-white/70">{spotlightCard.description}</p>
        <p className="text-xl font-semibold text-[#FF9B5C]">
          {spotlightCard.price}
        </p>
      </div>

      <div className="absolute right-4 top-4 z-20 rounded-[26px] border border-white/15 bg-black/50 px-5 py-4 text-right text-white/90 backdrop-blur-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">
          Member Spotlight
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {spotlightCard.featured.title}
        </p>
        <p className="text-sm text-[#FF8FA2]">
          {spotlightCard.featured.destination}
        </p>
        <p className="mt-2 text-sm text-white/75">
          {spotlightCard.featured.rate}
        </p>
      </div>
    </article>
  );
};

export default MemberSpotlightCard;
