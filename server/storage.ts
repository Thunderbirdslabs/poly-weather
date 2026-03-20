import {
  trades, dailyReviews, events, dataSources, strategyConfig,
  type Trade, type InsertTrade,
  type DailyReview, type InsertDailyReview,
  type Event, type InsertEvent,
  type DataSource, type InsertDataSource,
  type StrategyConfig, type InsertStrategyConfig,
} from "@shared/schema";

export interface IStorage {
  // Trades
  getTrades(): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, trade: Partial<InsertTrade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;

  // Daily Reviews
  getDailyReviews(): Promise<DailyReview[]>;
  getDailyReview(id: number): Promise<DailyReview | undefined>;
  createDailyReview(review: InsertDailyReview): Promise<DailyReview>;
  updateDailyReview(id: number, review: Partial<InsertDailyReview>): Promise<DailyReview | undefined>;

  // Events
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Data Sources
  getDataSources(): Promise<DataSource[]>;
  updateDataSource(id: number, ds: Partial<InsertDataSource>): Promise<DataSource | undefined>;

  // Strategy Config
  getStrategyConfig(): Promise<StrategyConfig | undefined>;
  upsertStrategyConfig(config: InsertStrategyConfig): Promise<StrategyConfig>;
}

export class MemStorage implements IStorage {
  private trades: Map<number, Trade> = new Map();
  private dailyReviews: Map<number, DailyReview> = new Map();
  private events: Map<number, Event> = new Map();
  private dataSources: Map<number, DataSource> = new Map();
  private strategyConfig: StrategyConfig | undefined;
  private nextId = { trades: 1, reviews: 1, events: 1, ds: 1 };

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed strategy config
    this.strategyConfig = {
      id: 1,
      totalTrades: 50,
      capitalPerTrade: 5,
      initialCapital: 250,
      targetAccuracy: 0.93,
      breakEvenAccuracy: 0.89,
      boundedRangeMin: 65,
      boundedRangeMax: 75,
      primaryLocation: "New York, NY",
      reviewStartDay: 3,
      updatedAt: new Date(),
    };

    // Seed data sources
    const sources: DataSource[] = [
      { id: 1, name: "Weather Underground API", type: "api", status: "active", lastPolled: new Date().toISOString(), successRate: 98.2, notes: "Primary forecast provider", updatedAt: new Date() },
      { id: 2, name: "Open-Meteo API", type: "api", status: "active", lastPolled: new Date().toISOString(), successRate: 99.1, notes: "Open-source multi-model backend", updatedAt: new Date() },
      { id: 3, name: "Prithvi (IBM/NASA)", type: "model", status: "active", lastPolled: new Date().toISOString(), successRate: 91.5, notes: "Hugging Face model", updatedAt: new Date() },
      { id: 4, name: "Pangu-Weather", type: "model", status: "active", lastPolled: new Date().toISOString(), successRate: 89.3, notes: "3D neural network medium-range", updatedAt: new Date() },
      { id: 5, name: "GraphWeather", type: "model", status: "degraded", lastPolled: new Date().toISOString(), successRate: 76.0, notes: "GNN-driven, rate limited", updatedAt: new Date() },
      { id: 6, name: "MCP Weather Sync", type: "mcp", status: "active", lastPolled: new Date().toISOString(), successRate: 95.0, notes: "mcp://weather.data.sync", updatedAt: new Date() },
      { id: 7, name: "MCP Analytics Tracker", type: "mcp", status: "active", lastPolled: new Date().toISOString(), successRate: 100, notes: "mcp://analytics.tracker", updatedAt: new Date() },
      { id: 8, name: "NVIDIA Earth-2", type: "api", status: "offline", lastPolled: null, successRate: 0, notes: "Planned integration", updatedAt: new Date() },
    ];
    sources.forEach((s) => this.dataSources.set(s.id, s));
    this.nextId.ds = 9;

    // Seed some trades
    const sampleTrades: Trade[] = [];
    const statuses: Array<"win" | "loss" | "pending"> = ["win", "win", "win", "loss", "win", "win", "win", "win", "loss", "win", "win", "win", "win", "loss", "win", "win", "win", "win", "loss", "win", "win", "win", "win", "pending"];
    for (let i = 0; i < statuses.length; i++) {
      const d = new Date(2026, 2, 1 + i);
      const status = statuses[i];
      sampleTrades.push({
        id: i + 1,
        tradeNumber: i + 1,
        date: d.toISOString().split("T")[0],
        status,
        capitalAllocated: 5,
        forecastSource: ["Open-Meteo API", "Weather Underground API", "Prithvi (IBM/NASA)", "Pangu-Weather"][i % 4],
        predictedMin: 65 + Math.random() * 3,
        predictedMax: 72 + Math.random() * 3,
        actualMin: status === "win" ? 66 + Math.random() * 2 : 60 + Math.random() * 4,
        actualMax: status === "win" ? 73 + Math.random() * 2 : 79 + Math.random() * 4,
        location: "New York, NY",
        hypothesis: `Temperature will remain within 65-75°F bounded range on day ${i + 1}`,
        notes: status === "win" ? "Forecast held within bounds" : status === "loss" ? "Forecast deviation outside range" : "Trade in progress",
        weatherSnapshotEntry: { temp: 68 + Math.random() * 4, humidity: 55 + Math.random() * 15, wind: 8 + Math.random() * 6 },
        weatherSnapshotExit: status !== "pending" ? { temp: 71 + Math.random() * 4, humidity: 58 + Math.random() * 12, wind: 9 + Math.random() * 5 } : null,
        createdAt: d,
      });
    }
    sampleTrades.forEach((t) => this.trades.set(t.id, t));
    this.nextId.trades = sampleTrades.length + 1;

