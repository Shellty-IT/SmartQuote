// smartquote_backend/src/routes/publicOffer.routes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { publicOfferController } from '../controllers/publicOffer.controller';
import { validate } from '../middleware/validate';
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
router.post('/:token/view', validate(viewPublicOfferSchema), publicOfferController.registerView);
router.post('/:token/accept', validate(acceptPublicOfferSchema), publicOfferController.acceptOffer);
router.post('/:token/reject', validate(rejectPublicOfferSchema), publicOfferController.rejectOffer);
router.post('/:token/comment', validate(commentPublicOfferSchema), publicOfferController.addComment);
router.patch('/:token/selection', validate(selectionPublicOfferSchema), publicOfferController.trackSelection);

export default router;