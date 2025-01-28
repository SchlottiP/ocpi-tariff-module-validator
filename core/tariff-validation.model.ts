import {Tariff, ValidationTariffData} from "./tariff.model";

export interface ValidationResult {
    isValid: boolean;
    discrepancies: string[];
}

export interface CpoValidationDataProvider<T> {
    getData(inputFilePath? : string): T[]
    validateData(cpoData: T[], enapiTariffs: ValidationTariffData[]): ValidationResult[];
}