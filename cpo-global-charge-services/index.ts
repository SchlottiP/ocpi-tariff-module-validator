import {CpoConfig, validateTariff} from '../core';
import {GlobalChargeServicesValidator} from "./global-charge-services-validator";

const validateGlobalCharge = (): string => {
    return "cpo-global-charge-service " + validateTariff()
};

export default {
    cpoIds: ["global-charge-services"],
    name: "Global Charge Services",
    implementation: new GlobalChargeServicesValidator(),
} as CpoConfig