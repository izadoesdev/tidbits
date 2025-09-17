import z from "zod/v4";
import Type, { type Static } from "typebox";
import Value from "typebox/value";
import { Compile } from "typebox/compile";
import * as v from "valibot";
import chalk from "chalk";
import { faker } from "@faker-js/faker";

const CONFIG = {
    dataPoints: 50000,
    iterations: 3,
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

function benchmark(name: string, fn: () => void, iterations: number = 1): number {
    const times: number[] = [];

    try {
        fn();
    } catch (error) {
        console.log(chalk.red(`❌ ${name} failed during warmup:`));
        console.log(chalk.red(error));
        return Infinity;
    }

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        try {
            fn();
            const end = performance.now();
            times.push(end - start);
        } catch (error) {
            console.log(chalk.red(`❌ ${name} failed on iteration ${i + 1}:`));
            console.log(chalk.red(error));
            return Infinity;
        }
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const avgColor = avgTime < 10 ? chalk.green : avgTime < 50 ? chalk.yellow : chalk.red;

    console.log(chalk.bold.blue(`${name}:`));
    console.log(`  ${chalk.gray('Average:')} ${avgColor(avgTime.toFixed(2) + 'ms')}`);
    console.log(`  ${chalk.gray('Min:')} ${chalk.green(minTime.toFixed(2) + 'ms')}`);
    console.log(`  ${chalk.gray('Max:')} ${chalk.red(maxTime.toFixed(2) + 'ms')}`);
    console.log("");

    return avgTime;
}

function formatThroughput(dataPoints: number, timeMs: number): string {
    const throughput = Math.round(dataPoints / (timeMs / 1000));
    if (throughput >= 1000000) {
        return chalk.green.bold(`${(throughput / 1000000).toFixed(1)}M/s`);
    } else if (throughput >= 1000) {
        return chalk.cyan.bold(`${(throughput / 1000).toFixed(1)}K/s`);
    } else {
        return chalk.yellow.bold(`${throughput}/s`);
    }
}

function formatSpeedup(baseline: number, comparison: number, name: string): string {
    if (comparison === Infinity) {
        return chalk.red(`${name} failed`);
    }

    const speedup = baseline / comparison;
    const isFaster = speedup > 1;
    const color = isFaster ? chalk.green : chalk.red;
    const arrow = isFaster ? '↗️' : '↘️';

    return `${arrow} ${name} is ${color.bold(speedup.toFixed(1) + 'x')} ${isFaster ? 'faster' : 'slower'} than Zod`;
}

async function runBenchmarks() {
    console.clear();
    console.log(chalk.bold.magenta("Schema Validation Benchmark\n"));

    console.log(chalk.cyan("Configuration:"));
    console.log(`  ${chalk.gray('Data points:')} ${chalk.white.bold(CONFIG.dataPoints.toLocaleString())}`);
    console.log(`  ${chalk.gray('Iterations:')} ${chalk.white.bold(CONFIG.iterations)}`);
    console.log(chalk.gray("─".repeat(50)) + "\n");

    console.log(chalk.yellow("Generating test data..."));
    const simpleData = generateSimpleData(CONFIG.dataPoints);
    const complexData = generateComplexData(CONFIG.dataPoints);
    console.log(chalk.green("Test data generated\n"));

    console.log(chalk.bold.cyan("SIMPLE SCHEMA BENCHMARKS"));
    console.log(chalk.gray("─".repeat(30)));

    const zodSimpleTime = benchmark("Zod (Simple)", () => {
        simpleData.forEach(item => simpleZodSchema.parse(item));
    }, CONFIG.iterations);

    const typeboxSimpleTime = benchmark("TypeBox Value.Check (Simple)", () => {
        simpleData.forEach(item => Value.Check(simpleTypeboxSchema, item));
    }, CONFIG.iterations);

    const typeboxCompiledSimpleTime = benchmark("TypeBox Compiled (Simple)", () => {
        simpleData.forEach(item => compiledSimpleTypeboxSchema.Check(item));
    }, CONFIG.iterations);

    const valibotSimpleTime = benchmark("Valibot (Simple)", () => {
        simpleData.forEach(item => v.parse(simpleValibotSchema, item));
    }, CONFIG.iterations);

    console.log(chalk.bold.cyan("COMPLEX SCHEMA BENCHMARKS"));
    console.log(chalk.gray("─".repeat(30)));

    const zodComplexTime = benchmark("Zod (Complex)", () => {
        complexData.forEach(item => complexZodSchema.parse(item));
    }, CONFIG.iterations);

    const typeboxComplexTime = benchmark("TypeBox Value.Check (Complex)", () => {
        complexData.forEach(item => Value.Check(complexTypeboxSchema, item));
    }, CONFIG.iterations);

    const typeboxCompiledComplexTime = benchmark("TypeBox Compiled (Complex)", () => {
        complexData.forEach(item => compiledComplexTypeboxSchema.Check(item));
    }, CONFIG.iterations);

    const valibotComplexTime = benchmark("Valibot (Complex)", () => {
        complexData.forEach(item => v.parse(complexValibotSchema, item));
    }, CONFIG.iterations);

    console.log(chalk.bold.magenta("PERFORMANCE COMPARISON"));
    console.log(chalk.gray("─".repeat(25)));

    console.log(chalk.bold("Simple Schema:"));
    console.log(`  ${formatSpeedup(zodSimpleTime, typeboxSimpleTime, "TypeBox Value.Check")}`);
    console.log(`  ${formatSpeedup(zodSimpleTime, typeboxCompiledSimpleTime, "TypeBox Compiled")}`);
    console.log(`  ${formatSpeedup(zodSimpleTime, valibotSimpleTime, "Valibot")}`);
    console.log("");

    console.log(chalk.bold("Complex Schema:"));
    console.log(`  ${formatSpeedup(zodComplexTime, typeboxComplexTime, "TypeBox Value.Check")}`);
    console.log(`  ${formatSpeedup(zodComplexTime, typeboxCompiledComplexTime, "TypeBox Compiled")}`);
    console.log(`  ${formatSpeedup(zodComplexTime, valibotComplexTime, "Valibot")}`);
    console.log("");

    console.log(chalk.bold.magenta("THROUGHPUT COMPARISON"));
    console.log(chalk.gray("─".repeat(22)));

    console.log(chalk.bold("Simple Schema:"));
    console.log(`  ${chalk.blue('Zod:')} ${formatThroughput(CONFIG.dataPoints, zodSimpleTime)}`);
    console.log(`  ${chalk.blue('TypeBox Value.Check:')} ${formatThroughput(CONFIG.dataPoints, typeboxSimpleTime)}`);
    console.log(`  ${chalk.blue('TypeBox Compiled:')} ${formatThroughput(CONFIG.dataPoints, typeboxCompiledSimpleTime)}`);
    console.log(`  ${chalk.blue('Valibot:')} ${formatThroughput(CONFIG.dataPoints, valibotSimpleTime)}`);
    console.log("");

    console.log(chalk.bold("Complex Schema:"));
    console.log(`  ${chalk.blue('Zod:')} ${formatThroughput(CONFIG.dataPoints, zodComplexTime)}`);
    console.log(`  ${chalk.blue('TypeBox Value.Check:')} ${formatThroughput(CONFIG.dataPoints, typeboxComplexTime)}`);
    console.log(`  ${chalk.blue('TypeBox Compiled:')} ${formatThroughput(CONFIG.dataPoints, typeboxCompiledComplexTime)}`);
    console.log(`  ${chalk.blue('Valibot:')} ${formatThroughput(CONFIG.dataPoints, valibotComplexTime)}`);

    const fastestSimple = Math.min(zodSimpleTime, typeboxSimpleTime, typeboxCompiledSimpleTime, valibotSimpleTime);
    const fastestComplex = Math.min(zodComplexTime, typeboxComplexTime, typeboxCompiledComplexTime, valibotComplexTime);

    let simpleWinner = "Zod";
    let complexWinner = "Zod";

    if (valibotSimpleTime === fastestSimple) simpleWinner = "Valibot";
    else if (typeboxCompiledSimpleTime === fastestSimple) simpleWinner = "TypeBox Compiled";
    else if (typeboxSimpleTime === fastestSimple) simpleWinner = "TypeBox Value.Check";

    if (valibotComplexTime === fastestComplex) complexWinner = "Valibot";
    else if (typeboxCompiledComplexTime === fastestComplex) complexWinner = "TypeBox Compiled";
    else if (typeboxComplexTime === fastestComplex) complexWinner = "TypeBox Value.Check";

    console.log(chalk.bold.magenta("🏁 PERFORMANCE SUMMARY"));
    console.log(chalk.gray("─".repeat(22)));

    const generateSummary = (title: string, results: Array<{ name: string, time: number }>) => {
        console.log(chalk.bold(`${title}:`));

        const validResults = results.filter(r => r.time !== Infinity);
        const sortedResults = validResults.sort((a, b) => a.time - b.time);
        const fastest = sortedResults[0];

        console.log(chalk.green(`  🏆 ${fastest.name} (fastest)`));

        for (let i = 1; i < sortedResults.length; i++) {
            const result = sortedResults[i];
            const speedup = (fastest.time / result.time).toFixed(2);
            console.log(chalk.gray(`     ${speedup}x slower than ${result.name}`));
        }
    };

    generateSummary("Simple Schema", [
        { name: "Zod", time: zodSimpleTime },
        { name: "TypeBox Value.Check", time: typeboxSimpleTime },
        { name: "TypeBox Compiled", time: typeboxCompiledSimpleTime },
        { name: "Valibot", time: valibotSimpleTime }
    ]);

    console.log("");

    generateSummary("Complex Schema", [
        { name: "Zod", time: zodComplexTime },
        { name: "TypeBox Value.Check", time: typeboxComplexTime },
        { name: "TypeBox Compiled", time: typeboxCompiledComplexTime },
        { name: "Valibot", time: valibotComplexTime }
    ]);

    console.log(chalk.gray("═".repeat(60)));
    console.log(chalk.bold.green("WINNERS:"));
    console.log(`  ${chalk.yellow('Simple Schema:')} ${chalk.green.bold(simpleWinner)}`);
    console.log(`  ${chalk.yellow('Complex Schema:')} ${chalk.green.bold(complexWinner)}`);
}

runBenchmarks().catch(console.error);