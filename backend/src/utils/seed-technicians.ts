/**
 * seed-technicians.ts
 * ────────────────────
 * One-time script to bootstrap technician accounts.
 * Run with: npx ts-node src/utils/seed-technicians.ts
 */
import 'dotenv/config';
import { createTechnician } from '../services/technicians.service';
import { query } from '../config/database';
import { logger } from './logger';

const technicians = [
  {
    email: 'sally.munga@nairobi.go.ke',
    password: 'TechPass123',
    full_name: 'Sally Munga',
    phone: '+254712345679',
    employee_id: 'WB-NAIROBI-002',
    department: 'Borehole & Well Services',
    specialization: 'Borehole Drilling & Repair',
    county: 'Nairobi',
  },
  {
    email: 'ephy.kimotho@nakuru.go.ke',
    password: 'TechPass123',
    full_name: 'Ephy Kimotho',
    phone: '+254723456780',
    employee_id: 'WB-NAKURU-002',
    department: 'Water Quality Testing',
    specialization: 'Water Quality Analysis',
    county: 'Nakuru',
  },
  {
    email: 'simon.macharia@kiambu.go.ke',
    password: 'TechPass123',
    full_name: 'Simon Macharia',
    phone: '+254734567891',
    employee_id: 'WB-KIAMBU-002',
    department: 'Pipeline Maintenance',
    specialization: 'Pipe Repair & Maintenance',
    county: 'Kiambu',
  },
];

async function main() {
  console.log('🌱 Seeding technicians...\n');

  for (const tech of technicians) {
    try {
      const result = await createTechnician(tech);
      logger.info('Technician account created successfully', {
        id: result.id,
        email: result.email,
        employee_id: tech.employee_id,
        county: tech.county,
      });

      console.log(`✅ Created: ${result.full_name} (${tech.employee_id}) - ${tech.county}`);
    } catch (err) {
      if ((err as { code?: string }).code === 'EMAIL_TAKEN') {
        // Try to update the existing user
        try {
          await query('UPDATE users SET full_name = $1 WHERE email = $2', [tech.full_name, tech.email]);
          console.log(`✅ Updated: ${tech.full_name} (${tech.email})`);
        } catch (updateErr) {
          console.log(`⚠️  Skipped: ${tech.full_name} - Email exists and update failed`);
        }
      } else {
        console.error(`❌ Failed: ${tech.full_name} - ${(err as Error).message}`);
      }
    }
  }

  console.log('\n🎉 Technician seeding complete!');
  console.log('Default password for all: TechPass123');
  console.log('⚠️  Change passwords immediately after first login!\n');
}

main().catch((err) => {
  logger.error('Seeding failed', { error: err.message });
  process.exit(1);
});