import { faker } from "@faker-js/faker";

export function generateEventData(count: number) {
    const data: any[] = [];

    const connectionTypes = [
        '4g', 'wifi', 'ethernet', 'slow-2g', '2g', '3g', 'unknown'
    ];

    for (let i = 0; i < count; i++) {
        data.push({
            eventId: faker.string.uuid(),
            name: faker.lorem.word(),
            anonymousId: faker.string.uuid(),
            sessionId: faker.string.uuid(),
            timestamp: faker.date.recent().getTime(),
            sessionStartTime: faker.date.recent().getTime(),
            referrer: faker.internet.url(),
            path: faker.internet.url(),
            title: faker.lorem.sentence(),
            screen_resolution: `${faker.number.int({ min: 800, max: 3840 })}x${faker.number.int({ min: 600, max: 2160 })}`,
            viewport_size: `${faker.number.int({ min: 400, max: 1920 })}x${faker.number.int({ min: 300, max: 1080 })}`,
            language: faker.helpers.arrayElement(['en', 'en-US', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh']),
            timezone: faker.location.timeZone(),
            connection_type: faker.helpers.arrayElement(connectionTypes),
            rtt: faker.number.int({ min: 10, max: 500 }),
            downlink: faker.number.float({ min: 0.1, max: 100 }),
            time_on_page: faker.number.int({ min: 1000, max: 300000 }),
            scroll_depth: faker.number.float({ min: 0, max: 100 }),
            interaction_count: faker.number.int({ min: 0, max: 50 }),
            page_count: faker.number.int({ min: 1, max: 20 }),
            utm_source: faker.company.name(),
            utm_medium: faker.helpers.arrayElement(['organic', 'paid', 'email', 'social', 'referral']),
            utm_campaign: faker.lorem.words(2),
            utm_term: faker.lorem.word(),
            utm_content: faker.lorem.words(3),
            load_time: faker.number.int({ min: 100, max: 5000 }),
            dom_ready_time: faker.number.int({ min: 50, max: 3000 }),
            dom_interactive: faker.number.int({ min: 80, max: 2000 }),
            ttfb: faker.number.int({ min: 20, max: 1000 }),
            render_time: faker.number.int({ min: 10, max: 500 }),
            redirect_time: faker.number.int({ min: 0, max: 200 }),
            domain_lookup_time: faker.number.int({ min: 5, max: 100 }),
            href: faker.internet.url(),
            text: faker.lorem.paragraph(),
            value: faker.lorem.word(),
            properties: {
                [faker.lorem.word()]: faker.lorem.word(),
                [faker.lorem.word()]: faker.number.int({ min: 1, max: 100 }),
                [faker.lorem.word()]: faker.datatype.boolean(),
            },
        });
    }

    return data;
}
