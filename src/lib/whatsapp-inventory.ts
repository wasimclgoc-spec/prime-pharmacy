/**
 * WhatsApp Inventory — now sourced from shared-inventory.ts
 * This is the SINGLE source of truth used by both Admin and WhatsApp AI.
 * To add/edit medicines, update shared-inventory.ts
 */
export type { Medicine } from './shared-inventory';
export { sharedMedicines as medicines } from './shared-inventory';
