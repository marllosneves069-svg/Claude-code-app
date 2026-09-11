import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnóstico Empresarial 360",
  description: "Descubra em poucos minutos o que está limitando o crescimento da sua empresa.",
};

export default function DiagnosticoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
