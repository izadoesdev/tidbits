import chalk from "chalk";
import { Compile } from "typebox/compile";
import Value from "typebox/value";
import * as v from "valibot";
import { bench, run, summary, do_not_optimize } from "mitata";
import {
    zodEventSchema,
    typeboxEventSchema,
    valibotEventSchema,
    arktypeEventSchema,
    zodSimpleSchema,
    typeboxSimpleSchema,
    valibotSimpleSchema,
    arktypeSimpleSchema,
    generateEventData,
    generateSimpleData,
} from "./schemas/index";

const CONFIG = { dataPoints: 10000 };

const compiledTypeboxSimple = Compile(typeboxSimpleSchema);
const compiledTypeboxEvent = Compile(typeboxEventSchema);

const simpleData = generateSimpleData(CONFIG.dataPoints);
const eventData = generateEventData(CONFIG.dataPoints);

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

async function main() {
    console.clear();
    console.log(chalk.bold.magenta("Schema Validation Benchmark\n"));

    console.log(chalk.cyan(`${CONFIG.dataPoints.toLocaleString()} validations per library\n`));

    console.log(chalk.bold.magenta("Simple Schema"));
    console.log(chalk.gray("─".repeat(30)) + "\n");

    summary(() => {
        register(simpleData, "zod", (data) => {
            do_not_optimize(zodSimpleSchema.parse(data));
        });

        register(simpleData, "typebox", (data) => {
            do_not_optimize(Value.Check(typeboxSimpleSchema, data));
        });

        register(simpleData, "typebox compiled", (data) => {
            do_not_optimize(compiledTypeboxSimple.Check(data));
        });

        register(simpleData, "valibot", (data) => {
            do_not_optimize(v.parse(valibotSimpleSchema, data));
        });

        register(simpleData, "arktype", (data) => {
            do_not_optimize(arktypeSimpleSchema.assert(data));
        });
    });

    await run();

    console.log("\n" + chalk.gray("═".repeat(50)) + "\n");

    console.log(chalk.bold.magenta("Event Schema"));
    console.log(chalk.gray("─".repeat(30)) + "\n");

    summary(() => {
        register(eventData, "zod", (data) => {
            do_not_optimize(zodEventSchema.parse(data));
        });

        register(eventData, "typebox", (data) => {
            do_not_optimize(Value.Check(typeboxEventSchema, data));
        });

        register(eventData, "typebox compiled", (data) => {
            do_not_optimize(compiledTypeboxEvent.Check(data));
        });

        register(eventData, "valibot", (data) => {
            do_not_optimize(v.parse(valibotEventSchema, data));
        });

        register(eventData, "arktype", (data) => {
            do_not_optimize(arktypeEventSchema.assert(data));
        });
    });

    await run();
}

main().catch(console.error);
