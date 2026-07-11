import { create } from 'zustand';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  media?: { url: string; type: string }[];
}

interface IssueState {
  issues: Issue[];
  selectedIssue: Issue | null;
  filters: { category: string; status: string; priority: string; search: string };
  setIssues: (issues: Issue[]) => void;
  selectIssue: (issue: Issue | null) => void;
  setFilters: (filters: Partial<IssueState['filters']>) => void;
}

export const useIssueStore = create<IssueState>((set) => ({
  issues: [],
  selectedIssue: null,
  filters: { category: '', status: '', priority: '', search: '' },
  setIssues: (issues) => set({ issues }),
  selectIssue: (issue) => set({ selectedIssue: issue }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}));
