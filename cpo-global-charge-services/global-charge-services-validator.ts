import {CpoValidationDataProvider, ValidationResult} from "../core/tariff-validation.model";
import {readFileSync} from "fs";
import { TariffElement, ValidationTariffData} from "../core/tariff.model";
import {splitProvider} from "./utilities";


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


export class GlobalChargeServicesValidator
    implements CpoValidationDataProvider<GlobalChargeRow> {
    /**
     * Parse the CSV input into an array of GlobalChargeRow objects.
     * @param inputFilePath - Path to the CSV input file
     */
    getData(inputFilePath: string): GlobalChargeRow[] {
        const csv = readFileSync(inputFilePath, "utf8");

        // Split rows by newline and columns by ";"
        const rows = csv.trim().split("\n").map((row) => row.split(";"));

        if (rows.length < 2) {
            throw new Error("The CSV file is empty or has insufficient data.");
        }


        const actualHeaders = rows[0];
        this.validateHeader(actualHeaders);

        return rows.slice(1).map((row, index) => {
            const data: any = {};
            actualHeaders.forEach((header, i) => {
                data[header] = this.parseValue(header as keyof GlobalChargeRow, row[i]);
            });

            return data as GlobalChargeRow;
        });
    }

    /**
     * Parses a value based on its key.
     * @param key - The key of the field being parsed.
     * @param value - The raw value from the CSV.
     */
    private parseValue(key: keyof GlobalChargeRow, value: string): any {
        if (key === "price_per_kwh" || key === "hourly_parking_rate") {
            const parsedValue = parseFloat(value);
            if (isNaN(parsedValue)) {
                throw new Error(`Invalid number for key '${key}': ${value}`);
            }
            return parsedValue;
        }
        return value.trim();
    }


    /**
     * Validates the headers in the CSV against the keys of the specified interface.
     * @param actualHeaders - Headers extracted from the CSV file.
     */
    private validateHeader(actualHeaders: string[]): void {
        //done like this to get keys at runtime but still typesavety
        var emptyRow: GlobalChargeRow = {
            plan_name: "",
            currency: "",
            provider: "",
            price_per_kwh: 0,
            hourly_parking_rate: 0,
            start_time: "",
            end_time: "",
        }
        const expectedHeaders = Object.keys(emptyRow)
        const missingHeaders = expectedHeaders.filter(
            (key) => !actualHeaders.includes(key)
        );

        const unexpectedHeaders = actualHeaders.filter(
            (key) => !expectedHeaders.includes(key)
        );

        if (missingHeaders.length > 0) {
            throw new Error(`Missing headers in CSV: ${missingHeaders.join(", ")}.`);
        }

        if (unexpectedHeaders.length > 0) {
            throw new Error(`Unexpected headers in CSV: ${unexpectedHeaders.join(", ")}.`);
        }
    }

    /**
     * Validate the parsed CPO data against the ENAPI tariffs.
     * @param cpoData - Array of GlobalChargeRow objects
     * @param enapiTariffs - Array of Tariff objects from ENAPI
     */
    validateData(
        cpoData: GlobalChargeRow[],
        enapiTariffs: ValidationTariffData[]
    ): ValidationResult[] {
        const results: ValidationResult[] = [];
        var notMatchedTariffs = [...enapiTariffs]
        for (const cpoTariff of cpoData) {
            const provider = splitProvider(cpoTariff.provider)
            const matchingEnapiTariffs = notMatchedTariffs.filter(enapiTariff => provider.partyId === enapiTariff.party_id &&
                provider.countryCode === enapiTariff.country_code)
            if (matchingEnapiTariffs.length == 0) {
                results.push({
                    isValid: false,
                    discrepancies: [
                        `Missing ENAPI tariff for CPO tariff with provider: ${cpoTariff.provider}, plan name: ${cpoTariff.plan_name}.`
                    ],
                })
            } else if (matchingEnapiTariffs.length > 1) {
                results.push({
                    isValid: false,
                    discrepancies: [
                        `Ambiguous match for CPO tariff with provider: ${cpoTariff.provider}, plan name: ${cpoTariff.plan_name}. Matches: ${JSON.stringify(
                            matchingEnapiTariffs
                        )}`,
                    ],
                })
            } else {
                results.push(this.validateFields(cpoTariff, matchingEnapiTariffs[0]));
            }
            notMatchedTariffs = [...notMatchedTariffs.filter(it =>  !matchingEnapiTariffs.map(matchingTariffs => matchingTariffs.id).includes(it.id))]
        }

        if (notMatchedTariffs.length != 0) {
            results.push({
                isValid: false,
                discrepancies: [
                    `Found Enapi tariffs without a matching tariff in the CPO list: ${JSON.stringify(
                        notMatchedTariffs
                    )}`,
                ],
            })
        }

        return results;
    }

    private validateFields(cpoTariff: GlobalChargeRow, enapiTariff: ValidationTariffData): ValidationResult {
        const discrepancies: string[] = [];

        // Ensure only one element is present in enapiTariff
        if (enapiTariff.elements.length !== 1) {
            discrepancies.push(
                `Tariff ${enapiTariff.id} has ${enapiTariff.elements.length} elements, expected exactly 1.`
            );
            return {isValid: false, discrepancies};
        }

        const tariffElement = enapiTariff.elements[0]; // The single element for validation

        // Field-specific validations
        discrepancies.push(...this.validatePricePerKwh(cpoTariff, tariffElement));
        discrepancies.push(...this.validateHourlyParkingRate(cpoTariff, tariffElement));
        discrepancies.push(...this.validateCurrency(cpoTariff, enapiTariff));
        discrepancies.push(...this.validateStartTime(cpoTariff, tariffElement));
        discrepancies.push(...this.validateEndTime(cpoTariff, tariffElement));
        discrepancies.push(...this.validateChargingSpeedType(cpoTariff, enapiTariff));

        return {
            isValid: discrepancies.length === 0,
            discrepancies,
        };
    }

    private validatePricePerKwh(cpoTariff: GlobalChargeRow, tariffElement: TariffElement): string[] {
        const discrepancies: string[] = [];
        const enapiPricePerKwh = tariffElement.price_components.find(
            (component) => component.type === "ENERGY"
        )?.price;

        if (cpoTariff.price_per_kwh !== enapiPricePerKwh) {
            discrepancies.push(
                `Price per kWh mismatch: CPO (${cpoTariff.price_per_kwh}) vs ENAPI (${enapiPricePerKwh}).`
            );
        }

        return discrepancies;
    }

    private validateHourlyParkingRate(cpoTariff: GlobalChargeRow, tariffElement: TariffElement): string[] {
        const discrepancies: string[] = [];
        const enapiParkingRate = tariffElement.price_components.find(
            (component) => component.type === "PARKING_TIME"
        )?.price;

        if (cpoTariff.hourly_parking_rate !== enapiParkingRate) {
            discrepancies.push(
                `Hourly parking rate mismatch: CPO (${cpoTariff.hourly_parking_rate}) vs ENAPI (${enapiParkingRate}).`
            );
        }

        return discrepancies;
    }

    private validateCurrency(cpoTariff: GlobalChargeRow, enapiTariff: ValidationTariffData): string[] {
        const discrepancies: string[] = [];
        if (cpoTariff.currency !== enapiTariff.currency) {
            discrepancies.push(
                `Currency mismatch: CPO (${cpoTariff.currency}) vs ENAPI (${enapiTariff.currency}).`
            );
        }

        return discrepancies;
    }

    private validateStartTime(cpoTariff: GlobalChargeRow, tariffElement: TariffElement): string[] {
        const discrepancies: string[] = [];
        if (cpoTariff.start_time !== tariffElement.restrictions?.start_time) {
            discrepancies.push(
                `Start time mismatch: CPO (${cpoTariff.start_time}) vs ENAPI (${tariffElement.restrictions?.start_time}).`
            );
        }

        return discrepancies;
    }

    private validateEndTime(cpoTariff: GlobalChargeRow, tariffElement: TariffElement): string[] {
        const discrepancies: string[] = [];
        if (cpoTariff.end_time !== tariffElement.restrictions?.end_time) {
            discrepancies.push(
                `End time mismatch: CPO (${cpoTariff.end_time}) vs ENAPI (${tariffElement.restrictions?.end_time}).`
            );
        }

        return discrepancies;
    }

    private validateChargingSpeedType(cpoTariff: GlobalChargeRow, enapiTariff: ValidationTariffData): string[] {
        const discrepancies: string[] = [];
        const planName = cpoTariff.plan_name.toLowerCase();

        if (planName.includes("fast") && enapiTariff.type !== "PROFILE_FAST") {
            discrepancies.push(
                `Charging speed mismatch: CPO plan (${cpoTariff.plan_name}) suggests fast charging, but ENAPI tariff type is ${enapiTariff.type}.`
            );
        } else if (planName.includes("value") && enapiTariff.type !== "PROFILE_CHEAP") {
            discrepancies.push(
                `Charging speed mismatch: CPO plan (${cpoTariff.plan_name}) suggests value charging, but ENAPI tariff type is ${enapiTariff.type}.`
            );
        }

        return discrepancies;
    }
}