export const normalizeArrayParam = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    if (value.includes(",")) return value.split(",").map((v) => v.trim()).filter(Boolean);
    return [value.trim()].filter(Boolean);
  }
  return [];
};

export const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const AMENITY_SECTIONS = [
  "general",
  "room",
  "dining",
  "wellness",
  "business",
  "accessibility",
  "safety",
  "technology",
  "services",
] as const;

export const buildAmenitiesFilter = (values: string[]) => {
  if (!values.length) return [];
  return values.map((amenity) => ({
    $or: AMENITY_SECTIONS.map((section) => ({ [`amenitiesDetail.${section}`]: amenity })),
  }));
};
