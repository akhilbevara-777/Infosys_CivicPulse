import type { MunicipalAsset, AssetCategory, AssetStatus } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Mock Municipal Assets ────────────────────────────────────────────────────
export const MUNICIPAL_ASSETS: MunicipalAsset[] = [
  {
    id: 'ast1', assetId: 'AST-VEH-001', name: 'Garbage Collection Truck #1',
    category: 'Vehicle', department: 'Sanitation Dept', location: 'Ward 1-10 Zone',
    purchaseDate: '2022-03-15', purchaseValue: 2500000, currentValue: 1800000,
    status: 'operational', lastMaintenanceDate: '2026-07-01', nextMaintenanceDate: '2026-10-01',
    assignedTo: 'Driver Suresh', description: '10-ton capacity compactor garbage truck',
  },
  {
    id: 'ast2', assetId: 'AST-VEH-002', name: 'Road Repair Vehicle',
    category: 'Vehicle', department: 'Road & Infrastructure', location: 'Central Depot',
    purchaseDate: '2021-06-10', purchaseValue: 3800000, currentValue: 2400000,
    status: 'under_maintenance', lastMaintenanceDate: '2026-08-01', nextMaintenanceDate: '2026-08-20',
    assignedTo: 'Engineer Ravi', description: 'Pothole patching machine with hot mix',
  },
  {
    id: 'ast3', assetId: 'AST-EQP-001', name: 'Water Pump Station — Sector 5',
    category: 'Equipment', department: 'Water Department', location: 'Sector 5, Ward 12',
    purchaseDate: '2019-11-20', purchaseValue: 5000000, currentValue: 3200000,
    status: 'operational', lastMaintenanceDate: '2026-06-15', nextMaintenanceDate: '2026-12-15',
    description: '500KL/day capacity pump station with automated controls',
  },
  {
    id: 'ast4', assetId: 'AST-IT-001', name: 'Server Infrastructure — Data Center',
    category: 'IT Asset', department: 'Municipal Administration', location: 'Municipal HQ',
    purchaseDate: '2023-01-15', purchaseValue: 4500000, currentValue: 3600000,
    status: 'operational', lastMaintenanceDate: '2026-07-20', nextMaintenanceDate: '2027-01-20',
    assignedTo: 'IT Team', description: 'Primary servers for CivicPulse Nexus platform',
  },
  {
    id: 'ast5', assetId: 'AST-BLD-001', name: 'Municipal Office Building',
    category: 'Building', department: 'Municipal Administration', location: 'MG Road, City Center',
    purchaseDate: '1995-01-01', purchaseValue: 50000000, currentValue: 120000000,
    status: 'operational', lastMaintenanceDate: '2025-12-01', nextMaintenanceDate: '2027-12-01',
    description: '5-story main municipal building with 80 offices',
  },
  {
    id: 'ast6', assetId: 'AST-LND-001', name: 'Community Park — Ward 7',
    category: 'Land', department: 'Municipal Administration', location: 'Ward 7, Park Avenue',
    purchaseDate: '2010-05-01', purchaseValue: 8000000, currentValue: 25000000,
    status: 'operational', lastMaintenanceDate: '2026-07-01', nextMaintenanceDate: '2026-10-01',
    description: '2.5 acre community park with playground and walking track',
  },
  {
    id: 'ast7', assetId: 'AST-EQP-002', name: 'Transformer Unit — Ward 3',
    category: 'Equipment', department: 'Electricity Board', location: 'Ward 3 Substation',
    purchaseDate: '2020-08-10', purchaseValue: 1200000, currentValue: 900000,
    status: 'under_maintenance', lastMaintenanceDate: '2026-08-09', nextMaintenanceDate: '2026-08-15',
    description: '100KVA transformer serving Ward 3 residential area',
  },
  {
    id: 'ast8', assetId: 'AST-VEH-003', name: 'Ambulance Unit #2',
    category: 'Vehicle', department: 'Public Health', location: 'Civil Hospital',
    purchaseDate: '2023-09-01', purchaseValue: 1800000, currentValue: 1500000,
    status: 'operational', lastMaintenanceDate: '2026-08-01', nextMaintenanceDate: '2026-11-01',
    description: 'Advanced life support ambulance with medical equipment',
  },
];

const assetService = {
  async getAll(): Promise<MunicipalAsset[]> {
    await delay(300);
    return [...MUNICIPAL_ASSETS];
  },

  async getByDept(dept: string): Promise<MunicipalAsset[]> {
    await delay(200);
    return MUNICIPAL_ASSETS.filter(a => a.department === dept);
  },

  async getByCategory(category: AssetCategory): Promise<MunicipalAsset[]> {
    await delay(200);
    return MUNICIPAL_ASSETS.filter(a => a.category === category);
  },

  async getById(id: string): Promise<MunicipalAsset | undefined> {
    await delay(100);
    return MUNICIPAL_ASSETS.find(a => a.id === id);
  },

  async updateStatus(asset: MunicipalAsset, status: AssetStatus, notes?: string): Promise<MunicipalAsset> {
    await delay(300);
    return {
      ...asset,
      status,
      lastMaintenanceDate: status === 'under_maintenance' ? new Date().toISOString().split('T')[0] : asset.lastMaintenanceDate,
    };
  },

  async scheduleMaintenane(asset: MunicipalAsset, date: string): Promise<MunicipalAsset> {
    await delay(300);
    return { ...asset, nextMaintenanceDate: date };
  },

  async getStats(): Promise<{
    total: number; operational: number; underMaintenance: number; decommissioned: number;
    totalValue: number; maintenanceDue: number;
  }> {
    await delay(200);
    const today = new Date().toISOString().split('T')[0];
    return {
      total: MUNICIPAL_ASSETS.length,
      operational: MUNICIPAL_ASSETS.filter(a => a.status === 'operational').length,
      underMaintenance: MUNICIPAL_ASSETS.filter(a => a.status === 'under_maintenance').length,
      decommissioned: MUNICIPAL_ASSETS.filter(a => a.status === 'decommissioned').length,
      totalValue: MUNICIPAL_ASSETS.reduce((s, a) => s + a.currentValue, 0),
      maintenanceDue: MUNICIPAL_ASSETS.filter(a =>
        a.nextMaintenanceDate && a.nextMaintenanceDate <= today
      ).length,
    };
  },
};

export default assetService;
