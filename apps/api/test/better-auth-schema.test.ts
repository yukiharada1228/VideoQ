import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { oauthClientResource } from "../src/db/schema/better-auth";

describe("Better Auth OAuth resource schema", () => {
  it("links DCR resource identifiers rather than internal resource row ids", () => {
    const config = getTableConfig(oauthClientResource);
    const foreignKey = config.foreignKeys.find(
      (key) => key.getName() === "oauth_client_resource_resource_id_fkey",
    );

    expect(foreignKey).toBeDefined();
    const reference = foreignKey!.reference();
    expect(reference.columns.map((column) => column.name)).toEqual(["resource_id"]);
    expect(reference.foreignColumns.map((column) => column.name)).toEqual([
      "identifier",
    ]);
  });
});
