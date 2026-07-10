/** Core domain types for the MUNA app */

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'admin';
  profilePic?: string;
}

export interface Shop {
  _id: string;
  name: string;
  image?: string;
  address?: string;
  category?: string | { _id: string; name: string };
  isOpen: boolean;
  rating?: number;
  distance?: number;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  deliverySettings?: DeliverySettings;
}

export interface DeliverySettings {
  minOrderAmount: number;
  minimumCharge: number;
  chargePerKm: number;
  maxRange: number;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  quantity?: string; // e.g. "1 Kg"
  image?: string;
  inStock: boolean;
  shopIsOpen?: boolean;
  category?: string | { _id: string; name: string };
  shopId?: string | Shop;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DeliveryLocation {
  address: string;
  lat: number;
  lng: number;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  _id?: string;
  productId?: Product | string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee?: number;
  shopId?: Shop | string;
  customerId?: User | string;
  deliveryLocation?: DeliveryLocation;
  instructions?: string;
  paymentMethod: string;
  distance?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Banner {
  _id: string;
  image: string;
  position?: 'top' | 'bottom';
  link?: string;
}

export interface ShopCategory {
  _id: string;
  name: string;
  image?: string;
  sortOrder?: number;
}

export interface SavedAddress {
  _id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ChatMessage {
  _id: string;
  content: string;
  sender: User | string;
  createdAt: string;
}

export interface ChatSession {
  _id: string;
  participants: User[];
  messages: ChatMessage[];
  item?: { title: string };
}
