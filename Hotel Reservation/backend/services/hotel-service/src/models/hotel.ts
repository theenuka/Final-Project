import mongoose, { Document } from "mongoose";

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface LocationInfo {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
}

export interface PolicyInfo {
  checkInFrom?: string;
  checkOutUntil?: string;
  cancellationPolicy?: string;
  petPolicy?: string;
  smokingPolicy?: string;
  childrenPolicy?: string;
  damagePolicy?: string;
}

export interface AmenityGroups {
  general?: string[];
  room?: string[];
  dining?: string[];
  wellness?: string[];
  business?: string[];
  accessibility?: string[];
  safety?: string[];
  technology?: string[];
  services?: string[];
}

export interface FacilitySpace {
  name: string;
  type: string;
  description?: string;
  capacity?: number;
  areaSqFt?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  currency?: string;
  amenities?: string[];
  bookingRules?: string[];
  isAvailable?: boolean;
  lastMaintainedAt?: Date;
  images?: string[];
}

export interface HighlightInfo {
  title: string;
  description?: string;
  icon?: string;
}

export interface IHotel extends Document {
  _id: string;
  userId: string;
  name: string;
  description: string;
  type: string[];
  city?: string;
  country?: string;
  location?: LocationInfo;
  contact?: ContactInfo;
  policies?: PolicyInfo;
  amenitiesDetail?: AmenityGroups;
  facilities: string[];
  facilitySpaces?: FacilitySpace[];
  highlights?: HighlightInfo[];
  tags?: string[];
  heroImage?: string;
  isFeatured?: boolean;
  ratingSummary?: {
    average?: number;
    totalReviews?: number;
  };
  starRating: number;
  roomTypes: mongoose.Types.ObjectId[];
  imageUrls: string[];
  lastUpdated: Date;
  totalBookings?: number;
  totalRevenue?: number;
  minPricePerNight?: number;
}

const nestedOptions = { _id: false, id: false } as const;

const socialsSchema = new mongoose.Schema(
  {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
  },
  nestedOptions
);

const contactSchema = new mongoose.Schema(
  {
    email: String,
    phone: String,
    website: String,
    whatsapp: String,
    socials: { type: socialsSchema, default: undefined },
  },
  nestedOptions
);

const locationSchema = new mongoose.Schema(
  {
    addressLine1: String,
    addressLine2: String,
    city: { type: String, index: true },
    state: String,
    postalCode: String,
    country: { type: String, index: true },
    latitude: Number,
    longitude: Number,
    landmark: String,
  },
  nestedOptions
);

const policiesSchema = new mongoose.Schema(
  {
    checkInFrom: String,
    checkOutUntil: String,
    cancellationPolicy: String,
    petPolicy: String,
    smokingPolicy: String,
    childrenPolicy: String,
    damagePolicy: String,
  },
  nestedOptions
);

const amenityGroupsSchema = new mongoose.Schema(
  {
    general: [{ type: String }],
    room: [{ type: String }],
    dining: [{ type: String }],
    wellness: [{ type: String }],
    business: [{ type: String }],
    accessibility: [{ type: String }],
    safety: [{ type: String }],
    technology: [{ type: String }],
    services: [{ type: String }],
  },
  nestedOptions
);

const facilitySpaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: String,
    capacity: Number,
    areaSqFt: Number,
    pricePerHour: Number,
    pricePerDay: Number,
    currency: { type: String, default: "USD" },
    amenities: [{ type: String }],
    bookingRules: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    lastMaintainedAt: Date,
    images: [{ type: String }],
  },
  nestedOptions
);

const highlightSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    icon: String,
  },
  nestedOptions
);

const ratingSummarySchema = new mongoose.Schema(
  {
    average: Number,
    totalReviews: Number,
  },
  nestedOptions
);

const hotelSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: [{ type: String }],
    city: { type: String, index: true },
    country: { type: String, index: true },
    location: { type: locationSchema, default: undefined },
    contact: { type: contactSchema, default: undefined },
    policies: { type: policiesSchema, default: undefined },
    amenitiesDetail: { type: amenityGroupsSchema, default: undefined },
    facilities: [{ type: String }],
    facilitySpaces: { type: [facilitySpaceSchema], default: undefined },
    highlights: { type: [highlightSchema], default: undefined },
    tags: [{ type: String }],
    heroImage: { type: String },
    isFeatured: { type: Boolean, default: false, index: true },
    ratingSummary: { type: ratingSummarySchema, default: undefined },
    starRating: { type: Number, required: true, index: true },
    roomTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: "RoomType" }],
    imageUrls: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now, index: true },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    minPricePerNight: { type: Number, index: true },
  },
  { timestamps: true }
);

hotelSchema.index({ "location.city": 1, "location.country": 1, starRating: -1 });

export default mongoose.model<IHotel>("Hotel", hotelSchema);
