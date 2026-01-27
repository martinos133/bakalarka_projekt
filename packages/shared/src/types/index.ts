export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum AdvertisementStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
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
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  price?: number;
  status: AdvertisementStatus;
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
  category?: string;
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
