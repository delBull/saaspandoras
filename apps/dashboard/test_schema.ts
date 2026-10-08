import { projects } from '../../packages/db-core/src/schema';
import { getTableConfig } from 'drizzle-orm/pg-core';
console.log(projects);
console.log(getTableConfig(projects));
