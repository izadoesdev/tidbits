import { z } from "zod";
import Type, { type Static } from "typebox";
import Value from "typebox/value";
import { Compile } from "typebox/compile";
import * as v from "valibot";
import chalk from "chalk";
import { faker } from "@faker-js/faker";
import { bench, run, summary, do_not_optimize } from "mitata";

// Configuration
const CONFIG = {
    dataPoints: 10000,
};

const simpleZodSchema = z.object({
    name: z.string(),
    age: z.number(),
});

const simpleTypeboxSchema = Type.Object({
    name: Type.String(),
    age: Type.Number(),
});

const complexZodSchema = z.object({
    id: z.uuidv4(),
    profile: z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        email: z.email(),
        age: z.number().int().min(0).max(120),
        isActive: z.boolean(),
    }),
    preferences: z.object({
        theme: z.enum(["light", "dark", "auto"]),
        notifications: z.object({
            email: z.boolean(),
            push: z.boolean(),
            sms: z.boolean(),
        }),
        language: z.string().default("en"),
    }),
    metadata: z.record(z.string(), z.unknown()),
    tags: z.array(z.string()).min(0).max(10),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
});

const complexTypeboxSchema = Type.Object({
    id: Type.String({ format: "uuid" }),
    profile: Type.Object({
        firstName: Type.String({ minLength: 1, maxLength: 50 }),
        lastName: Type.String({ minLength: 1, maxLength: 50 }),
        email: Type.String({ format: "email" }),
        age: Type.Integer({ minimum: 0, maximum: 120 }),
        isActive: Type.Boolean(),
    }),
    preferences: Type.Object({
        theme: Type.Union([Type.Literal("light"), Type.Literal("dark"), Type.Literal("auto")]),
        notifications: Type.Object({
            email: Type.Boolean(),
            push: Type.Boolean(),
            sms: Type.Boolean(),
        }),
        language: Type.String({ default: "en" }),
    }),
    metadata: Type.Record(Type.String(), Type.Unknown()),
    tags: Type.Array(Type.String(), { minItems: 0, maxItems: 10 }),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.Optional(Type.String({ format: "date-time" })),
});

const compiledSimpleTypeboxSchema = Compile(simpleTypeboxSchema);
const compiledComplexTypeboxSchema = Compile(complexTypeboxSchema);

const simpleValibotSchema = v.object({
    name: v.string(),
    age: v.number(),
});

const complexValibotSchema = v.object({
    id: v.pipe(v.string(), v.uuid()),
    profile: v.object({
        firstName: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
        lastName: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
        email: v.pipe(v.string(), v.email()),
        age: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(120)),
        isActive: v.boolean(),
    }),
    preferences: v.object({
        theme: v.picklist(["light", "dark", "auto"]),
        notifications: v.object({
            email: v.boolean(),
            push: v.boolean(),
            sms: v.boolean(),
        }),
        language: v.optional(v.string(), "en"),
    }),
    metadata: v.record(v.string(), v.unknown()),
    tags: v.pipe(v.array(v.string()), v.minLength(0), v.maxLength(10)),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
});

function generateSimpleData(count: number) {
    const data: any[] = [];
    for (let i = 0; i < count; i++) {
        data.push({
            name: faker.person.fullName(),
            age: faker.number.int({ min: 18, max: 80 }),
        });
    }
    return data;
}

function generateComplexData(count: number) {
    const data: any[] = [];

    for (let i = 0; i < count; i++) {
        const createdAt = faker.date.recent({ days: 365 });
        const updatedAt = faker.datatype.boolean() ? faker.date.between({ from: createdAt, to: new Date() }) : undefined;

        data.push({
            id: faker.string.uuid(),
            profile: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                email: faker.internet.email(),
                age: faker.number.int({ min: 18, max: 80 }),
                isActive: faker.datatype.boolean(),
            },
            preferences: {
                theme: faker.helpers.arrayElement(["light", "dark", "auto"]),
                notifications: {
                    email: faker.datatype.boolean(),
                    push: faker.datatype.boolean(),
                    sms: faker.datatype.boolean(),
                },
                language: "en",
            },
            metadata: {
                source: faker.helpers.arrayElement(["api", "web", "mobile", "import"]),
                version: faker.system.semver(),
                [`custom_${i}`]: faker.lorem.word(),
            },
            tags: Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () => faker.lorem.word()),
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt?.toISOString(),
        });
    }
    return data;
}

// Generate test data once for all benchmarks
const simpleData = generateSimpleData(CONFIG.dataPoints);
const complexData = generateComplexData(CONFIG.dataPoints);

const register = (data: any[], name: string, fn: (data: any) => any) => {
    bench(name, function* () {
        let i = -1;

        yield {
            [0]: () => {
                i = (i + 1) % data.length;
                return data[i];
            },
            bench: fn,
        };
    }).gc('inner');
};

// Simple Schema Benchmarks
console.log(chalk.bold.magenta("🚀 SIMPLE SCHEMA VALIDATION BENCHMARK"));
console.log(chalk.cyan("Configuration:"));
console.log(`  ${chalk.gray('Data points:')} ${chalk.white.bold(CONFIG.dataPoints.toLocaleString())}`);
console.log(`  ${chalk.gray('Schema:')} ${chalk.white('name (string) + age (number)')}`);
console.log(chalk.gray("─".repeat(60)) + "\n");

summary(() => {
    register(simpleData, "zod (simple)", (data) => {
        do_not_optimize(simpleZodSchema.parse(data));
    });

    register(simpleData, "typeBox Value.Check (simple)", (data) => {
        do_not_optimize(Value.Check(simpleTypeboxSchema, data));
    });

    register(simpleData, "typebox compiled (simple)", (data) => {
        do_not_optimize(compiledSimpleTypeboxSchema.Check(data));
    });

    register(simpleData, "Valibot (simple)", (data) => {
        do_not_optimize(v.parse(simpleValibotSchema, data));
    });
});

await run();

console.log("\n" + chalk.gray("═".repeat(80)) + "\n");

// Complex Schema Benchmarks
console.log(chalk.bold.magenta("🚀 COMPLEX SCHEMA VALIDATION BENCHMARK"));
console.log(chalk.cyan("Configuration:"));
console.log(`  ${chalk.gray('Data points:')} ${chalk.white.bold(CONFIG.dataPoints.toLocaleString())}`);
console.log(`  ${chalk.gray('Schema:')} ${chalk.white('user profile + preferences + metadata + tags')}`);
console.log(chalk.gray("─".repeat(60)) + "\n");

summary(() => {
    register(complexData, "zod (complex)", (data) => {
        do_not_optimize(complexZodSchema.parse(data));
    });

    register(complexData, "typebox Value.Check (complex)", (data) => {
        do_not_optimize(Value.Check(complexTypeboxSchema, data));
    });

    register(complexData, "typebox compiled (complex)", (data) => {
        do_not_optimize(compiledComplexTypeboxSchema.Check(data));
    });

    register(complexData, "valibot (complex)", (data) => {
        do_not_optimize(v.parse(complexValibotSchema, data));
    });
});

await run();