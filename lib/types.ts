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
