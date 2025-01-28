

let cpoImplementation: any;

if (CPO === "finest-charge-ltd") {
    cpoImplementation = require("../cpo-finest-charge-ltd");
} else if (CPO === "global-charge-services") {
    cpoImplementation = require("../cpo-global-charge-services");
} else {
    throw new Error("Unknown CPO configuration.");
}


const validationResults = cpoImplementation.validateGlobalCharge();
console.log('Validation Results:', validationResults);
