import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { AmenityGroups, ContactInfo, FacilitySpace, HighlightInfo, LocationInfo, PolicyInfo } from "../models/hotel";

// Configure Cloudinary if env exists
const hasCloudinary = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const upload = multer({ storage: multer.memoryStorage() });

export const uploadToCloudinary = async (files: Express.Multer.File[]): Promise<string[]> => {
  if (!hasCloudinary || !files || files.length === 0) return [];
  const uploads = files.map(async (file) => {
    const b64 = file.buffer.toString("base64");
    const dataUri = `data:${file.mimetype};base64,${b64}`;
    const res = await cloudinary.uploader.upload(dataUri, { folder: "hotel-images" });
    return res.secure_url;
  });
  return Promise.all(uploads);
};

export const isEmpty = (value: unknown) => value === undefined || value === null || value === "";

export const normalizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

export const buildIndexedArrayExtractor = (key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}\\[(\\d+)\\]$`);
  return (body: any) => {
    const direct = normalizeArray(body?.[key]);
    if (direct.length) return direct;
    const indexed: { index: number; value: string }[] = [];
    Object.keys(body || {}).forEach((k) => {
      const match = k.match(regex);
      if (match) {
        indexed.push({ index: Number(match[1]), value: body[k] });
      }
    });
    return indexed.sort((a, b) => a.index - b.index).map((entry) => entry.value).filter(Boolean);
  };
};

export const extractImageUrls = buildIndexedArrayExtractor("imageUrls");
export const extractFacilities = buildIndexedArrayExtractor("facilities");
export const extractTags = buildIndexedArrayExtractor("tags");
export const extractTypes = buildIndexedArrayExtractor("type");

export const parseJSONField = <T>(value: unknown): T | undefined => {
  if (!value) return undefined;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const coerceNumber = (value: unknown, fallback?: number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const coerceBoolean = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (["true", "1", "yes", "on"].includes(lowered)) return true;
    if (["false", "0", "no", "off"].includes(lowered)) return false;
  }
  if (typeof value === "number") return value === 1;
  return fallback;
};

export const coerceString = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
};

export const buildContact = (body: any): ContactInfo | undefined => {
  const parsed = parseJSONField<ContactInfo>(body.contact) || {};
  type ContactScalarKey = Exclude<keyof ContactInfo, "socials">;
  const contact: ContactInfo = { ...parsed };
  const assign = (key: ContactScalarKey, ...sources: string[]) => {
    for (const source of sources) {
      const value = coerceString(body?.[source]);
      if (!isEmpty(value)) {
        contact[key] = value;
        break;
      }
    }
  };
  assign("email", "contactEmail", "contact.email");
  assign("phone", "contactPhone", "contact.phone");
  assign("website", "contactWebsite", "contact.website");
  assign("whatsapp", "contactWhatsapp", "contact.whatsapp");

  type SocialLinks = NonNullable<ContactInfo["socials"]>;
  const socialsInput = parseJSONField<ContactInfo["socials"]>(body.contactSocials);
  const socials: SocialLinks = { ...(contact.socials || {}), ...(socialsInput || {}) };
  const socialSourceMap: Array<{ key: keyof SocialLinks; sources: string[] }> = [
    { key: "facebook", sources: ["contact.facebook", "contactSocials.facebook"] },
    { key: "instagram", sources: ["contact.instagram", "contactSocials.instagram"] },
    { key: "twitter", sources: ["contact.twitter", "contactSocials.twitter"] },
    { key: "linkedin", sources: ["contact.linkedin", "contactSocials.linkedin"] },
  ];
  socialSourceMap.forEach(({ key, sources }) => {
    for (const source of sources) {
      const value = coerceString(body?.[source]);
      if (!isEmpty(value)) {
        socials[key] = value;
        break;
      }
    }
  });
  if (Object.keys(socials).length) contact.socials = socials;
  return Object.keys(contact).length ? contact : undefined;
};

export const buildLocation = (body: any): LocationInfo | undefined => {
  const parsed = parseJSONField<LocationInfo>(body.location) || {};
  const location: LocationInfo = { ...parsed };
  const assign = (key: keyof LocationInfo, ...sources: string[]) => {
    for (const source of sources) {
      const value = body?.[source];
      if (!isEmpty(value)) {
        if (key === "latitude" || key === "longitude") {
          const num = coerceNumber(value);
          if (num !== undefined) {
            location[key] = num;
            break;
          }
        } else {
          location[key] = value;
          break;
        }
      }
    }
  };
  assign("addressLine1", "location.addressLine1", "addressLine1");
  assign("addressLine2", "location.addressLine2", "addressLine2");
  assign("city", "location.city", "city");
  assign("state", "location.state", "state");
  assign("postalCode", "location.postalCode", "postalCode");
  assign("country", "location.country", "country");
  assign("landmark", "location.landmark", "landmark");
  assign("latitude", "location.latitude", "latitude");
  assign("longitude", "location.longitude", "longitude");
  return Object.keys(location).length ? location : undefined;
};

export const buildPolicies = (body: any): PolicyInfo | undefined => {
  const parsed = parseJSONField<PolicyInfo>(body.policies) || {};
  const policies: PolicyInfo = { ...parsed };
  const map: Array<[keyof PolicyInfo, string[]]> = [
    ["checkInFrom", ["policies.checkInFrom", "checkInFrom", "checkInTime"]],
    ["checkOutUntil", ["policies.checkOutUntil", "checkOutUntil", "checkOutTime"]],
    ["cancellationPolicy", ["policies.cancellationPolicy", "cancellationPolicy"]],
    ["petPolicy", ["policies.petPolicy", "petPolicy"]],
    ["smokingPolicy", ["policies.smokingPolicy", "smokingPolicy"]],
    ["childrenPolicy", ["policies.childrenPolicy", "childrenPolicy"]],
    ["damagePolicy", ["policies.damagePolicy", "damagePolicy"]],
  ];
  map.forEach(([key, sources]) => {
    for (const source of sources) {
      const value = coerceString(body?.[source]);
      if (!isEmpty(value)) {
        policies[key] = value;
        break;
      }
    }
  });
  return Object.keys(policies).length ? policies : undefined;
};

export const buildAmenities = (body: any): AmenityGroups | undefined => {
  const parsed = parseJSONField<AmenityGroups>(body.amenitiesDetail) || {};
  const details: AmenityGroups = { ...parsed };
  const sections = ["general", "room", "dining", "wellness", "business", "accessibility", "safety", "technology", "services"] as const;
  sections.forEach((section) => {
    const values = normalizeArray(body?.[`amenities.${section}`]);
    if (values.length) {
      details[section] = values;
    }
  });
  return Object.keys(details).length ? details : undefined;
};

export const buildHighlights = (body: any): HighlightInfo[] | undefined => {
  const parsed = parseJSONField<HighlightInfo[]>(body.highlights);
  if (Array.isArray(parsed) && parsed.length) return parsed;
  const titles = buildIndexedArrayExtractor("highlights")(body);
  if (!titles.length) return undefined;
  return titles.map((title) => ({ title }));
};

export const buildFacilitySpaces = (body: any): FacilitySpace[] | undefined => {
  const parsed = parseJSONField<FacilitySpace[]>(body.facilitySpaces);
  if (Array.isArray(parsed) && parsed.length) return parsed;
  return undefined;
};

export const buildHotelPayload = (body: any) => {
  const location = buildLocation(body);
  const contact = buildContact(body);
  const policies = buildPolicies(body);
  const amenitiesDetail = buildAmenities(body);
  const facilitySpaces = buildFacilitySpaces(body);
  const highlights = buildHighlights(body);
  const facilities = extractFacilities(body);
  const tags = extractTags(body);
  const type = extractTypes(body);

  const payload: any = {
    name: coerceString(body.name),
    description: coerceString(body.description),
    type: type.length ? type : normalizeArray(body.type),
    city: coerceString(body.city) || location?.city,
    country: coerceString(body.country) || location?.country,
    adultCount: coerceNumber(body.adultCount, 1) ?? 1,
    childCount: coerceNumber(body.childCount, 0) ?? 0,
    facilities,
    pricePerNight: coerceNumber(body.pricePerNight, 0) ?? 0,
    starRating: coerceNumber(body.starRating, 0) ?? 0,
    tags,
    heroImage: coerceString(body.heroImage),
    isFeatured: coerceBoolean(body.isFeatured, false),
    contact,
    policies,
    location,
    amenitiesDetail,
    facilitySpaces,
    highlights,
  };

  return payload;
};
