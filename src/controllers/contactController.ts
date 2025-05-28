import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  async identify(req: Request, res: Response) {
    try {
      const { email, phoneNumber } = req.body;

      // Validate input
      if (!email && !phoneNumber) {
        return res.status(400).json({
          error: 'Either email or phoneNumber must be provided'
        });
      }

      const result = await this.contactService.identifyContact({ email, phoneNumber });
      return res.json(result);
    } catch (error) {
      console.error('Error in identify endpoint:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
} 