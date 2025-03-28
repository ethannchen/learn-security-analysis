import { Response } from 'express';
import Author from '../models/author';
import express from 'express';

const router = express.Router();

/**
 * @route GET /authors
 * @group Author
 * @returns an array of all authors sorted by family name
 * @returns an error message if no authors were found 
 * or if there was an error processing the request
 */
router.get('/', async (_, res: Response) => {
  try {
    const data: string[] = await Author.getAllAuthors({ family_name: 1 });
    if (data.length > 0) {
      res.send(data);
    } else {
      res.send('No authors found');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error processing request');
  }
});

export default router;
