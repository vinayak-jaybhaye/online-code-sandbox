import { Router, type Router as RouterType } from 'express';
import {
  createExecution,
  getExecution,
  cancelExecution,
  ValidationError,
} from '../services/executionService.js';

/**
 * Execution route handlers — thin HTTP adapters.
 * All business logic is in executionService.ts.
 */
export const executionsRouter: RouterType = Router();

/** POST /api/executions — submit code for execution. */
executionsRouter.post('/', async (req, res, next) => {
  try {
    const result = await createExecution(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    next(err);
  }
});

/** GET /api/executions/:executionId — poll execution state. */
executionsRouter.get('/:executionId', async (req, res, next) => {
  try {
    const state = await getExecution(req.params.executionId);
    if (!state) {
      res.status(404).json({ error: 'Execution not found or expired.' });
      return;
    }
    res.json(state);
  } catch (err) {
    next(err);
  }
});

/** POST /api/executions/:executionId/cancel — request cancellation. */
executionsRouter.post('/:executionId/cancel', async (req, res, next) => {
  try {
    const result = await cancelExecution(req.params.executionId);
    if (!result.success) {
      const status = result.reason === 'NOT_FOUND' ? 404 : 409;
      res.status(status).json({
        error:
          result.reason === 'NOT_FOUND' ? 'Execution not found.' : 'Execution already finished.',
        currentStatus: result.reason === 'ALREADY_TERMINAL' ? result.currentStatus : undefined,
      });
      return;
    }
    res.json({ message: 'Execution cancelled.' });
  } catch (err) {
    next(err);
  }
});
