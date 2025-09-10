export enum AddressType {
  Home = 'home',
  Office = 'office',
  Other = 'other',
}

export interface Address {
  id: string;
  customerId: string;
  type: AddressType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressCreateRequest {
  type: 'shipping' | 'billing' | 'both';
  label?: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  postalCode: string;
  street: string;
  building?: string;
  floor?: string;
  room?: string;
  deliveryInstructions?: string;
  accessCode?: string;
  isDefault?: boolean;
}

export interface AddressUpdateRequest extends Partial<AddressCreateRequest> {}