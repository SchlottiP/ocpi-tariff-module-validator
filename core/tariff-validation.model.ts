import {ValidationTariffData} from "./tariff.model";

export interface ValidationResult {
    isValid: boolean;
    discrepancies: string[];
}

export interface CpoValidationProvider<T> {
    validateData(cpoData: T[], enapiTariffs: ValidationTariffData[]): ValidationResult[];
}

export interface CpoDataProvider<T> {
    getData(inputFilePath? : string): Promise<T[]>
}