import 'dotenv/config';
import fs from 'fs';
import tls from 'tls';

/**
 * Environment diagnostic: `npm run doctor`
 *
 * Written after a corporate TLS proxy cost several hours of debugging that
 * looked, from the outside, like an application bug. Everything here answers
 * one question — can THIS process reach the services the app depends on — and
 * prints what it actually sees rather than generic advice.
 */

const ok = (m: string) => console.log(`  OK    ${m}`);
const bad = (m: string) => console.log(`  FAIL  ${m}`);
const info = (m: string) => console.log(`        ${m}`);

function heading(title: string) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
}

/** Prints the certificate chain a host actually presents. */
function inspectChain(host: string): Promise<string[]> {
  return new Promise((resolve) => {
    const chain: string[] = [];
    const socket = tls.connect(
      { host, port: 443, servername: host, rejectUnauthorized: false },
      () => {
        let cert = socket.getPeerCertificate(true) as
          | (tls.PeerCertificate & { issuerCertificate?: tls.PeerCertificate })
          | undefined;
        const seen = new Set<string>();
        while (cert && cert.fingerprint && !seen.has(cert.fingerprint)) {
          seen.add(cert.fingerprint);
          chain.push(
            `${cert.subject?.CN ?? '(no CN)'}  <-- issued by --  ${cert.issuer?.CN ?? '(no CN)'}`
          );
          cert = cert.issuerCertificate as typeof cert;
        }
        socket.end();
        resolve(chain);
      }
    );
    socket.on('error', (err) => resolve([`could not connect: ${err.message}`]));
    socket.setTimeout(10_000, () => {
      socket.destroy();
      resolve(['timed out']);
    });
  });
}

async function reach(label: string, url: string) {
  try {
    const res = await fetch(url);
    ok(`${label} — HTTP ${res.status}`);
    return true;
  } catch (err) {
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    bad(`${label} — ${code ?? (err as Error).message}`);
    return false;
  }
}

async function main() {
  heading('Environment this process can see');

  const caFile = process.env.NODE_EXTRA_CA_CERTS;
  if (caFile) {
    ok(`NODE_EXTRA_CA_CERTS = ${caFile}`);
    if (fs.existsSync(caFile)) {
      const text = fs.readFileSync(caFile, 'utf8');
      const count = (text.match(/BEGIN CERTIFICATE/g) ?? []).length;
      ok(`bundle exists, ${count} certificate(s)`);
    } else {
      bad('bundle path is set but the file does not exist');
    }
  } else {
    bad('NODE_EXTRA_CA_CERTS is not set in this process');
    info('If you have run setx already, this terminal predates it.');
    info('Close it, open a NEW terminal, and run npm run doctor again.');
  }

  console.log(`        NODE_OPTIONS = ${process.env.NODE_OPTIONS ?? '(not set)'}`);
  console.log(`        Node ${process.version}`);

  heading('Outbound HTTPS');
  const plain = await reach('google.com          ', 'https://www.google.com');
  await reach('generativelanguage  ', 'https://generativelanguage.googleapis.com/v1beta/models');

  if (!plain) {
    heading('Certificate chain actually presented for google.com');
    info('Everything below the leaf must be trusted by Node. The topmost entry');
    info('is the root that needs to be in your NODE_EXTRA_CA_CERTS bundle.');
    console.log('');
    for (const line of await inspectChain('www.google.com')) {
      console.log(`        ${line}`);
    }
  }

  heading('Database');
  if (!process.env.DATABASE_URL) {
    bad('DATABASE_URL is not set');
  } else {
    try {
      const { getPool, closePool } = await import('../db/client');
      await getPool().query('select 1');
      ok('Neon Postgres reachable');
      await closePool();
    } catch (err) {
      bad(`Neon Postgres — ${(err as Error).message.slice(0, 120)}`);
    }
  }

  heading('Gemini');
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    bad('GEMINI_API_KEY is not set');
  } else {
    ok(`key present (${key.length} chars), model ${process.env.GEMINI_MODEL ?? '(default)'}`);
  }

  console.log('');
}

main().catch((err) => {
  console.error('\nDoctor failed to run:\n', err);
  process.exit(1);
});
