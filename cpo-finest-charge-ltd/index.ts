
import {GlobalChargeServicesValidator} from "../cpo-global-charge-services/global-charge-services-validator";
import {CpoConfig} from "../core";
import {FinestChargeLtdDataProvider} from "./finest-charge-ltd-data.ts";
import {FinestChargeLtdValidator} from "./finest-charge-ltd-validator";

export default {
    cpoIds: ["FIN"],
    name: "FinestChargeLtd",
    dataProvider: new FinestChargeLtdDataProvider(),
    validator: new FinestChargeLtdValidator()
} as CpoConfig<FinestChargeTariff>


export interface FinestChargeTariff {
    // I use this as tariff id for simplification
    region: string;
    price_per_kwh: number;
    parking_fee_per_hour: number;
    connection_fee?: number;
}
