import * as fs from "fs";
import {GlobalChargeRow, GlobalChargeServicesValidator} from "./global-charge-services-validator";
import {Tariff, TariffDimensionType, TariffType, ValidationTariffData} from "../core/tariff.model";
import {ValidationResult} from "../core/tariff-validation.model";

jest.mock("fs");

describe("GlobalChargeServicesValidator.getData", () => {
    let validator: GlobalChargeServicesValidator;

    beforeEach(() => {
        validator = new GlobalChargeServicesValidator();
    });

    it("should correctly load valid rows with proper headers", () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time;end_time
Basic Plan;USD;US*CPO;0.25;2.00;09:00;18:00
Value Rate;EUR;ES*CPO;0.32;2.50;09:00;18:00`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        const result = validator.getData("mock.csv");

        expect(result).toEqual<GlobalChargeRow[]>([
            {
                plan_name: "Basic Plan",
                currency: "USD",
                provider: "US*CPO",
                price_per_kwh: 0.25,
                hourly_parking_rate: 2,
                start_time: "09:00",
                end_time: "18:00",
            },
            {
                plan_name: "Value Rate",
                currency: "EUR",
                provider: "ES*CPO",
                price_per_kwh: 0.32,
                hourly_parking_rate: 2.5,
                start_time: "09:00",
                end_time: "18:00",
            },
        ]);
    });

    it("should throw an error if headers are missing", () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time
Basic Plan;USD;US*CPO;0.25;2.00;09:00`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => validator.getData("mock.csv")).toThrowError(
            "Missing headers in CSV: end_time."
        );
    });

    it("should throw an error if there are unexpected headers", () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time;end_time;extra_column
Basic Plan;USD;US*CPO;0.25;2.00;09:00;18:00;unexpected_value`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => validator.getData("mock.csv")).toThrowError(
            "Unexpected headers in CSV: extra_column."
        );
    });

    it("should throw an error if the CSV file is empty", () => {
        const mockCsv = "";

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => validator.getData("mock.csv")).toThrowError(
            "The CSV file is empty or has insufficient data."
        );
    });

    it("should throw an error if a row has an invalid numeric value", () => {
        const mockCsv = `plan_name;currency;provider;price_per_kwh;hourly_parking_rate;start_time;end_time
Basic Plan;USD;US*CPO;invalid_value;2.00;09:00;18:00`;

        (fs.readFileSync as jest.Mock).mockReturnValue(mockCsv);

        expect(() => validator.getData("mock.csv")).toThrowError(
            "Invalid number for key 'price_per_kwh': invalid_value"
        );
    });
});

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