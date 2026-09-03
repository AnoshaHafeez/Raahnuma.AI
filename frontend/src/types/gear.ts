export interface GearVendor {
  id: string;
  name: string;
  location: string;
  rating: number;
}

export interface GearProduct {
  id: string;
  name: string;
  category: "Jacket" | "Poles" | "Tent" | "Kit" | "Layers" | "Power";
  vendor: GearVendor;
  rentPricePerDay: number;
  buyPrice: number;
  rating: number;
  imageColor: string;
  imageUrl: string;
  useTags: string[];
  destinationId: number;
  destinationName: string;
  recommendedFor?: string[];
  recommendationReason?: string;
}

export interface CartItem {
  product: GearProduct;
  mode: "rent" | "buy";
  quantity: number;
  rentalDays: number;
}
