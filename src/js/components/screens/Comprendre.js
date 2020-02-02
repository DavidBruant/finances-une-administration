import { Map as ImmutableMap } from "immutable";

import React from "react";
import { connect } from "react-redux";

import { sum } from "d3-array";

import Markdown from "../Markdown";
import SecundaryTitle from "../gironde.fr/SecundaryTitle";
import BudgetConstructionAnimation from "../BudgetConstructionAnimation";

import { aggregatedDocumentBudgetaireNodeTotal } from '../../../js/finance/AggregationDataStructures.js'
import { flattenTree } from "../../../js/finance/visitHierarchical.js";

function Comprendre({
    constructionAmounts,
    screenWidth
}) {

    return React.createElement(
        "article",
        { className: "comprendre" },
        React.createElement(
            Markdown,
            {},
            `# Comprendre le budget d'une administration
            
            L'administration française n'est pas un unique "État" uniforme. Elle est composée d'une myriade **d'établissements publics** dont font partie les **collectivités territoriales** (Communes, Départements, Régions). Chaque établissement public est autonome et souverain dans la gestion de son budget dans les limites définies par la loi.
        
            ## Différents types de collectivités

            ### La notion de compétence

            ## Notions clefs pour comprendre un budget
            `
        ),
        React.createElement(
            "section",
            {},
            React.createElement(SecundaryTitle, {
                text: `Comprendre la construction d'un budget`
            }),
            React.createElement(
                Markdown,
                {},
                `Le budget prévoit la répartition des recettes et des dépenses sur un exercice. Il est composé de la section de fonctionnement et d’investissement. Contrairement à l’Etat, les Départements, ont l’obligation d’adopter un budget à l’équilibre. Toutefois, le compte administratif peut présenter sur l'exercice un résultat excédentaire ou déficitaire.`
            ),
            React.createElement(
                Markdown,
                {},
                `Dans un contexte particulièrement contraint, la préservation de nos équilibres financiers constitue un défi stimulant. Alors comment s’établit notre budget ?`
            ),
            React.createElement(
                BudgetConstructionAnimation,
                Object.assign(
                    {
                        videoURL: screenWidth <= 1000 ? animationVideo : undefined
                    },
                    constructionAmounts
                )
            )
        )
    )
}

export default connect(
    state => {
        const {
            aggregationByYear,
            currentYear,
            screenWidth
        } = state;

        const aggregated = aggregationByYear.get(currentYear);

        let totalById = new ImmutableMap();
        if (aggregated) {
            flattenTree(aggregated).forEach(aggNode => {
                totalById = totalById.set(aggNode.id, aggregatedDocumentBudgetaireNodeTotal(aggNode));
            });
        }

        return {
            // All of this is poorly hardcoded. TODO: code proper formulas based on what was transmitted by CD33
            constructionAmounts: aggregated ?
                {
                    DotationEtat: totalById.get("RF.5"),
                    FiscalitéDirecte: totalById.get("RF.1"),
                    FiscalitéIndirecte: sum(
                        ["RF.2", "RF.3", "RF.4"].map(i => totalById.get(i))
                    ),
                    RecettesDiverses:
                        totalById.get("RF") -
                        sum(
                            ["RF.1", "RF.2", "RF.3", "RF.4", "RF.5"].map(i =>
                                totalById.get(i)
                            )
                        ),

                    Solidarité: totalById.get("DF.1"),
                    Interventions: totalById.get("DF.3"),
                    DépensesStructure:
                        totalById.get("DF") -
                        sum(["DF.1", "DF.3"].map(i => totalById.get(i))),

                    Emprunt: totalById.get("RI.EM"),
                    RIPropre: totalById.get("RI") - totalById.get("RI.EM"),

                    RemboursementEmprunt: totalById.get("DI.EM"),
                    Routes: totalById.get("DI.1.2"),
                    Colleges: totalById.get("DI.1.1"),
                    Amenagement:
                        totalById.get("DI.1.3") +
                        totalById.get("DI.1.4") +
                        totalById.get("DI.1.5"),
                    Subventions: totalById.get("DI.2")
                }
                : undefined,
            screenWidth
        };
    },
    () => ({})
)(Comprendre);