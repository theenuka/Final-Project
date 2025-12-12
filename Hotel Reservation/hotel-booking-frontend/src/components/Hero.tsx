import {
  ArrowRight,
  Compass,
  Plane,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdvancedSearch from "./AdvancedSearch";

const heroStats = [
  { label: "Handpicked escapes", value: "650+", detail: "Design-forward stays" },
  { label: "Cities curated", value: "48", detail: "Across 5 continents" },
  { label: "Avg. rating", value: "4.9/5", detail: "From verified guests" },
];

const floatingDestinations = [
  {
    city: "Marrakech",
    country: "Morocco",
    price: "$340 / night",
    image: "/marrakech.jpg",
  },
  {
    city: "Santorini",
    country: "Greece",
    price: "$520 / night",
    image: "/santorini.jpg",
  },
];

const Hero = ({ onSearch }: { onSearch: (searchData: any) => void }) => {
  const navigate = useNavigate();

  const handlePrimaryCta = () => navigate("/search");
  const handleSecondaryCta = () => navigate("/search?hotelType=Resort");

  return (
    <section id="hero" className="relative overflow-hidden bg-dark text-white">
      <div className="absolute inset-0 aurora-veil opacity-30 animate-aurora -z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center border border-neon-teal/30 rounded-full px-4 py-1.5 text-sm uppercase tracking-wide text-light-gray">
              <Sparkles className="w-4 h-4 mr-2 text-neon-teal" />
              Bespoke stays crafted for dreamers
            </div>

            <div className="space-y-4">
              <p className="text-medium-gray text-lg font-semibold font-sans">Phoenix Booking</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display leading-tight text-white">
                Design-led hotels curated
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-teal to-white">
                  for the way you wander
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-medium-gray max-w-2xl">
                Glide through inspired stays, chef-led tasting menus, and skyline spas. We pair refined aesthetics with seamless technology so every booking feels like a concierge upgrade.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-light-gray">
              <span className="bg-dark/50 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-neon-teal" />
                Flexible cancellation on 90% of homes
              </span>
              <span className="bg-dark/50 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
                <Plane className="w-4 h-4 text-neon-teal" />
                Jetsetter perks unlocked instantly
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="bg-dark/50 border border-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-sm text-medium-gray">{stat.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handlePrimaryCta}
                className="inline-flex items-center px-6 py-3 rounded-full bg-neon-pink text-white font-semibold shadow-lg shadow-neon-pink/30 hover:-translate-y-0.5 transition-transform"
              >
                Plan a curated escape
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button
                onClick={handleSecondaryCta}
                className="inline-flex items-center px-5 py-3 rounded-full border border-white/30 text-light-gray hover:border-white/70 hover:text-white transition-colors"
              >
                <Waves className="w-4 h-4 mr-2" />
                Explore coastal villas
              </button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative h-full">
            <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-2xl shadow-neon-pink/10">
              <img
                src={floatingDestinations[0].image}
                alt={`${floatingDestinations[0].city} skyline`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white font-semibold text-xl">
                  {floatingDestinations[0].city}, {floatingDestinations[0].country}
                </p>
                <p className="text-gray-200 text-sm">Private riad with desert rituals</p>
                <p className="text-neon-teal font-semibold mt-2">
                  {floatingDestinations[0].price}
                </p>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-6 bg-dark/50 border border-white/10 backdrop-blur-md p-4 rounded-2xl w-64 shadow-xl animate-float">
              <Compass className="w-5 h-5 text-neon-teal" />
              <p className="mt-3 text-white font-semibold">Sunset tasting flight</p>
              <p className="text-medium-gray text-sm">Four-course pairing over the Medina</p>
              <div className="mt-4 flex items-center justify-between text-sm text-light-gray">
                <span>Tonight</span>
                <span>7:45 PM</span>
              </div>
            </div>

            <div className="absolute -top-8 right-0 bg-dark/50 border border-white/10 backdrop-blur-md p-3 rounded-2xl w-64 shadow-xl animate-float [animation-delay:1s]">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Member spotlight</p>
              <div className="flex items-center gap-3">
                <img src={floatingDestinations[1].image} alt="Santorini" className="w-16 h-16 object-cover rounded-xl"/>
                <div>
                  <p className="text-white font-semibold">Maison Cyan</p>
                  <p className="text-neon-pink text-sm">Santorini</p>
                  <p className="text-light-gray text-sm mt-1">{floatingDestinations[1].price}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="bg-dark/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-lg border border-white/10">
            <AdvancedSearch onSearch={onSearch} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
