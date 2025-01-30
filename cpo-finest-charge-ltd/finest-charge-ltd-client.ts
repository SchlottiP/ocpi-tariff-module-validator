import {FinestChargeTariff} from "./index";

export interface FinestChargeLtdClient {
    fetchTariffs(): Promise<FinestChargeTariff[]>;
}


export class MockFinestChargeLtdClient implements FinestChargeLtdClient {
    async fetchTariffs(): Promise<FinestChargeTariff[]> {
        return Promise.resolve([
            {
                region: "London",
                price_per_kwh: 0.28,
                parking_fee_per_hour: 3.00,
                connection_fee: 1.00,
            },
            {
                region: "Other",
                price_per_kwh: 0.25,
                parking_fee_per_hour: 2.00,
            },
            {
                region: "Manchester",
                price_per_kwh: 0.27,
                parking_fee_per_hour: 2.50,
                connection_fee: 1.00,
            },
        ]);
    }
}