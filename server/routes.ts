import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertDailyReviewSchema, insertEventSchema, insertStrategyConfigSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── Trades ────────────────────────────────────────────────────────────
  app.get("/api/trades", async (_req, res) => {
    const trades = await storage.getTrades();
    res.json(trades);
  });

  app.get("/api/trades/:id", async (req, res) => {
    const trade = await storage.getTrade(Number(req.params.id));
    if (!trade) return res.status(404).json({ error: "Trade not found" });
    res.json(trade);
  });

  app.post("/api/trades", async (req, res) => {
    const parsed = insertTradeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const trade = await storage.createTrade(parsed.data);
    res.status(201).json(trade);
  });

  app.patch("/api/trades/:id", async (req, res) => {
    const updated = await storage.updateTrade(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Trade not found" });
    res.json(updated);
  });

  app.delete("/api/trades/:id", async (req, res) => {
    const deleted = await storage.deleteTrade(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Trade not found" });
    res.json({ success: true });
  });

  // ─── Analytics (computed) ───────────────────────────────────────────────
  app.get("/api/analytics", async (_req, res) => {
    const trades = await storage.getTrades();
    const config = await storage.getStrategyConfig();
    const wins = trades.filter((t) => t.status === "win").length;
    const losses = trades.filter((t) => t.status === "loss").length;
    const completed = wins + losses;
    const accuracy = completed > 0 ? wins / completed : 0;
    const pnl = (wins - losses) * (config?.capitalPerTrade ?? 5);
    const capitalRemaining = (config?.initialCapital ?? 250) + pnl;
    const remaining = (config?.totalTrades ?? 50) - completed;
    res.json({ wins, losses, completed, accuracy, pnl, capitalRemaining, remaining, onTrack: accuracy >= (config?.targetAccuracy ?? 0.93) });
  });

  // ─── Daily Reviews ──────────────────────────────────────────────────────
  app.get("/api/reviews", async (_req, res) => {
    const reviews = await storage.getDailyReviews();
    res.json(reviews);
  });

  app.post("/api/reviews", async (req, res) => {
    const parsed = insertDailyReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const review = await storage.createDailyReview(parsed.data);
    res.status(201).json(review);
  });

  app.patch("/api/reviews/:id", async (req, res) => {
    const updated = await storage.updateDailyReview(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Review not found" });
    res.json(updated);
  });

  // ─── Events ─────────────────────────────────────────────────────────────
  app.get("/api/events", async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    const parsed = insertEventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const ev = await storage.createEvent(parsed.data);
    res.status(201).json(ev);
  });

  app.patch("/api/events/:id", async (req, res) => {
    const updated = await storage.updateEvent(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Event not found" });
    res.json(updated);
  });

  app.delete("/api/events/:id", async (req, res) => {
    const deleted = await storage.deleteEvent(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Event not found" });
    res.json({ success: true });
  });

  // ─── Data Sources ────────────────────────────────────────────────────────
  app.get("/api/data-sources", async (_req, res) => {
    const sources = await storage.getDataSources();
    res.json(sources);
  });

  app.patch("/api/data-sources/:id", async (req, res) => {
    const updated = await storage.updateDataSource(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: "Data source not found" });
    res.json(updated);
  });

  // ─── Strategy Config ─────────────────────────────────────────────────────
  app.get("/api/config", async (_req, res) => {
    const config = await storage.getStrategyConfig();
    res.json(config ?? {});
  });

  app.put("/api/config", async (req, res) => {
    const parsed = insertStrategyConfigSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const config = await storage.upsertStrategyConfig(parsed.data);
    res.json(config);
  });

  return httpServer;
}
