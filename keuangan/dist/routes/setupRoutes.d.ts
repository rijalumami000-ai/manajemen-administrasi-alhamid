/**
 * setupRoutes.ts — Pengaturan tarif iuran, override bulanan, dan pengecualian SPP
 * Akses: admin-only untuk write, keuangan (admin+bendahara) untuk read
 */
import { Application } from 'express';
export declare function registerSetupRoutes(app: Application): void;
