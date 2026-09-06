const fs = require('fs');
const file = 'apps/dashboard/src/app/nexus/NexusCommandCenter.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the first occurrence of {isSuperAdmin && (
code = code.replace(
  '{isSuperAdmin && (\n        <div \n          className={`absolute top-0 bottom-0 z-50 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.87, 0, 0.13, 1)',
  '{\n        <div \n          className={`absolute top-0 bottom-0 z-50 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.87, 0, 0.13, 1)'
);

// Replace the second occurrence of {isSuperAdmin && (
code = code.replace(
  '{isSuperAdmin && (\n        <div \n          className={`absolute inset-0 transition-transform duration-700 cubic-bezier(0.87, 0, 0.13, 1)',
  '{\n        <div \n          className={`absolute inset-0 transition-transform duration-700 cubic-bezier(0.87, 0, 0.13, 1)'
);

fs.writeFileSync(file, code);
