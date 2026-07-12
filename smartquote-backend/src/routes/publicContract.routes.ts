// smartquote_backend/src/routes/publicContract.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { publicContractController } from '../controllers/publicContract.controller';
import { validate } from '../middleware/validate';
import { requireJson } from '../middleware/requireJson';
import { z } from 'zod';

const tokenSchema = z.object({
    params: z.object({
        token: z.string().min(1, 'Token jest wymagany'),
    }),
});

const signContractSchema = z.object({
    params: z.object({
        token: z.string().min(1, 'Token jest wymagany'),
    }),
    body: z.object({
        signerName: z.string().min(2, 'Imię i nazwisko musi mieć minimum 2 znaki'),
        signerEmail: z.string().email('Podaj prawidłowy adres email'),
        signatureImage: z.string()
            .max(2 * 1024 * 1024, 'Podpis jest za duży')
            .refine(
                (val) => val.startsWith('data:image/'),
                'Nieprawidłowy format podpisu'
            ),
    }),
});

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

router.get('/:token', validate(tokenSchema), publicContractController.getContract);
router.get('/:token/pdf', validate(tokenSchema), publicContractController.downloadPdf);
router.post('/:token/sign', requireJson, validate(signContractSchema), publicContractController.signContract);

export default router;
