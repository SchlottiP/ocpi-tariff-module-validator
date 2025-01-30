import {CpoDataProvider} from "../core/tariff-validation.model";
import {FinestChargeLtdClient, MockFinestChargeLtdClient} from "./finest-charge-ltd-client";
import {FinestChargeTariff} from "./index";

export class FinestChargeLtdDataProvider implements CpoDataProvider<FinestChargeTariff> {
    private client: FinestChargeLtdClient;

    constructor(client?: FinestChargeLtdClient) {
        this.client = client || new MockFinestChargeLtdClient();
    }

    async getData(): Promise<FinestChargeTariff[]> {
        return this.client.fetchTariffs();
    }
}