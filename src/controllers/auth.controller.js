// src/controllers/auth.controller.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { username, displayName, email, password, role } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) throw new ApiError(400, 'Email or username already exists');

    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        email,
        password: hashedPassword,
        role: role || 'USER',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, token },
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) throw new ApiError(401, 'Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
        },
        token,
      },
    });
  }),

  getProfile: asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!user) throw new ApiError(404, 'User not found');

    res.json({
      success: true,
      data: { user },
    });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { displayName, walletAddress } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(displayName && { displayName }),
        ...(walletAddress && { walletAddress }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        walletAddress: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  }),

  connectWallet: asyncHandler(async (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) throw new ApiError(400, 'Wallet address is required');

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { walletAddress },
      select: {
        id: true,
        username: true,
        email: true,
        walletAddress: true,
      },
    });

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      data: { user },
    });
  }),
};
