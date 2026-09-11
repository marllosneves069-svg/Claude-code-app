import { Compass, Factory, Megaphone, ShoppingCart, Users, Wallet, type LucideIcon } from "lucide-react";
import type { DiagnosticoPilarId } from "@/lib/diagnostico/types";

export const PILAR_ICONES: Record<DiagnosticoPilarId, LucideIcon> = {
  marketing: Megaphone,
  comercial: ShoppingCart,
  pessoas: Users,
  operacao: Factory,
  financeiro: Wallet,
  gestao: Compass,
};
