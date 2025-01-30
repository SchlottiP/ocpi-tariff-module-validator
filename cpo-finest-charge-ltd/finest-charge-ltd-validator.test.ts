import {TariffDimensionType, ValidationTariffData} from "../core/tariff.model";
import {FinestChargeTariff} from "./index";
import {FinestChargeLtdValidator} from "./finest-charge-ltd-validator";

describe("FinestChargeLtdData.validateData", () => {
    let validator: FinestChargeLtdValidator;

    beforeEach(() => {
        validator = new FinestChargeLtdValidator();
    });

    it("should validate matching tariffs successfully", () => {
        const cpoData: FinestChargeTariff[] = [
            {region: "London", price_per_kwh: 0.28, parking_fee_per_hour: 3.00},
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: "London",
                party_id: "not-relevant",
                country_code: "GB",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.28, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 3.00, step_size: 0.01},
                        ],
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual([
            {isValid: true, discrepancies: []},
        ]);
    });

    it("should detect missing ENAPI tariffs", () => {
        const cpoData: FinestChargeTariff[] = [
            {region: "London", price_per_kwh: 0.28, parking_fee_per_hour: 3.00},
            {region: "Manchester", price_per_kwh: 0.27, parking_fee_per_hour: 2.50},
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: "London",
                party_id: "not_relevant",
                country_code: "GB",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.28, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 3.00, step_size: 0.01},
                        ],
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual([
            {isValid: true, discrepancies: []},
            {
                isValid: false,
                discrepancies: [
                    "No matching ENAPI tariff found for region: Manchester",
                ],
            },
        ]);
    });

    it("should detect ambiguous ENAPI tariffs", () => {
        const cpoData: FinestChargeTariff[] = [
            {region: "London", price_per_kwh: 0.28, parking_fee_per_hour: 3.00},
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: "London",
                party_id: "not-relevant",
                country_code: "GB",
                currency: "GBP",
                elements: [
                    {price_components: [{type: TariffDimensionType.ENERGY, price: 0.28, step_size: 0.01}]},
                ],
            },
            {
                id: "London",
                party_id: "not-relevant",
                country_code: "GB",
                currency: "GBP",
                elements: [
                    {price_components: [{type: TariffDimensionType.ENERGY, price: 0.28, step_size: 0.01}]},
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual([
            {
                isValid: false,
                discrepancies: [
                    `Ambiguous matches for region: London. Matches: ${JSON.stringify(
                        enapiTariffs
                    )}`,
                ],
            },
        ]);
    });

    it("should detect unmatched ENAPI tariffs", () => {
        const cpoData: FinestChargeTariff[] = [
            {region: "London", price_per_kwh: 0.28, parking_fee_per_hour: 3.00},
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: "London",
                party_id: "not-relevant",
                country_code: "GB",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.28, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 3.00, step_size: 0.01},
                        ],
                    },
                ],
            },
            {
                id: "Manchester",
                country_code: "GB",
                party_id: "not-relevant",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.27, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 2.50, step_size: 0.01},
                        ],
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual([
            {isValid: true, discrepancies: []},
            {
                isValid: false,
                discrepancies: [
                    `ENAPI tariffs without matching Finest Charge Ltd tariffs: ${JSON.stringify([
                        enapiTariffs[1],
                    ])}`,
                ],
            },
        ]);
    });

    it("should validate discrepancies in individual fields", () => {
        const cpoData: FinestChargeTariff[] = [
            {region: "London", price_per_kwh: 0.30, parking_fee_per_hour: 3.50},
        ];

        const enapiTariffs: ValidationTariffData[] = [
            {
                id: "London",
                country_code: "GB",
                party_id: "not-relevant",
                currency: "GBP",
                elements: [
                    {
                        price_components: [
                            {type: TariffDimensionType.ENERGY, price: 0.28, step_size: 0.01},
                            {type: TariffDimensionType.PARKING_TIME, price: 3.00, step_size: 0.01},
                        ],
                    },
                ],
            },
        ];

        const results = validator.validateData(cpoData, enapiTariffs);

        expect(results).toEqual([
            {
                isValid: false,
                discrepancies: [
                    `Price per kWh mismatch for region London: CPO (0.3) vs ENAPI (0.28).`,
                    `Parking fee mismatch for region London: CPO (3.5) vs ENAPI (3).`,
                ],
            },
        ]);
    });
});