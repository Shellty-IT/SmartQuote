// src/routes/leads.routes.ts
import { Router } from 'express';
import { leadsController } from '../controllers/leads.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
    createLeadSchema,
    updateLeadSchema,
    getLeadSchema,
    listLeadsSchema,
    convertLeadSchema,
} from '../validators/leads.validator';

const router = Router();

router.use(authenticate);

router.get('/stats', leadsController.getStats);
router.get('/', validate(listLeadsSchema), leadsController.findAll);
router.get('/:id', validate(getLeadSchema), leadsController.findById);
router.post('/', validate(createLeadSchema), leadsController.create);
router.patch('/:id', validate(updateLeadSchema), leadsController.update);
router.delete('/:id', validate(getLeadSchema), leadsController.delete);
router.post('/:id/convert', validate(convertLeadSchema), leadsController.convert);

export default router;
