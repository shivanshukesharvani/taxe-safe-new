/**
 * Optional rate limiting middleware
 * Simple in-memory rate limiter (for MVP)
 * For production, consider using Redis-based rate limiting
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Rate limit configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum 100 requests per window

/**
 * Simple rate limiting middleware
 * Limits requests per IP address
 * 
 * Note: This is a basic in-memory implementation suitable for MVP.
 * For production, use a proper rate limiting library like express-rate-limit
 * with Redis backend for distributed systems.
 */
export const rateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Clean up expired entries (simple cleanup)
  if (Object.keys(store).length > 1000) {
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }

  // Check if IP exists in store
  if (!store[ip] || store[ip].resetTime < now) {
    // Reset or create new entry
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
    return next();
  }

  // Increment count
  store[ip].count++;

  // Check if limit exceeded
  if (store[ip].count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((store[ip].resetTime - now) / 1000)
    });
  }

  next();
};

