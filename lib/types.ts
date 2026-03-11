export interface Project {
  id: string;
  name: string;
  ministry: string;
  dept: string;
  overview: string;
  startYear: number | null;
  endYear: number | null;
  rsUrl: string;
  rsYear: number;
}

export interface Procurement {
  id: string;
  name: string;
  awardDate: string | null;
  price: number;
  ministryCode: string;
  bidMethodCode: string;
  bidMethodName: string;
  vendorName: string;
  corporateNumber: string | null;
  projectId: string | null;
  fiscalYear: number;
}

export interface Vendor {
  name: string;
  corporateNumber: string | null;
  totalAmount: number;
  count: number;
  projectIds: string[];
}

export interface DashboardSummary {
  projectCount: number;
  procurementCount: number;
  totalAmount: number;
  vendorCount: number;
}

export interface MonthlyAward {
  month: string;
  amount: number;
  count: number;
}

export interface BidMethodSummary {
  method: string;
  count: number;
  amount: number;
}

export interface Dashboard {
  updatedAt: string;
  summary: DashboardSummary;
  monthlyAwards: MonthlyAward[];
  bidMethodSummary: BidMethodSummary[];
}

export interface ProjectDetail extends Project {
  procurements: Procurement[];
  totalAmount: number;
  vendorCount: number;
}

// ---- ベンダーランキング -----------------------------------------------
export interface VendorRankingItem {
  corporateNumber: string | null;
  name: string;
  totalAmount: number;
  count: number;
  procurementIds: string[];
}

// ---- ベンダー依存分析 ------------------------------------------------
export interface CloudPlatform {
  platform: string;
  amount: number | null;
  projectCount: number;
  share: number | null;
  vendors: string[];
}

export interface CategoryBreakdown {
  category: string;
  totalAmount: number | null;
  projectCount: number;
  share: number | null;
}

export interface AnalysisVendor {
  name: string;
  category: string;
  cloudPlatform: string | null;
  totalAmount: number | null;
  projectCount: number;
  share: number | null;
  singleBidRate: number | null;
}

export interface ProcurementVendor {
  corporateNumber: string;
  name: string;
  category: string;
  totalAmount: number;
  count: number;
  noCompetitionRate: number | null;
}

export interface ConcentrationMetrics {
  top3Share: number | null;
  top5Share: number | null;
  top10Share: number | null;
  hhi: number | null;
  vendorCount: number;
}

export interface VendorAnalysis {
  updatedAt: string;
  totalRsSpend: number | null;
  totalCloudSpend: number | null;
  cloudShare: number | null;
  cloudPlatforms: CloudPlatform[];
  categoryBreakdown: CategoryBreakdown[];
  topVendors: AnalysisVendor[];
  procurementVendors: ProcurementVendor[];
  concentrationMetrics: ConcentrationMetrics;
}
