import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRecipients, templateParam, notifyTeamOfLead,
} from './whatsappNotifyService';

test('templateParam flattens what Meta rejects in a body variable', () => {
  // Newlines, tabs and runs of spaces are all rejected by Meta, and
  // curateSummary() is multi-line by design — so this is the guard that
  // stops the curated summary being passed through unchanged.
  assert.equal(templateParam('Chennai\nto\tTirupati'), 'Chennai to Tirupati');
  assert.equal(templateParam('spaced     out'), 'spaced out');
  assert.equal(templateParam('  trimmed  '), 'trimmed');
  assert.ok(!templateParam('a\r\nb').includes('\n'));
});

test('templateParam substitutes a fallback rather than sending an empty variable', () => {
  assert.equal(templateParam(null), 'Not specified');
  assert.equal(templateParam(undefined), 'Not specified');
  assert.equal(templateParam(''), 'Not specified');
  assert.equal(templateParam('   '), 'Not specified');
  assert.equal(templateParam('\n\t'), 'Not specified');
  assert.equal(templateParam(null, 'Flexible'), 'Flexible');
});

test('templateParam truncates past the 1024 character limit', () => {
  const out = templateParam('x'.repeat(2000));
  assert.equal(out.length, 1024);
  assert.ok(out.endsWith('...'));
});

test('templateParam keeps zero, which is a real traveller count answer', () => {
  assert.equal(templateParam(0), '0');
});

test('parseRecipients keeps digits and drops numbers missing a country code', () => {
  assert.deepEqual(parseRecipients('+91 93800 54540'), ['919380054540']);
  assert.deepEqual(parseRecipients('919380054540,919941938222').length, 2);
  // A bare 10-digit Indian mobile: Meta accepts it and delivers nowhere.
  assert.deepEqual(parseRecipients('9380054540'), []);
  assert.deepEqual(parseRecipients(undefined), []);
  assert.deepEqual(parseRecipients(''), []);
  assert.deepEqual(parseRecipients('not-a-number'), []);
});

test('parseRecipients de-duplicates so nobody is paged twice per lead', () => {
  assert.deepEqual(parseRecipients('919380054540, +91-93800-54540'), ['919380054540']);
});

test('notifyTeamOfLead is inert and silent when unconfigured', async () => {
  // The normal state before Meta onboarding finishes. It must report rather
  // than throw, because the handoff must not depend on it.
  const saved = { ...process.env };
  delete process.env.WHATSAPP_API_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.WHATSAPP_TEMPLATE_NAME;
  try {
    const out = await notifyTeamOfLead({
      requirement: {} as never,
      leadId: '1',
    });
    assert.deepEqual(out, { sent: false, reason: 'not_configured' });
  } finally {
    process.env = saved;
  }
});

test('notifyTeamOfLead refuses to send when configured with no recipients', async () => {
  const saved = { ...process.env };
  process.env.WHATSAPP_API_TOKEN = 'test-token';
  process.env.WHATSAPP_PHONE_NUMBER_ID = '1234567890';
  process.env.WHATSAPP_TEMPLATE_NAME = 'new_enquiry';
  process.env.WHATSAPP_TEAM_NUMBERS = '';
  try {
    const out = await notifyTeamOfLead({ requirement: {} as never, leadId: '1' });
    assert.deepEqual(out, { sent: false, reason: 'no_recipients' });
  } finally {
    process.env = saved;
  }
});
