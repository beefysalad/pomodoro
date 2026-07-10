import prisma from './prisma'

// Extracts the type of the `tx` parameter from prisma.$transaction's
// interactive-callback overload, so Db covers both the shared client and a
// transaction client without depending on Prisma's internal type names.
type TransactionCallback<T> = (tx: T) => Promise<unknown>
// options is inferred (not typed `any`/`unknown`) — that's what keeps the
// overload match working; typing it explicitly breaks the inference.
type ExtractTx<F> = F extends (fn: TransactionCallback<infer T>, options?: infer O) => unknown
  ? T
  : never

export type Db = typeof prisma | ExtractTx<typeof prisma.$transaction>
