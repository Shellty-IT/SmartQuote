// src/routes/notes.routes.ts
import { Router } from 'express';
import { notesController } from '../controllers/notes.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
    createNoteSchema,
    updateNoteSchema,
    getNoteSchema,
    listNotesSchema,
} from '../validators/notes.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotesSchema), notesController.findByEntity.bind(notesController));
router.post('/', validate(createNoteSchema), notesController.create.bind(notesController));
router.patch('/:id', validate(updateNoteSchema), notesController.update.bind(notesController));
router.delete('/:id', validate(getNoteSchema), notesController.delete.bind(notesController));

export default router;
