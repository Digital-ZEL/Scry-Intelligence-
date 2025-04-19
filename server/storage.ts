import { 
  users, 
  messages, 
  researchAreas, 
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage,
  type ResearchArea,
  type InsertResearchArea 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Define the SessionStore type
type SessionStore = session.Store;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Research area methods
  getResearchAreas(): Promise<ResearchArea[]>;
  createResearchArea(area: InsertResearchArea): Promise<ResearchArea>;
  
  // Session store
  sessionStore: SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
  
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(messages.createdAt);
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, id));
  }
  
  async getResearchAreas(): Promise<ResearchArea[]> {
    return await db.select().from(researchAreas).orderBy(researchAreas.order);
  }
  
  async createResearchArea(area: InsertResearchArea): Promise<ResearchArea> {
    const [newArea] = await db
      .insert(researchAreas)
      .values(area)
      .returning();
    return newArea;
  }
}

export const storage = new DatabaseStorage();