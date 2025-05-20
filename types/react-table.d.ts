import { DataTableMeta } from "@/components/DataTable";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends object> extends DataTableMeta {}
}
