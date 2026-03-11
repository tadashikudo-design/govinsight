import type { Dashboard, Project, Procurement, ProjectDetail, VendorRankingItem, VendorAnalysis } from "./types";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function getDashboard(): Dashboard {
  return readJson<Dashboard>(path.join(DATA_DIR, "dashboard.json"));
}

export function getProjects(): Project[] {
  const data = readJson<{ updatedAt: string; items: Project[] }>(
    path.join(DATA_DIR, "projects.json")
  );
  return data.items;
}

export function getProcurements(): Procurement[] {
  const data = readJson<{ updatedAt: string; items: Procurement[] }>(
    path.join(DATA_DIR, "procurements.json")
  );
  return data.items;
}

export function getProjectDetail(id: string): ProjectDetail | null {
  const filePath = path.join(DATA_DIR, "projects", `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return readJson<ProjectDetail>(filePath);
}

export function getVendors(): VendorRankingItem[] {
  const data = readJson<{ updatedAt: string; items: VendorRankingItem[] }>(
    path.join(DATA_DIR, "vendors.json")
  );
  return data.items;
}

export function getVendorAnalysis(): VendorAnalysis | null {
  const filePath = path.join(DATA_DIR, "vendor_analysis.json");
  if (!fs.existsSync(filePath)) return null;
  return readJson<VendorAnalysis>(filePath);
}

export function formatAmount(yen: number): string {
  if (yen >= 1e8) return `${(yen / 1e8).toFixed(1)}億円`;
  if (yen >= 1e4) return `${(yen / 1e4).toFixed(0)}万円`;
  return `${yen.toLocaleString()}円`;
}
