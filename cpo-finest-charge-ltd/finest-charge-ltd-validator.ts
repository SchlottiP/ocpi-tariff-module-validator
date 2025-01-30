/**
 * Interface representing a single Finest Charge Ltd tariff.
 */
import {CpoValidationProvider, ValidationResult} from "../core/tariff-validation.model";
import {TariffDimensionType, TariffElement, ValidationTariffData} from "../core/tariff.model";
import {FinestChargeTariff} from "./index";


export class FinestChargeLtdValidator implements CpoValidationProvider<FinestChargeTariff> {

    /**
     * this does not check:
     * - step_size (it's expected to be 0.01)
     * - party-id because this CPO has only one CPO-id not several sub CPO-ids
     * @param cpoData
     * @param enapiTariffs
     */
    validateData(cpoData: FinestChargeTariff[], enapiTariffs: ValidationTariffData[]): ValidationResult[] {
        const results: ValidationResult[] = [];
        let unmatchedTariffs = [...enapiTariffs];

        for (const cpoTariff of cpoData) {
            const matchingEnapiTariffs = unmatchedTariffs.filter(
                (enapiTariff) => enapiTariff.id === cpoTariff.region
            );

            if (matchingEnapiTariffs.length === 0) {
                results.push({
                    isValid: false,
                    discrepancies: [`No matching ENAPI tariff found for region: ${cpoTariff.region}`],
                });
            } else if (matchingEnapiTariffs.length > 1) {
                results.push({
                    isValid: false,
                    discrepancies: [
                        `Ambiguous matches for region: ${cpoTariff.region}. Matches: ${JSON.stringify(
                            matchingEnapiTariffs
                        )}`,
                    ],
                });
            } else {
                results.push(this.validateFields(cpoTariff, matchingEnapiTariffs[0]));
            }
            unmatchedTariffs = unmatchedTariffs.filter((tariff) => tariff.id !== cpoTariff.region);
        }

        if (unmatchedTariffs.length > 0) {
            results.push({
                isValid: false,
                discrepancies: [
                    `ENAPI tariffs without matching Finest Charge Ltd tariffs: ${JSON.stringify(
                        unmatchedTariffs
                    )}`,
                ],
            });
        }

        return results;
    }


    private validateFields(cpoTariff: FinestChargeTariff, enapiTariff: ValidationTariffData): ValidationResult {
        const discrepancies: string[] = [];
        if (enapiTariff.elements.length !== 1) {
            discrepancies.push(
                `Tariff ${enapiTariff.id} has ${enapiTariff.elements.length} elements, expected exactly 1.`
            );
            return {isValid: false, discrepancies};
        }
        const tariffElement = enapiTariff.elements[0];

        discrepancies.push(...this.validateCountryCode(enapiTariff));
        discrepancies.push(...this.validateCurrency(enapiTariff));
        discrepancies.push(...this.validatePricePerKwh(cpoTariff, tariffElement));
        discrepancies.push(...this.validateHourlyParkingRate(cpoTariff, tariffElement));
        discrepancies.push(...this.validateConnectionFee(cpoTariff, tariffElement));

        return {
            isValid: discrepancies.length === 0,
            discrepancies,
        };
    }

    private validateCountryCode(enapiTariff: ValidationTariffData): string[] {
        const discrepancies: string[] = [];
        if (enapiTariff.country_code !== "GB") {
            discrepancies.push(`Country code mismatch: Expected GB, but found '${enapiTariff.country_code}'.`);
        }
        return discrepancies;
    }

    private validateCurrency(enapiTariff: ValidationTariffData): string[] {
        const discrepancies: string[] = [];
        if (enapiTariff.currency !== "GBP") {
            discrepancies.push(`Currency mismatch: Expected 'GBP' but found '${enapiTariff.currency}'.`);
        }
        return discrepancies;
    }

    private validatePricePerKwh(cpoTariff: FinestChargeTariff, tariffElement: TariffElement): string[] {
        const discrepancies: string[] = [];
        const energyComponent = tariffElement.price_components.find((c) => c.type === TariffDimensionType.ENERGY);
        if (energyComponent?.price !== cpoTariff.price_per_kwh) {
            discrepancies.push(
                `Price per kWh mismatch for region ${cpoTariff.region}: CPO (${cpoTariff.price_per_kwh}) vs ENAPI (${energyComponent?.price}).`
            );
        }
        return discrepancies;
    }

    private validateHourlyParkingRate(cpoTariff: FinestChargeTariff, tariffElement: TariffElement): string[] {
        const discrepancies: string[] = [];
        const parkingComponent = tariffElement.price_components.find((c) => c.type === TariffDimensionType.PARKING_TIME);
        if (parkingComponent?.price !== cpoTariff.parking_fee_per_hour) {
            discrepancies.push(
                `Parking fee mismatch for region ${cpoTariff.region}: CPO (${cpoTariff.parking_fee_per_hour}) vs ENAPI (${parkingComponent?.price}).`
            );
        }
        return discrepancies;
    }

    private validateConnectionFee(cpoTariff: FinestChargeTariff, tariffElement: TariffElement): string[] {
        const discrepancies: string[] = [];
        if (cpoTariff.connection_fee !== undefined) {
            const connectionComponent = tariffElement.price_components.find((c) => c.type === TariffDimensionType.FLAT);
            if (connectionComponent?.price !== cpoTariff.connection_fee) {
                discrepancies.push(
                    `Connection fee mismatch for region ${cpoTariff.region}: CPO (${cpoTariff.connection_fee}) vs ENAPI (${connectionComponent?.price}).`
                );
            }
        }
        return discrepancies;
    }
}