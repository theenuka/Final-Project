import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import BrandLogo from "./BrandLogo";

const socialLinks = [
  { id: "facebook", Icon: Facebook, href: "https://facebook.com/phoenix-booking" },
  { id: "twitter", Icon: Twitter, href: "https://twitter.com/phoenix-booking" },
  { id: "instagram", Icon: Instagram, href: "https://instagram.com/phoenix-booking" },
  { id: "linkedin", Icon: Linkedin, href: "https://linkedin.com/company/phoenix-booking" },
];

const Footer = () => {
  return (
    <footer className="mt-auto bg-dark/50 border-t border-neon-pink/10 text-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div className="space-y-5">
            <BrandLogo interactive={false} />
            <p className="text-medium-gray max-w-lg">
              Boutique stays, crafted experiences, and a concierge-inspired platform. We pair intentional design with tech that anticipates what you need before wheels up.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ id, Icon, href }) => (
                <a key={id} href={href} className="p-2 border border-white/20 rounded-full hover:border-neon-teal hover:text-neon-teal transition-colors" aria-label={id} target="_blank" rel="noreferrer">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-medium-gray mb-4">
              Stay inspired
            </h3>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full rounded-lg border border-white/20 bg-dark px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neon-pink/50 text-light-gray"
              />
              <button type="submit" className="w-full rounded-lg bg-neon-pink text-white font-semibold py-3 hover:bg-neon-pink/80 transition-colors">
                Join the travel letter
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-[0.3em] text-medium-gray">
              Concierge desk
            </h3>
            <div className="space-y-3 text-light-gray">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-neon-teal" />
                support@phoenixbooking.com
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-neon-teal" />
                +1 (415) 555-0199
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-neon-teal" />
                205 Mercer Street, NYC
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between text-sm text-medium-gray gap-4">
          <p>© {new Date().getFullYear()} Phoenix Booking. Crafted for modern travelers.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Cookies</a>
            <a href="#" className="hover:text-white">Press</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
