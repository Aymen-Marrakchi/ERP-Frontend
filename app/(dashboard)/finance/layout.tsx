import { FinanceProvider } from "./store";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <FinanceProvider>{children}</FinanceProvider>;
}
