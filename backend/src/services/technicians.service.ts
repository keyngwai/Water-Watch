import { query, queryOne } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { TechnicianRow } from '../types';
import { createAdminUser } from './auth.service';

export interface CreateTechnicianInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  employee_id: string;
  department?: string;
  specialization?: string;
  county: string;
}

export async function createTechnician(input: CreateTechnicianInput): Promise<Record<string, unknown>> {
  const user = await createAdminUser({
    email: input.email,
    password: input.password,
    full_name: input.full_name,
    phone: input.phone,
    county: input.county,
    role: 'technician',
  });

  const rows = await query<TechnicianRow>(`
    INSERT INTO technicians (user_id, employee_id, department, specialization, county)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [user.id, input.employee_id, input.department ?? null, input.specialization ?? null, input.county]);

  return { ...user, technician: rows[0] };
}

export async function listTechnicians(county?: string): Promise<Record<string, unknown>[]> {
  const countyFilter = county ? 'WHERE t.county ILIKE $1' : '';
  const params = county ? [`%${county}%`] : [];

  return query<Record<string, unknown>>(`
    SELECT t.id, t.employee_id, t.department, t.specialization, t.county, t.is_available,
           u.full_name, u.email, u.phone,
           COUNT(r.id) FILTER (WHERE r.status = 'in_progress') as active_assignments
    FROM technicians t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN reports r ON r.assigned_to = t.id
    ${countyFilter}
    GROUP BY t.id, u.full_name, u.email, u.phone
    ORDER BY u.full_name
  `, params);
}

export async function getTechnicianById(id: string): Promise<Record<string, unknown>> {
  const result = await queryOne<Record<string, unknown>>(`
    SELECT t.*, u.full_name, u.email, u.phone
    FROM technicians t JOIN users u ON u.id = t.user_id
    WHERE t.id = $1
  `, [id]);

  if (!result) throw new AppError('Technician not found.', 404);
  return result;
}

/**
 * Delete a technician and their user account.
 * Reports assigned to this technician will have assigned_to set to NULL (DB ON DELETE SET NULL).
 */
export async function deleteTechnician(id: string): Promise<void> {
  const technician = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM technicians WHERE id = $1',
    [id]
  );
  if (!technician) throw new AppError('Technician not found.', 404);

  await query('DELETE FROM technicians WHERE id = $1', [id]);
  await query('DELETE FROM users WHERE id = $1', [technician.user_id]);
}
