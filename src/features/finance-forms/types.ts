import type { Account, Category, Goal, Obligation, Transaction } from "@/src/shared/types";
export type Dialog = {
  type: string;
  item?: Transaction | Account | Goal | Obligation | Category;
  repeat?: boolean;
};
