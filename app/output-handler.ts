import {ValidationResult} from "../core/tariff-validation.model";

/**
 * This is not tested, only prototyped code!
 */

export function formatResults(results: ValidationResult[]): void {
    const validResults = results.filter((result) => result.isValid);
    const invalidResults = results.filter((result) => !result.isValid);

    console.log("====== Validation Results ======");

    if (validResults.length > 0) {
        console.log(`✅ ${validResults.length} Tariff(s) Valid`);
        console.log("-------------------------------");
    }

    if (invalidResults.length > 0) {
        console.log(`❌ ${invalidResults.length} Tariff(s) Invalid`);
        console.log("-------------------------------");

        invalidResults.forEach((result, index) => {
            console.log(`❌ Tariff ${index + 1}:`);
            result.discrepancies.forEach((discrepancy, i) => {
                console.log(`  ${i + 1}. ${discrepancy}`);
            });
            console.log("-------------------------------");
        });
    }

    console.log("================================");
    console.log("Validation complete.");
}
