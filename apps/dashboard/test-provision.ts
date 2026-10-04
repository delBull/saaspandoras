import { provisionFullAccess } from '@/lib/admin/full-access-provision.service';
import { db } from '@saasfly/db';

async function run() {
  try {
    const res = await provisionFullAccess('snarai', 'marco@pandoras.finance');
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
