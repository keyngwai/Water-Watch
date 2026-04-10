import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { TECHNICIAN_JOB_ROLE_VALUES } from '../constants/technicianRoles';

// ---------------------------------------------------------------------------
// validate: Runs after express-validator chains; short-circuits if errors exist.
// ---------------------------------------------------------------------------
export function validate(req: Request, res: Response, next: NextFunction): void {
  // `express-validator` accumulates rule results on the request.
  // If anything fails, we short-circuit with a 422 response.
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Group errors by field for a developer-friendly response
    const grouped: Record<string, string[]> = {};
    for (const err of errors.array()) {
      const field = 'path' in err ? (err.path as string) : 'general';
      if (!grouped[field]) grouped[field] = [];
      grouped[field].push(err.msg as string);
    }

    res.status(422).json({
      success: false,
      error: 'Validation failed. Please check your input.',
      code: 'VALIDATION_ERROR',
      details: grouped,
    });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// Validation rule sets — reusable across routes
// ---------------------------------------------------------------------------

export const authValidation = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must include uppercase, lowercase, and a number'),
    body('full_name').trim().isLength({ min: 2, max: 255 }).withMessage('Full name is required'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('county').optional().trim().isLength({ max: 100 }),
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  createAdmin: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must include uppercase, lowercase, and a number'),
    body('full_name').trim().isLength({ min: 2, max: 255 }).withMessage('Full name is required'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('county').optional().trim().isLength({ min: 2, max: 100 }).withMessage('County must be 2–100 characters if provided'),
    body('is_root_admin').optional().isBoolean().withMessage('is_root_admin must be a boolean'),
  ],
};

export const reportValidation = {
  create: [
    body('category')
      .isIn(['broken_borehole','contaminated_water','illegal_connection','water_shortage','unfair_pricing','pipe_burst','no_water_supply','other'])
      .withMessage('Invalid issue category'),
    body('severity')
      .optional()
      .isIn(['low','medium','high','critical'])
      .withMessage('Invalid severity level'),
    body('title').trim().isLength({ min: 5, max: 255 }).withMessage('Title must be 5–255 characters'),
    body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be 20–5000 characters'),
    body('latitude')
      .isFloat({ min: -4.72, max: 5.02 })
      .withMessage('Latitude must be within Kenya bounds (-4.72 to 5.02)'),
    body('longitude')
      .isFloat({ min: 33.9, max: 41.9 })
      .withMessage('Longitude must be within Kenya bounds (33.9 to 41.9)'),
    body('county').trim().isLength({ min: 2, max: 100 }).withMessage('County is required'),
    body('location_name').optional().trim().isLength({ max: 255 }),
    body('sub_county').optional().trim().isLength({ max: 100 }),
    body('ward').optional().trim().isLength({ max: 100 }),
  ],

  list: [
    query('page').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
    query('status').optional({ checkFalsy: true }).isIn(['reported','verified','in_progress','resolved','rejected']),
    query('category').optional({ checkFalsy: true }).isIn(['broken_borehole','contaminated_water','illegal_connection','water_shortage','unfair_pricing','pipe_burst','no_water_supply','other']),
    query('county').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
    query('radius_km').optional({ checkFalsy: true }).isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be 0.1–100 km'),
    query('lat').optional({ checkFalsy: true }).isFloat({ min: -4.72, max: 5.02 }),
    query('lng').optional({ checkFalsy: true }).isFloat({ min: 33.9, max: 41.9 }),
  ],

  updateStatus: [
    param('id').isUUID().withMessage('Invalid report ID'),
    body('status')
      .isIn(['verified','in_progress','resolved','rejected'])
      .withMessage('Invalid status transition'),
    body('comment').optional().trim().isLength({ max: 2000 }),
    body('is_public').optional().isBoolean(),
    body('technician_id').optional().isUUID(),
    body('estimated_resolution_date').optional().isISO8601(),
  ],

  assignTechnician: [
    // Required payload for `PATCH /api/reports/:id/assign`.
    param('id').isUUID().withMessage('Invalid report ID'),
    body('technician_id').isUUID().withMessage('Valid technician ID is required'),
    body('comment').optional().trim().isLength({ max: 2000 }),
    body('is_public').optional().isBoolean(),
  ],
};

export const technicianValidation = {
  // Used by `POST /api/technicians` to create both the technician user and profile.
  create: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must include uppercase, lowercase, and a number'),
    body('full_name').trim().isLength({ min: 2, max: 255 }).withMessage('Full name is required'),
    body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
    body('employee_id').trim().isLength({ min: 2, max: 50 }).withMessage('Employee ID is required'),
    body('job_role').optional({ checkFalsy: true }).isIn(TECHNICIAN_JOB_ROLE_VALUES).withMessage('Invalid job role'),
    body('department').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
    body('specialization').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
    body('county').trim().isLength({ min: 2, max: 100 }).withMessage('County is required'),
  ],
};
