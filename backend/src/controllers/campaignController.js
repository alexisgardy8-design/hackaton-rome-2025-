import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();

/**
 * Validation rules for campaign creation
 */
export const createCampaignValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('goalAmount')
    .isFloat({ min: 100 })
    .withMessage('Goal amount must be at least 100'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      const start = new Date(req.body.startDate);
      const end = new Date(endDate);
      if (end <= start) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid')
];

/**
 * Create a new campaign
 * POST /api/campaigns
 * @access Private (STARTUP only)
 */
export const createCampaign = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    // Check if user is a startup
    if (req.user.role !== 'STARTUP') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only startups can create campaigns'
      });
    }

    const { title, description, goalAmount, startDate, endDate, imageUrl } = req.body;

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        goalAmount: parseFloat(goalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrl,
        status: 'DRAFT',
        creatorId: req.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all campaigns
 * GET /api/campaigns
 * @access Public
 */
export const getAllCampaigns = async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    // Build filter
    const where = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            investments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count
    const total = await prisma.campaign.count({ where });

    res.json({
      campaigns,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + campaigns.length < total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get campaign by ID
 * GET /api/campaigns/:id
 * @access Public
 */
export const getCampaignById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true
          }
        },
        investments: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
            investor: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            investments: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    res.json({ campaign });
  } catch (error) {
    next(error);
  }
};

/**
 * Update campaign
 * PUT /api/campaigns/:id
 * @access Private (Campaign creator only)
 */
export const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, goalAmount, startDate, endDate, imageUrl, status } = req.body;

    // Find campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.creatorId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own campaigns'
      });
    }

    // Update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(goalAmount && { goalAmount: parseFloat(goalAmount) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(imageUrl && { imageUrl }),
        ...(status && { status })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete campaign
 * DELETE /api/campaigns/:id
 * @access Private (Campaign creator only)
 */
export const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            investments: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    // Check ownership
    if (campaign.creatorId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own campaigns'
      });
    }

    // Don't allow deletion if there are investments
    if (campaign._count.investments > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete campaign with existing investments'
      });
    }

    await prisma.campaign.delete({
      where: { id }
    });

    res.json({
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
