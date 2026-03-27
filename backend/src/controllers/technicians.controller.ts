import { Request, Response, NextFunction } from 'express';
import * as techService from '../services/technicians.service';
import { sendSuccess, sendCreated } from '../utils/response';

export async function listTechnicians(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Admin-only listing: supports optional `county` filter (used by the UI dropdown).
    const technicians = await techService.listTechnicians(req.query.county as string);
    sendSuccess(res, technicians);
  } catch (err) {
    next(err);
  }
}

export async function getTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Admin-only profile fetch.
    const technician = await techService.getTechnicianById(req.params.id);
    sendSuccess(res, technician);
  } catch (err) {
    next(err);
  }
}

export async function createTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Creates:
    // 1) a user (role='technician') via auth service
    // 2) a technician profile row linked by `user_id`
    const technician = await techService.createTechnician(req.body);
    sendCreated(res, technician, 'Technician registered successfully.');
  } catch (err) {
    next(err);
  }
}

export async function deleteTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Deleting the technician's profile also deletes their user account.
    await techService.deleteTechnician(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
