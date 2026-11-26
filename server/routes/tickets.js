import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsQuery,
  commentSchema,
} from '../validators/schemas.js';
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/ticketController.js';
import { listComments, addComment } from '../controllers/commentController.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(listTicketsQuery, 'query'), listTickets);
router.post('/', validate(createTicketSchema), createTicket);
router.get('/:id', getTicket);
router.patch('/:id', validate(updateTicketSchema), updateTicket);
router.delete('/:id', deleteTicket);

router.get('/:id/comments', listComments);
router.post('/:id/comments', validate(commentSchema), addComment);

export default router;
