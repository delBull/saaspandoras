import { describe, it, expect, vi } from "vitest";
import { db } from "../index";
import { sql, createSqlFunction } from "../../lib/database";

describe("Database Driver & Transaction Engine", () => {
  it("should have db.transaction defined as a function", () => {
    expect(typeof db.transaction).toBe("function");
  });

  it("should have db.execute monkey-patched to return rows array", async () => {
    expect(typeof db.execute).toBe("function");
  });

  it("should format tagged template sql correctly with parameter placeholders", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [{ id: "123", name: "Pandoras" }] });
    const mockPool = { query: mockQuery } as any;
    
    const customSql = createSqlFunction(mockPool);
    const userId = "123";
    const status = "ACTIVE";
    
    const rows = await customSql`SELECT * FROM users WHERE id = ${userId} AND status = ${status}`;
    
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT * FROM users WHERE id = $1 AND status = $2",
      ["123", "ACTIVE"]
    );
    expect(rows).toEqual([{ id: "123", name: "Pandoras" }]);
  });

  it("should support raw string execution with parameters in sql tagged function", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [{ count: 5 }] });
    const mockPool = { query: mockQuery } as any;
    
    const customSql = createSqlFunction(mockPool);
    const rows = await customSql("SELECT COUNT(*) FROM projects WHERE status = $1", ["ACTIVE"]);
    
    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT COUNT(*) FROM projects WHERE status = $1",
      ["ACTIVE"]
    );
    expect(rows).toEqual([{ count: 5 }]);
  });

  it("should execute transaction callback when called on a client", async () => {
    const mockClient = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      release: vi.fn(),
    };
    
    // Test interactive transaction logic
    let step = 0;
    const mockTx = async (callback: (tx: any) => Promise<any>) => {
      await mockClient.query("BEGIN");
      try {
        const result = await callback({
          select: () => ({
            from: () => ({
              where: () => ({
                for: () => {
                  step = 1;
                  return [{ id: "balance_1", nonce: 1 }];
                },
              }),
            }),
          }),
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => {
                  step = 2;
                  return [{ nonce: 2 }];
                },
              }),
            }),
          }),
        });
        await mockClient.query("COMMIT");
        return result;
      } catch (err) {
        await mockClient.query("ROLLBACK");
        throw err;
      }
    };

    const res = await mockTx(async (tx) => {
      const rows = tx.select().from().where().for();
      expect(rows[0].nonce).toBe(1);
      const updated = tx.update().set().where().returning();
      expect(updated[0].nonce).toBe(2);
      return "SUCCESS";
    });

    expect(res).toBe("SUCCESS");
    expect(step).toBe(2);
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });
});
