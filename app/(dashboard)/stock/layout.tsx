import { StockProvider } from "./store";

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return <StockProvider>{children}</StockProvider>;
}
