import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();
const contactController = new ContactController();

router.post('/', contactController.identify.bind(contactController));

export default router; 