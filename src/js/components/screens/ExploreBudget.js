import { Map as ImmutableMap } from "immutable";

import React from "react";
import { connect } from "react-redux";

import {
    RF,
    RI,
    DF,
    DI,
    EXPENDITURES,
    REVENUE
} from "../../../js/finance/constants";


import { aggregatedDocumentBudgetaireNodeTotal } from '../../../js/finance/AggregationDataStructures.js'
import { flattenTree } from "../../../js/finance/visitHierarchical.js";

import PageTitle from "../gironde.fr/PageTitle";
import SecundaryTitle from "../gironde.fr/SecundaryTitle";
import PrimaryCallToAction from "../gironde.fr/PrimaryCallToAction";

import Markdown from "../Markdown";
import MoneyAmount from "../MoneyAmount";

import M52ByFonction from "../M52ByFonction";

const MAX_HEIGHT = 30;

export function TotalBudget({
    currentYear,
    totalById,
    m52Instruction,
    planDeCompte,
    labelsById,
    urls: {
        comprendre: comprendreURL,
        expenditures: expURL,
        revenue: revURL,
        rf,
        ri,
        df,
        di,
        byFonction
    },
    screenWidth
}) {
    const expenditures = totalById.get(EXPENDITURES);
    const revenue = totalById.get(REVENUE);

    const max = Math.max(expenditures, revenue);

    const expHeight = MAX_HEIGHT * (expenditures / max) + "em";
    const revHeight = MAX_HEIGHT * (revenue / max) + "em";

    const rfHeight = 100 * (totalById.get(RF) / revenue) + "%";
    const riHeight = 100 * (totalById.get(RI) / revenue) + "%";
    const diHeight = 100 * (totalById.get(DI) / expenditures) + "%";
    const dfHeight = 100 * (totalById.get(DF) / expenditures) + "%";

    return React.createElement(
        "article",
        { className: "explore-budget" },
        React.createElement(PageTitle, {
            text: `Exploration des comptes ${currentYear}`
        }),
        React.createElement(
            "section",
            {},
            React.createElement(
                Markdown,
                {},
                `Cette page montre le budget d'une collectivité choisie`
            ),
            React.createElement(
                'a',
                { href: comprendreURL },
                `Comprendre`
            )
        ),

        React.createElement(
            "section",
            {},
            React.createElement(SecundaryTitle, {
                text: "Les grandes masses budgétaires du compte administratif"
            }),
            React.createElement(
                "div",
                { className: "viz" },
                React.createElement(
                    "div",
                    { className: "revenue" },
                    React.createElement(
                        "a",
                        { href: revURL },
                        React.createElement("h1", {}, "Recettes")
                    ),
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "div",
                            {
                                className: "areas",
                                style: { height: revHeight }
                            },
                            React.createElement(
                                "a",
                                {
                                    className: "rf",
                                    href: rf,
                                    style: { height: rfHeight }
                                },
                                React.createElement(
                                    "h2",
                                    {},
                                    "Recettes de fonctionnement"
                                ),
                                React.createElement(MoneyAmount, {
                                    amount: totalById.get(RF)
                                })
                            ),
                            React.createElement(
                                "a",
                                {
                                    className: "ri",
                                    href: ri,
                                    style: { height: riHeight }
                                },
                                React.createElement(
                                    "h2",
                                    {},
                                    "Recettes d'investissement"
                                ),
                                React.createElement(MoneyAmount, {
                                    amount: totalById.get(RI)
                                })
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "texts" },
                            React.createElement(MoneyAmount, {
                                amount: revenue
                            }),
                            React.createElement(PrimaryCallToAction, {
                                text: `Les recettes`,
                                href: revURL
                            })
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "expenditures" },
                    React.createElement(
                        "a",
                        { href: expURL },
                        React.createElement("h1", {}, "Dépenses")
                    ),
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "div",
                            {
                                className: "areas",
                                style: { height: expHeight }
                            },
                            React.createElement(
                                "a",
                                {
                                    className: "df",
                                    href: df,
                                    style: { height: dfHeight }
                                },
                                React.createElement(
                                    "h2",
                                    {},
                                    "Dépenses de fonctionnement"
                                ),
                                React.createElement(MoneyAmount, {
                                    amount: totalById.get(DF)
                                })
                            ),
                            React.createElement(
                                "a",
                                {
                                    className: "di",
                                    href: di,
                                    style: { height: diHeight }
                                },
                                React.createElement(
                                    "h2",
                                    {},
                                    "Dépenses d'investissement"
                                ),
                                React.createElement(MoneyAmount, {
                                    amount: totalById.get(DI)
                                })
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "texts" },
                            React.createElement(MoneyAmount, {
                                amount: expenditures
                            }),
                            React.createElement(PrimaryCallToAction, {
                                text: `Les dépenses`,
                                href: expURL
                            })
                        )
                    )
                )
            ),
            React.createElement(
                Markdown,
                {},
                `Les chiffres étant issus du compte administratif, la différence entre le montant des recettes et le montant des dépenses représente l'excédent de l'exercice.`
            )
        ),
        React.createElement(
            "section",
            { className: "m52" },
            React.createElement(SecundaryTitle, {
                text: "Les comptes par fonction (norme M52)"
            }),
            m52Instruction
                ? React.createElement(M52ByFonction, {
                    m52Instruction,
                    planDeCompte,
                    urlByFonction: byFonction,
                    labelsById,
                    screenWidth
                })
                : undefined
        )
    );
}

