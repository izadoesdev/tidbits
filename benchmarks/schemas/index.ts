// Schema exports
export { analyticsEventSchema as zodEventSchema } from './zod/event-schema';
export { analyticsEventSchema as typeboxEventSchema } from './typebox/event-schema';
export { analyticsEventSchema as valibotEventSchema } from './valibot/event-schema';

// Simple schemas for comparison
import z from 'zod';
import Type from 'typebox';
import * as v from 'valibot';

export const zodSimpleSchema = z.object({
    name: z.string(),
    age: z.number(),
});

export const typeboxSimpleSchema = Type.Object({
    name: Type.String(),
    age: Type.Number(),
});

export const valibotSimpleSchema = v.object({
    name: v.string(),
    age: v.number(),
});

export { generateEventData } from '../data/event-data';

export function generateSimpleData(count: number) {
    const data: any[] = [];
    for (let i = 0; i < count; i++) {
        data.push({
            name: `User ${i}`,
            age: Math.floor(Math.random() * 80) + 18,
        });
    }
    return data;
}
