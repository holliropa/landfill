import { listConverters as listRegisteredConverters } from "@/domain/conversions/converter-registry";

export function listConverters() {
  return listRegisteredConverters().map((converter) => ({
    id: converter.id,
    label: converter.label,
    targets: converter.targets,
  }));
}
