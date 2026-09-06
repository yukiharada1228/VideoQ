import type { RpcCaller } from "./contracts";

export interface TrpcContext extends Record<string, unknown> {
  userId: string | null;
  assertSuperuser: () => Promise<void>;
  call: RpcCaller;
}
