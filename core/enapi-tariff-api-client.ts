import {Tariff, TariffDimensionType} from "./tariff.model";

/*
    * Prototyping quality, missing pagination (and any kind of updatedAt handling)
    * missing all the authentication/connection related, this is also why this currently only get's the cpoId as an input
    * it's expected that this only returns tariffs that are currently valid
     */

export interface EnapiApiClient {

    fetchTariffs(cpoIds: string[]): Promise<Tariff[]>;
}


function generateLastUpdated(daysAgo: number= 1): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
}

export class EnapiApiClientMockImplementation implements EnapiApiClient {
    private apiBaseUrl: string;

    constructor(apiBaseUrl: string) {
        this.apiBaseUrl = apiBaseUrl;
    }

    async fetchTariffs(cpoIds: string[]): Promise<Tariff[]> {
        const exampleTariffs: Tariff[] = [
            // Global Charge Services (CPO) Tariffs
            {
                country_code: "US",
                party_id: "CPO",
                id: "basic-plan",
                currency: "USD",
                elements: [
                    {
                        price_components: [
                            { type: TariffDimensionType.ENERGY, price: 0.25, step_size: 1 },
                        ],
                        restrictions: { start_time: "09:00", end_time: "18:00" },
                    },
                ],
                last_updated: generateLastUpdated(),
            },
            {
                country_code: "GB",
                party_id: "CPO",
                id: "green-energy-plan",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            { type: TariffDimensionType.ENERGY, price: 0.20, step_size: 1 },
                            { type: TariffDimensionType.PARKING_TIME, price: 1.80, step_size: 900 },
                        ],
                        restrictions: { start_time: "09:00", end_time: "18:00" },
                    },
                ],
                last_updated: generateLastUpdated(),
            },
            // Finest Charge Ltd (FIN) Tariffs
            {
                country_code: "GB",
                party_id: "FIN",
                id: "London",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            { type: TariffDimensionType.ENERGY, price: 0.28, step_size: 1 },
                            { type: TariffDimensionType.PARKING_TIME, price: 3.0, step_size: 900 },
                            { type: TariffDimensionType.FLAT, price: 1.0, step_size: 900 },
                        ],
                    },
                ],
                last_updated: generateLastUpdated(),
            },
            {
                country_code: "GB",
                party_id: "FIN",
                id: "Manchester",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            { type: TariffDimensionType.ENERGY, price: 0.27, step_size: 1 },
                            { type: TariffDimensionType.PARKING_TIME, price: 2.5, step_size: 900 },
                        ],
                    },
                ],
                last_updated: generateLastUpdated(),
            },
        ];

        return Promise.resolve(
            exampleTariffs.filter((tariff) => cpoIds.includes(tariff.party_id))
        );
    }
}