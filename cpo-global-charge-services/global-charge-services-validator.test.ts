import * as fs from "fs";
import {GlobalChargeServicesValidator} from "./global-charge-services-validator";
import {Tariff, TariffDimensionType, TariffType, ValidationTariffData} from "../core/tariff.model";
import {ValidationResult} from "../core/tariff-validation.model";
import {GlobalChargeRow} from "./index";

describe('GlobalChargeServicesValidator.validateData', () => {
    let validator: GlobalChargeServicesValidator;

    beforeEach(() => {
        validator = new GlobalChargeServicesValidator();
    });

    it('should validate successfully when all CPO tariffs match ENAPI tariffs', () => {
        const cpoData: GlobalChargeRow[] = [
            {
                plan_name: 'Basic Plan',
                currency: 'USD',
                provider: 'US*CPO',
                price_per_kwh: 0.25,
                hourly_parking_rate: 2.0,
                start_time: '09:00',
                end_time: '18:00',
            },
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: 'tariff-id-1',
                currency: 'USD',
                party_id: 'CPO',
                country_code: 'US',
                type: TariffType.REGULAR,
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.25, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 2.0, step_size: 0.01},
                        ],
                        restrictions: {start_time: '09:00', end_time: '18:00'},
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual<ValidationResult[]>([
            {isValid: true, discrepancies: []},
        ]);
    });

    it('should report missing ENAPI tariff for a CPO tariff', () => {
        const cpoData: GlobalChargeRow[] = [
            {
                plan_name: 'Basic Plan',
                currency: 'USD',
                provider: 'US*CPO',
                price_per_kwh: 0.25,
                hourly_parking_rate: 2.0,
                start_time: '09:00',
                end_time: '18:00',
            },
        ];

        const enapiTariffs: Tariff[] = [];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual<ValidationResult[]>([
            {
                isValid: false,
                discrepancies: [
                    'Missing ENAPI tariff for CPO tariff with provider: US*CPO, plan name: Basic Plan.',
                ],
            },
        ]);
    });

    it('should report ambiguous matches when multiple ENAPI tariffs match a CPO tariff', () => {
        const cpoData: GlobalChargeRow[] = [
            {
                plan_name: 'Basic Plan',
                currency: 'USD',
                provider: 'US*CPO',
                price_per_kwh: 0.25,
                hourly_parking_rate: 2.0,
                start_time: '09:00',
                end_time: '18:00',
            },
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: 'tariff-id-1',
                currency: 'USD',
                party_id: 'CPO',
                country_code: 'US',
                type: TariffType.REGULAR,
                elements: [
                    {
                        price_components: [{type: TariffDimensionType.ENERGY, price: 0.25, step_size: 0.01}],
                    },
                ],
            },
            {
                id: 'tariff-id-2',
                currency: 'USD',
                party_id: 'CPO',
                country_code: 'US',
                type: TariffType.REGULAR,
                elements: [
                    {
                        price_components: [{type: TariffDimensionType.ENERGY, price: 0.25, step_size: 0.01}],
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual<ValidationResult[]>([
            {
                isValid: false,
                discrepancies: [
                    `Ambiguous match for CPO tariff with provider: US*CPO, plan name: Basic Plan. Matches: ${JSON.stringify(
                        enapiTariffs
                    )}`,
                ],
            },
        ]);
    });

    it('should report ENAPI tariffs that do not match any CPO tariffs', () => {
        const cpoData: GlobalChargeRow[] = [
            {
                plan_name: 'Basic Plan',
                currency: 'USD',
                provider: 'US*CPO',
                price_per_kwh: 0.25,
                hourly_parking_rate: 2.0,
                start_time: '09:00',
                end_time: '18:00',
            },
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: 'tariff-id-1',
                currency: 'USD',
                party_id: 'CPO',
                country_code: 'US',
                type: TariffType.REGULAR,
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.25, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 2.0, step_size: 0.01},
                        ],
                        restrictions: {start_time: '09:00', end_time: '18:00'},
                    },
                ],
            },
            {
                id: 'tariff-id-2',
                currency: 'USD',
                party_id: 'CPO',
                country_code: 'DE',
                type: TariffType.REGULAR,
                elements: [
                    {
                        price_components: [{type: TariffDimensionType.ENERGY, price: 0.30, step_size: 0.01}],
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual<ValidationResult[]>([
            {isValid: true, discrepancies: []},
            {
                isValid: false,
                discrepancies: [
                    `Found Enapi tariffs without a matching tariff in the CPO list: ${JSON.stringify(
                        [enapiTariffs[1]]
                    )}`,
                ],
            },
        ]);
    });

    it('should handle multiple validation results correctly', () => {
        const cpoData: GlobalChargeRow[] = [
            {
                plan_name: 'Basic Plan',
                currency: 'USD',
                provider: 'US*CPO',
                price_per_kwh: 0.11,
                hourly_parking_rate: 2.0,
                start_time: '09:00',
                end_time: '18:00',
            },
            {
                plan_name: 'Value Plan',
                currency: 'EUR',
                provider: 'ES*CPO',
                price_per_kwh: 0.20,
                hourly_parking_rate: 1.5,
                start_time: '10:00',
                end_time: '20:00',
            },
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: 'tariff-id-1',
                currency: 'USD',
                party_id: 'CPO',
                country_code: 'US',
                type: TariffType.REGULAR,
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.25, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 2.0, step_size: 0.01},
                        ],
                        restrictions: {start_time: '09:00', end_time: '18:00'},
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual<ValidationResult[]>([
            {
                isValid: false,
                discrepancies: [
                    "Price per kWh mismatch: CPO (0.11) vs ENAPI (0.25).",
                ],
            },
            {
                isValid: false,
                discrepancies: [
                    'Missing ENAPI tariff for CPO tariff with provider: ES*CPO, plan name: Value Plan.',
                ],
            },
        ]);
    });
});