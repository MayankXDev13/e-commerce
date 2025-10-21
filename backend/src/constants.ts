export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 60 * 60, // 1 hour in seconds
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days in seconds
} as const;

export const TOKEN_SECRETS = {
  ACCESS_TOKEN: process.env.ACCESS_TOKEN_SECRET!,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN_SECRET!,
} as const;

export const MAXIMUM_SUB_IMAGE_COUNT = 5;

export const UserRolesEnum = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);
