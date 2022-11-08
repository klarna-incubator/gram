import System from "./System";
import {
  SystemListInput,
  SystemListResult,
  systemProvider,
} from "./SystemProvider";

export async function list(
  input: SystemListInput,
  pagination: { page: number; pageSize: number } = { page: 0, pageSize: 10 }
): Promise<SystemListResult> {
  return systemProvider.listSystems(input, pagination);
}

export async function getById(id: string): Promise<System | null> {
  return systemProvider.getSystem(id.toString());
}
