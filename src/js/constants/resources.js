export const FINANCE_DATA = 'FINANCE_DATA';

export const AGGREGATED_ATEMPORAL = "AGGREGATED_ATEMPORAL";
export const AGGREGATED_TEMPORAL = "AGGREGATED_TEMPORAL";
export const M52_FONCTION_ATEMPORAL = "M52_FONCTION_ATEMPORAL";
export const M52_FONCTION_TEMPORAL = "M52_FONCTION_TEMPORAL";

export const CORRECTIONS_AGGREGATED = "CORRECTIONS_AGGREGATED";

const URL_PREFIX = `/finances-une-administration`;


export const urls = {
    // finance data
    [FINANCE_DATA]: `${URL_PREFIX}/build/finances/finance-data.json`,

    // texts
    [AGGREGATED_ATEMPORAL]: `${URL_PREFIX}/data/texts/aggregated-atemporal.csv`,
    [AGGREGATED_TEMPORAL]: `${URL_PREFIX}/data/texts/aggregated-temporal.csv`,
}
