/**
 * LeadPilot AI - Legacy Lead Migration Script
 *
 * Migrates legacy un-namespaced leads from top-level '/leads'
 * into a specific company's subcollection '/companies/{workspaceId}/leads'.
 *
 * Requirements:
 * - Safe & idempotent: skips leads that already exist in target workspace.
 * - Does NOT delete source data.
 * - Requires explicit --workspaceId argument (never guesses destination).
 * - Supports --dryRun flag for validation before actual writing.
 *
 * Usage:
 *   npx tsx scripts/migrate-legacy-leads.ts --workspaceId company_123
 *   npx tsx scripts/migrate-legacy-leads.ts --workspaceId company_123 --dryRun
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app =
  getApps().find((a) => a.name === '[DEFAULT]') ||
  initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT || 'webhook-507618' });

const db = getFirestore(app, 'webhook');

async function runMigration() {
  const args = process.argv.slice(2);
  let workspaceId = '';
  let isDryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspaceId' && args[i + 1]) {
      workspaceId = args[i + 1].trim();
      i++;
    } else if (args[i] === '--dryRun' || args[i] === '--dry-run') {
      isDryRun = true;
    }
  }

  if (!workspaceId) {
    console.error(`
===========================================================
Error: Destination workspace ID is required!
===========================================================
Usage:
  npx tsx scripts/migrate-legacy-leads.ts --workspaceId <company_workspaceId> [--dryRun]

Example:
  npx tsx scripts/migrate-legacy-leads.ts --workspaceId company_m3n4o5 --dryRun
`);
    process.exit(1);
  }

  console.log(`\nStarting legacy leads migration...`);
  console.log(`Target Workspace: ${workspaceId}`);
  console.log(`Execution Mode  : ${isDryRun ? 'DRY-RUN (Simulated)' : 'LIVE WRITE'}\n`);

  // 1. Verify target workspace exists
  const companySnap = await db.collection('companies').doc(workspaceId).get();
  if (!companySnap.exists) {
    console.error(`Error: Workspace '${workspaceId}' does not exist in Firestore /companies!`);
    console.error(`Please verify the ID or create the company workspace before migrating.`);
    process.exit(1);
  }

  const company = companySnap.data();
  console.log(`Target Organization: "${company?.name}" (Owner UID: ${company?.ownerUid})`);

  // 2. Query legacy leads from /leads
  const legacySnapshot = await db.collection('leads').get();
  const totalLegacy = legacySnapshot.size;
  console.log(`Found ${totalLegacy} total leads in legacy collection '/leads'.\n`);

  if (totalLegacy === 0) {
    console.log(`No legacy leads to migrate. Exiting.`);
    process.exit(0);
  }

  let migratedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  const targetLeadsCol = db.collection('companies').doc(workspaceId).collection('leads');

  for (const doc of legacySnapshot.docs) {
    const leadId = doc.id;
    const leadData = doc.data();

    // Check if target already has this lead (idempotency)
    const targetDoc = await targetLeadsCol.doc(leadId).get();
    if (targetDoc.exists) {
      skippedCount++;
      console.log(`[SKIP] Lead '${leadId}' already exists in target workspace.`);
      continue;
    }

    if (isDryRun) {
      migratedCount++;
      console.log(`[DRY-RUN] Would migrate lead '${leadId}' (${leadData.customer_name || 'Anonymous'}) -> /companies/${workspaceId}/leads/${leadId}`);
    } else {
      try {
        await targetLeadsCol.doc(leadId).set({
          ...leadData,
          id: leadId,
          workspaceId,
          migratedFrom: 'legacy_leads',
          migratedAt: new Date().toISOString(),
        });
        migratedCount++;
        console.log(`[MIGRATED] Successfully copied lead '${leadId}' (${leadData.customer_name || 'Anonymous'})`);
      } catch (err: any) {
        failedCount++;
        console.error(`[ERROR] Failed to migrate lead '${leadId}':`, err?.message || err);
      }
    }
  }

  console.log(`\n===========================================================`);
  console.log(`Migration Summary (${isDryRun ? 'DRY-RUN' : 'COMPLETED'}):`);
  console.log(`- Total Legacy Source Leads: ${totalLegacy}`);
  console.log(`- Migrated to Workspace    : ${migratedCount}`);
  console.log(`- Already Existed (Skipped): ${skippedCount}`);
  console.log(`- Failed Writes            : ${failedCount}`);
  console.log(`- Source Data Status       : PRESERVED (unmodified in /leads)`);
  console.log(`===========================================================\n`);
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
