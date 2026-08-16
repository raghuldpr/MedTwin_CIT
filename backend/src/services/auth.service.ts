import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, SafeUser } from '../models/User';
import { UserRole, isValidUserRole } from '../utils/roles';
import { config } from '../config/env.config';
import { AppError } from '../middleware/error.middleware';

export interface JwtTokenPayload {
  userId: string;
  role: UserRole;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole | string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

/**
 * Generate a signed JWT containing minimal non-sensitive user identity.
 */
export const generateAccessToken = (payload: JwtTokenPayload): string => {
  const secret = config.jwtSecret;
  if (!secret) {
    throw new AppError('JWT_SECRET is not configured on the server', 500);
  }

  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    secret,
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Verify a signed JWT token.
 */
export const verifyAccessToken = (token: string): JwtTokenPayload => {
  const secret = config.jwtSecret;
  if (!secret) {
    throw new AppError('JWT_SECRET is not configured on the server', 500);
  }

  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & JwtTokenPayload;
    if (!decoded || !decoded.userId || !decoded.role) {
      throw new AppError('Invalid token payload', 401);
    }
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired. Please log in again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AppError('Invalid authentication token.', 401);
    }
    throw new AppError('Authentication failed.', 401);
  }
};

/**
 * Register a new user with hashed password and initial role.
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const { name, email, password, role } = input;

  // Validation checks
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters long', 400);
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError('A valid email address is required', 400);
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Validate or assign role
  let assignedRole: UserRole = UserRole.PATIENT;
  if (role) {
    const normalizedRole = typeof role === 'string' ? role.toUpperCase() : role;
    if (!isValidUserRole(normalizedRole)) {
      throw new AppError(`Invalid role. Valid roles are: ${Object.values(UserRole).join(', ')}`, 400);
    }
    assignedRole = normalizedRole as UserRole;
  }

  // Check for existing user with same email (normalized to lowercase)
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError('An account with this email address already exists', 400);
  }

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create new user document
  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: assignedRole,
    isActive: true,
  });

  const safeUser = newUser.toSafeUser();
  const token = generateAccessToken({
    userId: safeUser.id,
    role: safeUser.role,
  });

  return {
    user: safeUser,
    token,
  };
};

/**
 * Authenticate existing user with email and password.
 */
export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const { email, password } = input;

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError('Please provide a valid email address', 400);
  }

  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find user and explicitly select passwordHash
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // Generic rejection without revealing user existence or specific reason
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account is currently deactivated. Please contact support.', 401);
  }

  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const safeUser = user.toSafeUser();
  const token = generateAccessToken({
    userId: safeUser.id,
    role: safeUser.role,
  });

  return {
    user: safeUser,
    token,
  };
};

/**
 * Retrieve safe profile for an authenticated user ID.
 */
export const getAuthenticatedUser = async (userId: string): Promise<SafeUser> => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError('User not found or account is inactive', 401);
  }
  return user.toSafeUser();
};
