import { ReportData } from "@/types/reports";

export interface ReportTableTabProps {
  data: ReportData;
  label: string;
  trendValueLabel: string;
  isLoading: boolean;
}
