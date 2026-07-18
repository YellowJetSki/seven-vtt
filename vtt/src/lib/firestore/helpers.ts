import { DocumentData, Timestamp } from "firebase/firestore";

export function now(): number {
  return Date.now();
}

export function serverTimestamp(): Timestamp {
  return Timestamp.now();
}

export function toFirestore<T extends DocumentData>(data: T): T & { updatedAt: number } {
  return { ...data, updatedAt: now() };
}

export function fromFirestore<T>(id: string, data: DocumentData): T & { id: string } {
  return { id, ...data } as T & { id: string };
}

export const CAMPAIGN_COLLECTION = "campaigns";
