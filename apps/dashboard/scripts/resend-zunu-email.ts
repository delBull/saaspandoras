import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { generatePortalToken } from '../src/lib/platform/portal-auth';
import { CLIENT_SEQUENCE } from '../src/lib/email/templates/hermes-email-sequences';
import { sendEmail } from '../src/lib/email/client';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const slug = 'zunu-20';
  
  const [project] = await db.select().from(schema.projects).where(eq(schema.projects.slug, slug));
  if (!project) {
    console.error(`Project ${slug} not found`);
    process.exit(1);
  }

  const [pack] = await db.select().from(schema.installedProducts).where(eq(schema.installedProducts.projectId, project.id));
  if (!pack) {
    console.error(`No installed products for ${slug}`);
    process.exit(1);
  }

  const token = generatePortalToken(pack.id, project.id, pack.product);
  const portalUrl = `https://staging.dash.pandoras.finance/portal/login?token=${token}&return=/onboarding/${slug}`;
  
  console.log(`\nGenerated Magic Link for ${project.title} (${slug}):`);
  console.log(`${portalUrl}\n`);

  // Try to find the email
  const email = project.applicantEmail || 'demo@pandoras.finance'; // fallback if no email
  const name = project.applicantName || project.title || 'Cliente';

  console.log(`Sending email to ${email}...`);

  const template = CLIENT_SEQUENCE.find((s) => s.id === 'EMAIL_PAID_01');
  if (!template) {
    console.error('EMAIL_PAID_01 template not found.');
    process.exit(1);
  }

  const html = template.html({
    name: name,
    magicLinkUrl: portalUrl,
  });

  try {
    await sendEmail({
      to: email,
      subject: template.subject,
      html,
    });
    console.log(`✅ Email sent successfully to ${email}`);
  } catch (e) {
    console.error('❌ Failed to send email:', e);
  }

  process.exit(0);
}

main().catch(console.error);
