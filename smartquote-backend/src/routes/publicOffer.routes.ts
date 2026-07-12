// smartquote_backend/src/routes/publicOffer.routes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { publicOfferController } from '../controllers/publicOffer.controller';
import { validate } from '../middleware/validate';
import { requireJson } from '../middleware/requireJson';
import {
    getPublicOfferSchema,
    viewPublicOfferSchema,
    acceptPublicOfferSchema,
    rejectPublicOfferSchema,
    commentPublicOfferSchema,
    selectionPublicOfferSchema,
} from '../validators/publicOffer.validator';

const router = Router();

const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Zbyt wiele żądań. Spróbuj ponownie za 15 minut.',
        },
    },
});

router.use(publicLimiter);

router.get('/:token', validate(getPublicOfferSchema), publicOfferController.getOffer);
router.post('/:token/view', requireJson, validate(viewPublicOfferSchema), publicOfferController.registerView);
router.post('/:token/accept', requireJson, validate(acceptPublicOfferSchema), publicOfferController.acceptOffer);
router.post('/:token/reject', requireJson, validate(rejectPublicOfferSchema), publicOfferController.rejectOffer);
router.post('/:token/comment', requireJson, validate(commentPublicOfferSchema), publicOfferController.addComment);
router.patch('/:token/selection', requireJson, validate(selectionPublicOfferSchema), publicOfferController.trackSelection);

export default router;
