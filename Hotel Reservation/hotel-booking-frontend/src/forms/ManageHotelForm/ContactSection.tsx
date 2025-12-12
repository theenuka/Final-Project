import { Phone, Mail, Globe } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Input } from "../../components/ui/input";
import { HotelFormData } from "./ManageHotelForm";

const ContactSection = () => {
  const { register } = useFormContext<HotelFormData>();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-400">
          05 · Contact
        </p>
        <h2 className="text-3xl font-semibold text-white">Guest support touchpoints</h2>
        <p className="text-base text-gray-400">
          These details appear on booking confirmations so travelers know how to reach you.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300">
          <span className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-brand-400" /> Phone
          </span>
          <Input
            type="text"
            placeholder="+44 20 1234 5678"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
            {...register("contact.phone")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300">
          <span className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-brand-400" /> Email
          </span>
          <Input
            type="email"
            placeholder="hello@aurorastay.com"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
            {...register("contact.email")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-300">
          <span className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-brand-400" /> Website
          </span>
          <Input
            type="url"
            placeholder="https://aurorastay.com"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-base text-white placeholder:text-gray-500 focus:border-brand-500/50"
            {...register("contact.website")}
          />
        </label>
      </div>
    </section>
  );
};

export default ContactSection;
