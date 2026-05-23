import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { AppError } from '../errors/AppError.js';

export const generateAccessToken = (payload) => {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpire,
  });
};

/** @deprecated use generateAccessToken */
export const generateToken = generateAccessToken;

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type && decoded.type !== 'access') {
      throw AppError.unauthorized('Invalid access token');
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized('Invalid or expired token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== 'refresh') {
      throw AppError.unauthorized('Invalid refresh token');
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
};

export const verifyToken = verifyAccessToken;

export const decodeToken = (token) => jwt.decode(token);
