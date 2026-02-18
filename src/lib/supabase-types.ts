// Convenience types for the app
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'blocked' | 'suspended';
export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial';
export type ListingType = 'shitje' | 'qira';
export type PropertyStatus = 'draft' | 'active' | 'blocked' | 'sold' | 'rented' | 'archived';
export type TransactionStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ExtraType = 'featured' | 'boost' | 'urgent';
export type AdStatus = 'pending' | 'active' | 'expired' | 'rejected';
export type MediaType = 'image' | 'video';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  credits_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  city: string;
  address: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  images: string[];
  status: PropertyStatus;
  expires_at: string | null;
  is_featured: boolean;
  featured_until: string | null;
  is_urgent: boolean;
  urgent_until: string | null;
  last_boosted_at: string | null;
  views_count: number;
  contacts_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits_amount: number;
  price_eur: number;
  is_active: boolean;
}

export interface ExtraPackage {
  id: string;
  type: ExtraType;
  duration_days: number;
  price_eur: number;
  name: string;
  is_active: boolean;
}

export interface AdPosition {
  id: string;
  name: string;
  display_name: string;
  price_month_eur: number;
  is_active: boolean;
}

export interface Ad {
  id: string;
  advertiser_name: string;
  advertiser_email: string;
  title: string;
  media_type: MediaType;
  media_url: string | null;
  link_url: string | null;
  position_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: AdStatus;
  amount_paid: number | null;
  created_at: string;
}

export type Country = 'kosovo' | 'albania';

export const CITIES_BY_COUNTRY: Record<Country, string[]> = {
  kosovo: [
    'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Mitrovicë',
    'Ferizaj', 'Gjilan', 'Vushtrri', 'Lipjan', 'Suharekë',
    'Rahovec', 'Malishevë', 'Skënderaj', 'Istog', 'Klinë',
    'Drenas', 'Shtime', 'Kaçanik', 'Shtërpcë', 'Novobërdë',
  ],
  albania: [
    'Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan',
    'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë',
    'Sarandë', 'Gjirokastër', 'Pogradec', 'Lezhë',
  ],
};

export const CITIES = [...CITIES_BY_COUNTRY.kosovo, ...CITIES_BY_COUNTRY.albania];

export const COUNTRY_LABELS: Record<Country, string> = {
  kosovo: '🇽🇰 Kosovë',
  albania: '🇦🇱 Shqipëri',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Banesë',
  house: 'Shtëpi',
  land: 'Tokë',
  commercial: 'Lokal/Komercial'
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  shitje: 'Shitje',
  qira: 'Me Qira'
};
