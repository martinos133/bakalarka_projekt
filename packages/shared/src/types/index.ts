export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum AdvertisementStatus {
  PENDING = 'PENDING',
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum AdvertisementType {
  SERVICE = 'SERVICE',
  RENTAL = 'RENTAL',
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  isCompany: boolean;
  companyName?: string;
  companyId?: string;
  companyTaxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  role: UserRole;
  banned: boolean;
  bannedUntil?: Date;
  banReason?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    advertisements: number;
  };
}

export interface BanUserDto {
  banned: boolean;
  bannedUntil?: Date;
  banReason?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  price?: number;
  status: AdvertisementStatus;
  type: AdvertisementType;
  category?: string;
  location?: string;
  images: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdvertisementDto {
  title: string;
  description: string;
  price?: number;
  type?: AdvertisementType;
  categoryId?: string;
  location?: string;
  images?: string[];
}

export interface UpdateAdvertisementDto extends Partial<CreateAdvertisementDto> {
  status?: AdvertisementStatus;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    advertisements: number;
  };
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  isActive?: boolean;
}

export enum FilterType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  RANGE = 'RANGE',
}

export interface Filter {
  id: string;
  name: string;
  slug: string;
  type: FilterType;
  categoryId: string;
  description?: string;
  options: string[];
  isRequired: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

export interface CreateFilterDto {
  name: string;
  type: FilterType;
  categoryId: string;
  description?: string;
  options?: string[];
  isRequired?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface UpdateFilterDto extends Partial<CreateFilterDto> {
  isActive?: boolean;
  order?: number;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ReportReason {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  FAKE = 'FAKE',
  SCAM = 'SCAM',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export interface Report {
  id: string;
  advertisementId: string;
  reporterId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
  advertisement?: Advertisement;
  reporter?: User;
}

export interface CreateReportDto {
  advertisementId: string;
  reason: ReportReason;
  description?: string;
}

export interface ResolveReportDto {
  status: ReportStatus;
  resolutionNote?: string;
}

export interface Payment {
  id: string;
  advertisementId: string;
  renterId: string;
  ownerId: string;
  amount: number;
  status: PaymentStatus;
  paymentDate?: Date;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  advertisement?: Advertisement;
  renter?: User;
  owner?: User;
}

export interface UserStats {
  totalAdvertisements: number;
  activeAdvertisements: number;
  paymentsReceived: number;
  paymentsReceivedAmount: number;
  paymentsMade: number;
  paymentsMadeAmount: number;
  completedPaymentsReceived: number;
  completedPaymentsMade: number;
}
