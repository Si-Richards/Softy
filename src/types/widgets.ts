
import { ReactNode } from "react";

export interface Widget {
  id: string;
  title: string;
  type: string;
  icon: ReactNode;
  size: "small" | "medium" | "large";
}
