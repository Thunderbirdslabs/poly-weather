import { pgTable, text, integer, real, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Trades ────────────────────────────────────────────────────────────────
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  tradeNumber: integer("trade_number").notNull(),
  date: text("date").notNull(), // ISO date string
  status: text("status").notNull().default("pending"), // pending | win | loss
  capitalAllocated: real("capital_allocated").notNull().default(5),
  forecastSource: text("forecast_source").notNull().default("Open-Meteo"),
  predictedMin: real("predicted_min"),
  predictedMax: real("predicted_max"),
  actualMin: real("actual_min"),
  actualMax: real("actual_max"),
  location: text("location").notNull().default("Primary Location"),
  hypothesis: text("hypothesis"),
  notes: text("notes"),
  weatherSnapshotEntry: jsonb("weather_snapshot_entry"),
  weatherSnapshotExit: jsonb("weather_snapshot_exit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, createdAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

// ─── Daily Reviews ─────────────────────────────────────────────────────────
export const dailyReviews = pgTable("daily_reviews", {
  id: serial("id").primaryKey(),
  reviewDay: integer("review_day").notNull(), // day 3, 4, 5 ...
  date: text("date").notNull(),
  cumulativeWins: integer("cumulative_wins").notNull().default(0),
  cumulativeLosses: integer("cumulative_losses").notNull().default(0),
  accuracyPct: real("accuracy_pct").notNull().default(0),
  capitalRemaining: real("capital_remaining").notNull().default(250),
  pnl: real("pnl").notNull().default(0),
  notes: text("notes"),
  modelPerformance: jsonb("model_performance"), // per-source accuracy breakdown
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyReviewSchema = createInsertSchema(dailyReviews).omit({ id: true, createdAt: true });
export type InsertDailyReview = z.infer<typeof insertDailyReviewSchema>;
export type DailyReview = typeof dailyReviews.$inferSelect;

// ─── Events / Upcoming Milestones ──────────────────────────────────────────
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(), // ISO date
  type: text("type").notNull().default("milestone"), // milestone | review | deadline | alert
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// ─── Data Source Health ─────────────────────────────────────────────────────
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // api | model | mcp
  status: text("status").notNull().default("active"), // active | degraded | offline
  lastPolled: text("last_polled"),
  successRate: real("success_rate").notNull().default(100),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({ id: true, updatedAt: true });
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;

// ─── Strategy Config (single row) ──────────────────────────────────────────
export const strategyConfig = pgTable("strategy_config", {
  id: serial("id").primaryKey(),
  totalTrades: integer("total_trades").notNull().default(50),
  capitalPerTrade: real("capital_per_trade").notNull().default(5),
  initialCapital: real("initial_capital").notNull().default(250),
  targetAccuracy: real("target_accuracy").notNull().default(0.93),
  breakEvenAccuracy: real("break_even_accuracy").notNull().default(0.89),
  boundedRangeMin: real("bounded_range_min").notNull().default(65),
  boundedRangeMax: real("bounded_range_max").notNull().default(75),
  primaryLocation: text("primary_location").notNull().default("New York, NY"),
  reviewStartDay: integer("review_start_day").notNull().default(3),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStrategyConfigSchema = createInsertSchema(strategyConfig).omit({ id: true, updatedAt: true });
export type InsertStrategyConfig = z.infer<typeof insertStrategyConfigSchema>;
export type StrategyConfig = typeof strategyConfig.$inferSelect;
