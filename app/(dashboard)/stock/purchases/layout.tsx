import { PurchasesProvider } from "./store";

export default function PurchasesLayout({ children }: { children: React.ReactNode }) {
  return <PurchasesProvider>{children}</PurchasesProvider>;
}