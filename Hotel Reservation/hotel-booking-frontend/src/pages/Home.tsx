import { useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { Compass, Crown, Globe2, LampWallDown, Sparkles, Wifi } from "lucide-react";
import * as apiClient from "../api-client";
import LatestDestinationCard from "../components/LastestDestinationCard";
import Hero from "../components/Hero";
import MemberSpotlightCard from "../components/MemberSpotlightCard";
import { useLocation, useNavigate } from "react-router-dom";

const curatedCollections = [
  {
    title: "Skyline Penthouses",
    subtitle: "City lights, private terraces",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    badge: "Metropolitan",
  },
  {
    title: "Verdant Hideaways",
    subtitle: "Jungle suites with plunge pools",
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
    badge: "Tropical",
  },
  {
    title: "Sculpted Desert Villas",
    subtitle: "Mid-century serenity and stargazing",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    badge: "Desert",
  },
];

const experienceHighlights = [
  {
    icon: Crown,
    title: "Concierge-grade planning",
    copy: "Chat with travel stylists who know every rooftop, thermal bath, and tasting room on your list.",
    chips: ["In-app chat", "Local hosts"],
  },
  {
    icon: Wifi,
    title: "Seamless smart stays",
    copy: "Ultra-fast Wi-Fi, touchless check-in, curated playlists, and climate presets greet you on arrival.",
    chips: ["Digital key", "Smart climate"],
  },
  {
    icon: LampWallDown,
    title: "Atmospheric design",
    copy: "Candle-lit courtyards, biophilic suites, and gallery-level lighting keep nights cinematic.",
    chips: ["Design audit", "Boutique only"],
  },
  {
    icon: Globe2,
    title: "Slow travel ready",
    copy: "Flexible calendars, creative residencies, and long-stay perks let you linger longer.",
    chips: ["Stay credits", "Artist residencies"],
  },
];

const marqueeStories = [
  "Complimentary artisan breakfast",
  "Private sommelier pairings",
  "Sunrise yoga on floating decks",
  "Vintage car airport transfers",
  "In-room vinyl listening bars",
  "Onsen-style spa suites",
];

const testimonials = [
  {
    quote:
      "This feels like booking through a private club. Every itinerary was styled down to the custom scent in our suite.",
    name: "Alessia Duarte",
    role: "Creative Director, Atelier Norte",
  },
  {
    quote:
      "We toggled between meetings in Singapore and a surf break in Bali without ever leaving the Phoenix app.",
    name: "Marcus Lee",
    role: "Founder, Field Labs",
  },
];

const Home = () => {
  const {
    data: hotels,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery("fetchQuery", () => apiClient.fetchHotels(), {
    retry: 1,
  });
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (searchData: any) => {
    console.log("Search initiated with:", searchData);
  };

  const destinations = useMemo(() => {
    if (Array.isArray(hotels)) {
      return hotels;
    }

    if (hotels && !Array.isArray(hotels)) {
      console.warn("Unexpected /api/hotels payload", hotels);
    }

    return [];
  }, [hotels]);

  useEffect(() => {
    const section = (location.state as { section?: string } | null)?.section;
    if (section) {
      requestAnimationFrame(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="text-white bg-night-900">
      <Hero onSearch={handleSearch} />

      {/* Member Spotlight */}
      <section className="px-4 py-12 mx-auto max-w-6xl sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,_1.2fr)_minmax(0,_0.8fr)] items-center">
          <MemberSpotlightCard />
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-accentGlow">Member spotlight</p>
            <h2 className="text-3xl font-display">A rotating peek inside the club</h2>
            <p className="text-white/75">
              Each week we surface a stay from our host collective that nails the Phoenix vibe—design-forward, story rich,
              and blissfully attentive. Tap through to learn why Maison Cyan earned this week’s feature.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accentGlow" />
                Hand-graded ambiance, culinary, and wellness markers.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-300" />
                Guaranteed perks such as guided rituals or chef tables.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
                Instant booking access for loyalty tiers Aurora+ and above.
              </li>
            </ul>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 hover:border-white/40">
              <Sparkles className="w-4 h-4" />
              View membership perks
            </button>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-white/5 bg-night-800/60">
        <div className="flex gap-12 py-4 text-sm tracking-wide whitespace-nowrap animate-marquee text-white/70">
          {[...marqueeStories, ...marqueeStories].map((story, index) => (
            <span key={`${story}-${index}`} className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accentGlow" />
              {story}
            </span>
          ))}
        </div>
      </div>

      {/* Collections */}
      <section id="collections" className="px-4 py-12 mx-auto space-y-8 max-w-7xl sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-accentGlow uppercase text-xs tracking-[0.3em] mb-3">Collections</p>
            <h2 className="text-3xl sm:text-4xl font-display">Curated itineraries for every mood</h2>
            <p className="max-w-2xl mt-3 text-white/70">
              Tap into cinematic penthouses, jungle lodges with biophilic design, and mid-century gems across oceans—each vetted by our design council.
            </p>
          </div>
          <button className="self-start px-5 py-2 text-sm tracking-wide border rounded-full border-white/20">
            View all inspiration guides
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {curatedCollections.map((collection) => (
            <article
              key={collection.title}
              className="relative rounded-[32px] overflow-hidden group shadow-glow h-[360px]"
            >
              <img src={collection.image} alt={collection.title} className="absolute inset-0 object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-night-900 via-night-900/10 to-transparent" />
              <div className="absolute top-6 left-6 text-xs uppercase tracking-[0.3em] text-white/70">{collection.badge}</div>
              <div className="absolute space-y-2 bottom-6 left-6 right-6">
                <h3 className="text-2xl font-semibold">{collection.title}</h3>
                <p className="text-sm text-white/75">{collection.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Experience grid */}
      <section id="experiences" className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-20">
        <div className="glass-panel rounded-[36px] p-8 sm:p-12 space-y-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-accentGlow text-sm uppercase tracking-[0.4em] mb-3">Experience</p>
              <h2 className="text-3xl sm:text-4xl font-display">Boutique service, reimagined for modern explorers</h2>
              <p className="max-w-3xl mt-3 text-white/70">
                From pre-arrival scent menus to curated record selections and chef-led story dining, Phoenix Booking layers thoughtful details into every itinerary.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {experienceHighlights.map((highlight) => (
              <div key={highlight.title} className="flex flex-col h-full p-6 border rounded-3xl border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <highlight.icon className="w-6 h-6 text-brand-300" />
                  <h3 className="text-xl font-semibold">{highlight.title}</h3>
                </div>
                <p className="flex-1 mt-4 text-sm text-white/70">{highlight.copy}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {highlight.chips.map((chip) => (
                    <span key={chip} className="px-3 py-1 text-xs border rounded-full bg-white/10 border-white/10">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid max-w-6xl gap-6 mx-auto md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="glass-panel rounded-[32px] p-8 flex flex-col space-y-4">
              <Compass className="w-6 h-6 text-accentGlow" />
              <p className="text-lg leading-relaxed text-white/90">“{testimonial.quote}”</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-white/70">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Destinations */}
      <section id="fresh-drops" className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-accentGlow text-xs uppercase tracking-[0.35em] mb-2">Fresh drops</p>
            <h2 className="text-3xl font-display">New stays from our host collective</h2>
            <p className="mt-2 text-white/70">Handpicked rentals and boutique hotels added this week.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2 text-sm border rounded-full border-white/20">
            <Sparkles className="w-4 h-4" />
            Become a host
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-white/60">Loading curated stays…</div>
        ) : isError ? (
          <div className="py-8 space-y-4 text-center">
            <p className="text-white/70">
              We couldn’t reach the hotel catalog ({(error as Error)?.message || "network error"}).
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-full border-white/30 text-white hover:border-white/60"
            >
              Retry fetch
            </button>
            <p className="text-xs text-white/50">
              Tip: ensure `docker compose up mongo redis` (or the API gateway) is running locally.
            </p>
          </div>
        ) : destinations.length === 0 ? (
          <div className="py-8 text-center text-white/60">
            No hotels found yet. Add one from My Hotels or seed the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((hotel) => (
              <LatestDestinationCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
