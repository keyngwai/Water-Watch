import { Request, Response, NextFunction } from 'express';
import * as techService from '../services/technicians.service';
import { sendSuccess, sendCreated } from '../utils/response';

export async function listTechnicians(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const technicians = await techService.listTechnicians(req.query.county as string);
    sendSuccess(res, technicians);
  } catch (err) {
    next(err);
  }
}

export async function getTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const technician = await techService.getTechnicianById(req.params.id);
    sendSuccess(res, technician);
  } catch (err) {
    next(err);
  }
}

export async function createTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const technician = await techService.createTechnician(req.body);
    sendCreated(res, technician, 'Technician registered successfully.');
  } catch (err) {
    next(err);
  }
}

export async function deleteTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await techService.deleteTechnician(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
