# Backup & Recovery Plan

## Overview

Plan for protecting PostgreSQL data and recovering service after failure.

## Backup Frequency

- Daily full logical backup (`pg_dump`) retained 30 days.
- Hourly incremental/WAL backup (if managed provider supports PITR).
- Before every production migration, create on-demand backup snapshot.

## Recovery Objectives

- **RPO (data loss tolerance):** <= 1 hour.
- **RTO (service restore time):** <= 2 hours.

## Recovery Procedure

1. Confirm incident scope (data corruption, accidental delete, outage).
2. Put API in maintenance mode (stop write operations).
3. Restore latest known-good backup to staging database.
4. Run `npm --prefix backend run check:db` against restored DB.
5. Validate critical tables (`users`, `reports`, `admin_actions`, `password_resets`, `security_events`).
6. Switch API `DATABASE_URL` to restored DB.
7. Run smoke tests:
   - login flow
   - submit report
   - admin stats
   - password reset
8. Resume traffic and monitor logs for 30 minutes.

## Verification Drills

- Monthly restore drill in staging.
- Record:
  - restore duration
  - data consistency checks
  - issues and corrective actions
