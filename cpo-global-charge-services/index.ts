import {CpoConfig} from '../core';
import {GlobalChargeServicesValidator} from "./global-charge-services-validator";
import {GlobalChargeServicesDataProvider} from "./global-charge-services-data";

export default {
    cpoIds: ["CPO"],
    name: "Global Charge Services",
    dataProvider: new GlobalChargeServicesDataProvider(),
    validator: new GlobalChargeServicesValidator(),
} as CpoConfig<GlobalChargeRow>

/**
 * this is currently not in cammelcase,
 * because otherwise I need to have a function that maps from kebab-case to cammelcase
 *(and other way around)
 * to make validation easier
 */
export interface GlobalChargeRow {
    plan_name: string;
    currency: string; // ISO-4217 currency code
    provider: string; // Format: "US*CPO", "ES*CPO"
    price_per_kwh: number;
    hourly_parking_rate: number;
    start_time: string; // e.g., "09:00"
    end_time: string; // e.g., "18:00"
}