export default connect(
    state => {
        const {
            docBudgByYear,
            aggregationByYear,
            planDeCompteByYear,
            currentYear,
            textsById,
            screenWidth
        } = state;

        const m52Instruction = docBudgByYear.get(currentYear);
        const aggregated = aggregationByYear.get(currentYear);
        const planDeCompte = planDeCompteByYear.get(currentYear)

        let totalById = new ImmutableMap();
        if (aggregated) {
            flattenTree(aggregated).forEach(aggNode => {
                totalById = totalById.set(aggNode.id, aggregatedDocumentBudgetaireNodeTotal(aggNode));
            });
        }

        return {
            currentYear,
            totalById,
            m52Instruction,
            planDeCompte,
            labelsById: textsById.map(texts => texts.label),
            urls: {
                comprendre: "#!/comprendre/",
                expenditures: "#!/detail/" + EXPENDITURES,
                revenue: "#!/detail/" + REVENUE,
                rf: "#!/detail/" + RF,
                ri: "#!/detail/" + RI,
                df: "#!/detail/" + DF,
                di: "#!/detail/" + DI,
                byFonction: {
                    "M52-DF-0": `#!/detail/M52-DF-0`,
                    "M52-DF-1": `#!/detail/M52-DF-1`,
                    "M52-DF-2": `#!/detail/M52-DF-2`,
                    "M52-DF-3": `#!/detail/M52-DF-3`,
                    "M52-DF-4": `#!/detail/M52-DF-4`,
                    "M52-DF-5": `#!/detail/M52-DF-5`,
                    "M52-DF-6": `#!/detail/M52-DF-6`,
                    "M52-DF-7": `#!/detail/M52-DF-7`,
                    "M52-DF-8": `#!/detail/M52-DF-8`,
                    "M52-DF-9": `#!/detail/M52-DF-9`,
                    "M52-DI-0": `#!/detail/M52-DI-0`,
                    "M52-DI-1": `#!/detail/M52-DI-1`,
                    "M52-DI-2": `#!/detail/M52-DI-2`,
                    "M52-DI-3": `#!/detail/M52-DI-3`,
                    "M52-DI-4": `#!/detail/M52-DI-4`,
                    "M52-DI-5": `#!/detail/M52-DI-5`,
                    "M52-DI-6": `#!/detail/M52-DI-6`,
                    "M52-DI-7": `#!/detail/M52-DI-7`,
                    "M52-DI-8": `#!/detail/M52-DI-8`,
                    "M52-DI-9": `#!/detail/M52-DI-9`
                }
            },
            screenWidth
        };
    },
    () => ({})
)(TotalBudget);