    // Seed daily reviews
    const wins = [3, 5, 7, 10, 12, 14, 16, 19, 20];
    wins.forEach((w, idx) => {
      const total = w + Math.floor(idx * 0.4);
      const losses = total - w;
      const pct = w / total;
      const rev: DailyReview = {
        id: idx + 1,
        reviewDay: 3 + idx,
        date: new Date(2026, 2, 3 + idx).toISOString().split("T")[0],
        cumulativeWins: w,
        cumulativeLosses: losses,
        accuracyPct: pct,
        capitalRemaining: 250 + (w - losses) * 5,
        pnl: (w - losses) * 5,
        notes: pct >= 0.93 ? "On target — excellent accuracy maintained" : "Slightly below target; monitor next 3 trades",
        modelPerformance: { "Open-Meteo API": 0.95, "Weather Underground API": 0.92, "Prithvi (IBM/NASA)": 0.88, "Pangu-Weather": 0.86 },
        createdAt: new Date(2026, 2, 3 + idx),
      };
      this.dailyReviews.set(rev.id, rev);
    });
    this.nextId.reviews = wins.length + 1;

    // Seed events
    const seedEvents: Event[] = [
      { id: 1, title: "Review Cycle Begins", date: "2026-03-03", type: "review", description: "Day 3 — First accuracy review checkpoint", completed: true, createdAt: new Date() },
      { id: 2, title: "Trade 10 Milestone", date: "2026-03-10", type: "milestone", description: "20% of trades complete — full strategy calibration", completed: true, createdAt: new Date() },
      { id: 3, title: "Trade 25 Mid-Point Review", date: "2026-03-25", type: "review", description: "50% complete — mid-strategy executive review", completed: false, createdAt: new Date() },
      { id: 4, title: "NVIDIA Earth-2 Integration", date: "2026-04-01", type: "milestone", description: "Planned activation of Earth-2 microservices", completed: false, createdAt: new Date() },
      { id: 5, title: "Trade 50 Final Review", date: "2026-04-19", type: "deadline", description: "Day 51 — Executive summary and full strategy review", completed: false, createdAt: new Date() },
      { id: 6, title: "Docker Compose Deploy", date: "2026-03-22", type: "milestone", description: "Multi-container environment: data-poller, trade-engine, analytics-agent", completed: false, createdAt: new Date() },
    ];
    seedEvents.forEach((e) => this.events.set(e.id, e));
    this.nextId.events = seedEvents.length + 1;
  }

  // Trades
  async getTrades(): Promise<Trade[]> { return Array.from(this.trades.values()).sort((a, b) => a.tradeNumber - b.tradeNumber); }
  async getTrade(id: number): Promise<Trade | undefined> { return this.trades.get(id); }
  async createTrade(t: InsertTrade): Promise<Trade> {
    const trade: Trade = { ...t, id: this.nextId.trades++, createdAt: new Date() } as Trade;
    this.trades.set(trade.id, trade);
    return trade;
  }
  async updateTrade(id: number, t: Partial<InsertTrade>): Promise<Trade | undefined> {
    const existing = this.trades.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...t };
    this.trades.set(id, updated);
    return updated;
  }
  async deleteTrade(id: number): Promise<boolean> { return this.trades.delete(id); }

  // Daily Reviews
  async getDailyReviews(): Promise<DailyReview[]> { return Array.from(this.dailyReviews.values()).sort((a, b) => a.reviewDay - b.reviewDay); }
  async getDailyReview(id: number): Promise<DailyReview | undefined> { return this.dailyReviews.get(id); }
  async createDailyReview(r: InsertDailyReview): Promise<DailyReview> {
    const review: DailyReview = { ...r, id: this.nextId.reviews++, createdAt: new Date() } as DailyReview;
    this.dailyReviews.set(review.id, review);
    return review;
  }
  async updateDailyReview(id: number, r: Partial<InsertDailyReview>): Promise<DailyReview | undefined> {
    const existing = this.dailyReviews.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...r };
    this.dailyReviews.set(id, updated);
    return updated;
  }

  // Events
  async getEvents(): Promise<Event[]> { return Array.from(this.events.values()).sort((a, b) => a.date.localeCompare(b.date)); }
  async createEvent(e: InsertEvent): Promise<Event> {
    const ev: Event = { ...e, id: this.nextId.events++, createdAt: new Date() } as Event;
    this.events.set(ev.id, ev);
    return ev;
  }
  async updateEvent(id: number, e: Partial<InsertEvent>): Promise<Event | undefined> {
    const existing = this.events.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...e };
    this.events.set(id, updated);
    return updated;
  }
  async deleteEvent(id: number): Promise<boolean> { return this.events.delete(id); }

  // Data Sources
  async getDataSources(): Promise<DataSource[]> { return Array.from(this.dataSources.values()); }
  async updateDataSource(id: number, ds: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const existing = this.dataSources.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...ds, updatedAt: new Date() };
    this.dataSources.set(id, updated);
    return updated;
  }

  // Strategy Config
  async getStrategyConfig(): Promise<StrategyConfig | undefined> { return this.strategyConfig; }
  async upsertStrategyConfig(config: InsertStrategyConfig): Promise<StrategyConfig> {
    this.strategyConfig = { ...config, id: 1, updatedAt: new Date() } as StrategyConfig;
    return this.strategyConfig;
  }
}

export const storage = new MemStorage();
