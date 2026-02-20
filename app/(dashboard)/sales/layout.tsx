import { SalesProvider } from "./store";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return <SalesProvider>{children}</SalesProvider>;
}
