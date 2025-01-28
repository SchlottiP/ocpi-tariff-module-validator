import {CpoValidationDataProvider} from "./tariff-validation.model";

export const validateTariff = (): string => {
    return "validate"
};

export interface CpoConfig {
    // One CPO can have several SUP CPO's (e.g. Global Charge Services Co.)
    cpoIds: string[];
    name: string;
    implementation: CpoValidationDataProvider<Object>;
}