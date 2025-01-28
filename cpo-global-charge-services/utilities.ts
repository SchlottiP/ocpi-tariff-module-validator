/**
 * Splits the provider field into partyId and countryCode.
 * @param provider The provider string in the format "XX*YYY" where:
 *   - "XX" is the country code (ISO-3166 alpha-2).
 *   - "YYY" is the party ID.
 * @returns An object containing countryCode and partyId.
 * @throws An error if the provider format is invalid.
 */
export function splitProvider(provider: string): { countryCode: string; partyId: string } {
    const regex = /^([A-Z]{2})\*([A-Z0-9]{3,})$/;
    const match = provider.match(regex);

    if (!match) {
        throw new Error(`Invalid provider format: ${provider}`);
    }

    return {
        countryCode: match[1], // First capture group is the country code
        partyId: match[2],     // Second capture group is the party ID
    };
}