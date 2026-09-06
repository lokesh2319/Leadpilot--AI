import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLeadPayload, validateNormalizedLead } from '../server/normalizer.js';
import { hashSecret } from '../server/integrations.js';
import { requireRole } from '../server/auth.js';
import { getLeadsCollection } from '../server/db.js';

describe('LeadPilot AI Multi-Tenant & Security Suite', () => {
  const BASE_URL = 'http://localhost:3000';

  describe('1. Public Health Check', () => {
    test('GET /api/health returns HTTP 200 and status ok', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
    });
  });

  describe('2. Authentication & Security Middleware', () => {
    test('Unauthenticated GET /api/leads returns HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/leads`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Unauthorized/i);
    });

    test('Invalid Bearer Token returns HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/leads`, {
        headers: {
          Authorization: 'Bearer invalid.fake.token.12345',
        },
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Invalid|Unauthorized/i);
    });

    test('Unauthenticated GET /api/me returns HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/me`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test('Unauthenticated GET /api/leads/intake/logs returns HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/leads/intake/logs`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });

  describe('3. Zoho CRM Webhook Security', () => {
    test('POST /api/leads/intake without x-leadpilot-secret returns HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/leads/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: 'Test Prospect',
          email: 'test@example.com',
          message: 'Interested in automation.',
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Missing 'x-leadpilot-secret'/i);
    });

    test('POST /api/leads/intake with invalid secret returns HTTP 401', async () => {
      const res = await fetch(`${BASE_URL}/api/leads/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-leadpilot-secret': 'lp_zoho_bogus_unauthorized_token_9999',
        },
        body: JSON.stringify({
          customer_name: 'Test Prospect',
          email: 'test@example.com',
          message: 'Interested in automation.',
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.error, /Invalid or revoked/i);
    });
  });

  describe('4. CRM Payload Normalization & Validation', () => {
    test('Normalizes native LeadPilot payload correctly', () => {
      const nativePayload = {
        customer_name: 'Sarah Connor',
        phone: '+1 555 0192',
        email: 'sarah@skynet-resistance.org',
        lead_source: 'Inbound Referral',
        product_service: 'Security Automation',
        budget: '75000',
        message: 'Looking to overhaul our lead management.',
      };

      const normalized = normalizeLeadPayload(nativePayload);
      assert.equal(normalized.customer_name, 'Sarah Connor');
      assert.equal(normalized.phone, '+1 555 0192');
      assert.equal(normalized.email, 'sarah@skynet-resistance.org');
      assert.equal(normalized.lead_source, 'Inbound Referral');
      assert.equal(normalized.product_service, 'Security Automation');
      assert.equal(normalized.budget, '75000');
      assert.equal(normalized.message, 'Looking to overhaul our lead management.');

      const val = validateNormalizedLead(normalized);
      assert.equal(val.valid, true);
    });

    test('Normalizes generic CRM payload (Zoho / HubSpot / Salesforce format)', () => {
      const crmPayload = {
        Full_Name: 'Vikram Malhotra',
        Phone: '9876543210',
        Email: 'vikram@enterprise.co',
        Lead_Source: 'Partner Network',
        Product: 'Enterprise CRM Suite',
        Annual_Revenue: '250000',
        Description: 'Need integration across 30 sales reps.',
      };

      const normalized = normalizeLeadPayload(crmPayload);
      assert.equal(normalized.customer_name, 'Vikram Malhotra');
      assert.equal(normalized.phone, '9876543210');
      assert.equal(normalized.email, 'vikram@enterprise.co');
      assert.equal(normalized.lead_source, 'Partner Network');
      assert.equal(normalized.product_service, 'Enterprise CRM Suite');
      assert.equal(normalized.budget, '250000');
      assert.equal(normalized.message, 'Need integration across 30 sales reps.');

      const val = validateNormalizedLead(normalized);
      assert.equal(val.valid, true);
    });

    test('Rejects missing customer name in validation', () => {
      const badPayload = {
        customer_name: '',
        email: 'test@example.com',
      };
      const normalized = normalizeLeadPayload(badPayload);
      const val = validateNormalizedLead(normalized);
      assert.equal(val.valid, false);
      assert.match(val.error || '', /customer_name/i);
    });

    test('Rejects invalid email syntax in validation', () => {
      const badPayload = {
        customer_name: 'John Doe',
        email: 'not-an-email',
      };
      const normalized = normalizeLeadPayload(badPayload);
      const val = validateNormalizedLead(normalized);
      assert.equal(val.valid, false);
      assert.match(val.error || '', /valid email/i);
    });
  });

  describe('5. Cryptographic Credential Hashing', () => {
    test('SHA-256 hash produces consistent, non-reversible token hash', () => {
      const token = 'lp_zoho_abcdef1234567890';
      const hash1 = hashSecret(token);
      const hash2 = hashSecret(token);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
      assert.notEqual(hash1, token);
    });
  });

  describe('6. Internal Worker Protection', () => {
    test('POST /api/internal/process-lead-task rejects unauthorized calls', async () => {
      const res = await fetch(`${BASE_URL}/api/internal/process-lead-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: 'test_req',
          workspaceId: 'test_ws',
          normalized: { customer_name: 'Test' },
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
    });
  });

  describe('7. RBAC & Email Verification Logic', () => {
    test('requireRole rejects users without matching role', () => {
      const middleware = requireRole(['owner', 'admin']);

      let statusCalled = 0;
      let jsonCalledWith: any = null;
      let nextCalled = false;

      const mockReq: any = {
        workspace: {
          id: 'company_agent_ws',
          role: 'agent',
        },
      };

      const mockRes: any = {
        status: (code: number) => {
          statusCalled = code;
          return {
            json: (payload: any) => {
              jsonCalledWith = payload;
            },
          };
        },
      };

      middleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.equal(statusCalled, 403);
      assert.equal(nextCalled, false);
      assert.match(jsonCalledWith.error, /Forbidden/);
    });

    test('requireRole allows users with matching role', () => {
      const middleware = requireRole(['owner', 'admin']);

      let nextCalled = false;
      const mockReq: any = {
        workspace: {
          id: 'company_owner_ws',
          role: 'owner',
        },
      };

      const mockRes: any = {};

      middleware(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

  describe('8. Multi-Tenant Lead Collection Scoping', () => {
    test('getLeadsCollection correctly targets /companies/{workspaceId}/leads', () => {
      const colA = getLeadsCollection('company_tenant_a');
      const colB = getLeadsCollection('company_tenant_b');

      assert.equal(colA.path, 'companies/company_tenant_a/leads');
      assert.equal(colB.path, 'companies/company_tenant_b/leads');
      assert.notEqual(colA.path, colB.path);
    });
  });
});
