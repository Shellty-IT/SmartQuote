// src/routes/search.routes.ts
import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { searchSchema } from '../validators/search.validator';

const router = Router();

router.get('/', authenticate, validate(searchSchema), searchController.search);

export default router;
