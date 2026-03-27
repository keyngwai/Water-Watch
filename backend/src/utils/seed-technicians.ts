/**
 * seed-technicians.ts
 * ────────────────────
 * Seeds demo technicians: **3 roles per county** across all Kenyan counties (rotating job roles).
 *
 * Prerequisites: run `npm run migrate` (adds `technicians.job_role` from 002_technician_job_role.sql).
 *
 * Run: npm run seed:technicians
 * Default password for seeded accounts: TechPass123
 */
import 'dotenv/config';
import { createTechnician } from '../services/technicians.service';
import { query } from '../config/database';
import { logger } from './logger';
import { KENYAN_COUNTIES } from '../constants/kenyanCounties';
import {
  TECHNICIAN_ROLE_DEFINITIONS,
  SEED_TECHNICIANS_PER_COUNTY,
} from '../constants/technicianRoles';

const DEFAULT_PASSWORD = 'TechPass123';

interface SeedTechnicianRow {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  employee_id: string;
  job_role: string;
  department: string;
  specialization: string;
  county: string;
}

function buildSeedRows(): SeedTechnicianRow[] {
  const rows: SeedTechnicianRow[] = [];

  // Build deterministic demo data:
  // - For each county, create `SEED_TECHNICIANS_PER_COUNTY` technicians
  // - Rotate through the allowed `TECHNICIAN_ROLE_DEFINITIONS` so each county has variety
  for (let countyIndex = 0; countyIndex < KENYAN_COUNTIES.length; countyIndex++) {
    const county = KENYAN_COUNTIES[countyIndex];
    for (let slot = 0; slot < SEED_TECHNICIANS_PER_COUNTY; slot++) {
      const roleIndex =
        (countyIndex * SEED_TECHNICIANS_PER_COUNTY + slot) % TECHNICIAN_ROLE_DEFINITIONS.length;
      const def = TECHNICIAN_ROLE_DEFINITIONS[roleIndex];
      const employee_id = `MJW-${String(countyIndex + 1).padStart(3, '0')}-${String(slot + 1).padStart(2, '0')}`;
      const email = `tech.c${countyIndex}.${slot}@majiwatch.seed`;
      const phone = `+2547${String(10000000 + countyIndex * 10 + slot).slice(-8)}`;

      rows.push({
        email,
        password: DEFAULT_PASSWORD,
        full_name: `${county} — ${def.job_role}`,
        phone,
        employee_id,
        job_role: def.job_role,
        department: def.department,
        specialization: def.specialization,
        county,
      });
    }
  }

  return rows;
}

async function main() {
  const technicians = buildSeedRows();
  console.log(`🌱 Seeding ${technicians.length} technicians (${SEED_TECHNICIANS_PER_COUNTY} per county × ${KENYAN_COUNTIES.length} counties)...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const tech of technicians) {
    try {
      await createTechnician(tech);
      logger.info('Technician created', { email: tech.email, employee_id: tech.employee_id, county: tech.county });
      created++;
      if (created % 50 === 0) {
        console.log(`  … ${created} created`);
      }
    } catch (err) {
      if ((err as { code?: string }).code === 'EMAIL_TAKEN') {
        try {
          await query('UPDATE users SET full_name = $1 WHERE email = $2', [tech.full_name, tech.email]);
          skipped++;
        } catch {
          skipped++;
        }
      } else {
        console.error(`❌ ${tech.email}: ${(err as Error).message}`);
        failed++;
      }
    }
  }

  console.log('\n🎉 Technician seeding complete.');
  console.log(`   Created: ${created}  Skipped (existing email): ${skipped}  Failed: ${failed}`);
  console.log(`   Default password: ${DEFAULT_PASSWORD}`);
  console.log('   ⚠️  Change passwords after first login.\n');
}

main().catch((err) => {
  logger.error('Seeding failed', { error: (err as Error).message });
  process.exit(1);
});
