import { createStore } from 'redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Record, Map as ImmutableMap, List, Set as ImmutableSet } from 'immutable';
import { csv, xml, json } from 'd3-fetch';
import page from 'page';

import {urls, FINANCE_DATA, AGGREGATED_ATEMPORAL, AGGREGATED_TEMPORAL} from './constants/resources';
import reducer from './reducer';

import {LigneBudgetRecord, DocumentBudgetaire} from '../js/finance/DocBudgDataStructures.js';
import { fromXMLDocument } from '../js/finance/planDeCompte';
import {makeChildToParent, flattenTree} from '../js/finance/visitHierarchical.js';
import hierarchicalM52 from '../js/finance/hierarchicalM52.js';

import Breadcrumb from './components/gironde.fr/Breadcrumb';
import FinanceElement from './components/screens/FinanceElement';

import ExploreBudget from './components/screens/ExploreBudget';
import Comprendre from './components/screens/Comprendre';

import { HOME } from './constants/pages';
import {
    FINANCE_DATA_RECEIVED, ATEMPORAL_TEXTS_RECEIVED, TEMPORAL_TEXTS_RECEIVED, PLAN_DE_COMPTE_RECEIVED,
    FINANCE_DETAIL_ID_CHANGE,
} from './constants/actions';


import {fonctionLabels} from '../../build/finances/m52-strings.json';


/**
 *
 * Initialize Redux store + React binding
 *
 */
const REACT_CONTAINER_SELECTOR = '.finance-ui';
const CONTAINER_ELEMENT = document.querySelector(REACT_CONTAINER_SELECTOR);

/*
    Dirty (temporary) hacks to fix the gironde.fr pages so the content displays properly
*/
if(process.env.NODE_ENV === 'production'){
    const main = document.body.querySelector('main');
    const columnsEl = main.querySelector('.columns');
    const rowEl = main.querySelector('.row');

    const elementsToMove = main.querySelectorAll('.columns > :nth-child(-n+3)');

    Array.from(elementsToMove).forEach(e => {
        if(e.querySelector('h1')){
            // remove server-generated h1
            e.remove();
        }
        else{
            main.insertBefore(e, rowEl);
        }
    });

    main.insertBefore(CONTAINER_ELEMENT, rowEl);
}

// Breadcrumb
const BREADCRUMB_CONTAINER = process.env.NODE_ENV === "production" ?
    document.body.querySelector('.breadcrumb').parentNode :
    document.body.querySelector('nav');

const DEFAULT_BREADCRUMB = List([
    {
        text: 'Accueil',
        url: '/'
    }
]);


const StoreRecord = Record({
    docBudgByYear: undefined,
    aggregationByYear: undefined,
    planDeCompteByYear: undefined,
    currentYear: undefined,
    explorationYear: undefined,
    // ImmutableMap<id, FinanceElementTextsRecord>
    textsById: undefined,
    financeDetailId: undefined,
    screenWidth: undefined
});

const store = createStore(
    reducer,
    new StoreRecord({
        docBudgByYear: new ImmutableMap(),
        aggregationByYear: new ImmutableMap(),
        planDeCompteByYear: new ImmutableMap(),
        currentYear: (new Date()).getFullYear() - 1,
        explorationYear: (new Date()).getFullYear() - 1,
        financeDetailId: undefined,
        textsById: ImmutableMap([[HOME, {label: 'Acceuil'}]]),
        screenWidth: window.innerWidth
    })
);



store.dispatch({
    type: ATEMPORAL_TEXTS_RECEIVED,
    textList: Object.keys(fonctionLabels)
        .map(fonction => ({
            id: `M52-DF-${fonction}`,
            label: fonctionLabels[fonction]
        }))
});
store.dispatch({
    type: ATEMPORAL_TEXTS_RECEIVED,
    textList: Object.keys(fonctionLabels)
        .map(fonction => ({
            id: `M52-DI-${fonction}`,
            label: fonctionLabels[fonction]
        }))
});



/**
 *
 * Fetching initial data
 *
 */

json(urls[FINANCE_DATA])
.then(({documentBudgetaires, aggregations}) => {
    store.dispatch({
        type: FINANCE_DATA_RECEIVED,
        documentBudgetaires: documentBudgetaires.map(db => {
            db.rows = new ImmutableSet(db.rows.map(LigneBudgetRecord))
            return DocumentBudgetaire(db)
        }), 
        aggregations
    });

    for(const {Exer} of documentBudgetaires){
        xml(`/data/finances/plansDeCompte/plan-de-compte-M52-M52-${Exer}.xml`)
        .then(fromXMLDocument)
        .then(planDeCompte => {
            store.dispatch({
                type: PLAN_DE_COMPTE_RECEIVED,
                planDeCompte
            });
        })
    }

});


csv(urls[AGGREGATED_ATEMPORAL])
.then(textList => {
    store.dispatch({
        type: ATEMPORAL_TEXTS_RECEIVED,
        textList
    });
});

csv(urls[AGGREGATED_TEMPORAL])
.then(textList => {
    store.dispatch({
        type: TEMPORAL_TEXTS_RECEIVED,
        textList
    });
});



/**
 *
 * Routing
 *
 */

page('/', () => {
    console.log('in route', '/');

    ReactDOM.render(
        React.createElement(
            Provider,
            { store },
            React.createElement(ExploreBudget)
        ),
        CONTAINER_ELEMENT
    );


    const breadcrumb = DEFAULT_BREADCRUMB;
    ReactDOM.render( React.createElement(Breadcrumb, { items: breadcrumb }), BREADCRUMB_CONTAINER );
});


page('/comprendre', () => {
    console.log('in route', '/comprendre');

    ReactDOM.render(
        React.createElement(
            Provider,
            { store },
            React.createElement(Comprendre)
        ),
        CONTAINER_ELEMENT
    );


    const breadcrumb = DEFAULT_BREADCRUMB;
    ReactDOM.render( React.createElement(Breadcrumb, { items: breadcrumb }), BREADCRUMB_CONTAINER );
})


page('/detail/:contentId', ({params: {contentId}}) => {
    console.log('in route', '/detail', contentId)
    scrollTo(0, 0);

    store.dispatch({
        type: FINANCE_DETAIL_ID_CHANGE,
        financeDetailId: contentId
    })

    ReactDOM.render(
        React.createElement(
            Provider,
            { store },
            React.createElement(FinanceElement)
        ),
        CONTAINER_ELEMENT
    );


    const {docBudgByYear, aggregationByYear, planDeCompteByYear, currentYear, textsById} = store.getState()

    const isM52Element = contentId.startsWith('M52-');

    let RDFI;
    if(isM52Element){
        RDFI = contentId.slice('M52-'.length, 'M52-XX'.length);
    }

    const documentBudgetaire = docBudgByYear.get(currentYear);
    const aggregatedDocumentBudgetaire = aggregationByYear.get(currentYear);
    const planDeCompte = planDeCompteByYear.get(currentYear)

    const hierM52 = documentBudgetaire && RDFI && planDeCompte && hierarchicalM52(documentBudgetaire, planDeCompte, RDFI);

    const childToParent = makeChildToParent(...[aggregatedDocumentBudgetaire, hierM52].filter(x => x !== undefined))

    const breadcrumbData = [];

    let currentElement = (aggregatedDocumentBudgetaire && flattenTree(aggregatedDocumentBudgetaire).find(el => el.id === contentId)) ||
        (hierM52 && flattenTree(hierM52).find(el => el.id === contentId))

    while(currentElement){
        if(currentElement.id !== 'racine'){
            breadcrumbData.push({
                text: textsById.get(currentElement.id).label,
                url: `#!/detail/${currentElement.id}`
            })
        }
        currentElement = childToParent.get(currentElement);
    }

    const breadcrumb = DEFAULT_BREADCRUMB.concat(breadcrumbData.reverse());

    ReactDOM.render( React.createElement(Breadcrumb, { items: breadcrumb }), BREADCRUMB_CONTAINER );

});

page.redirect(location.pathname, '#!/')
page.redirect(location.pathname+'/', '#!/')

if(location.pathname !== '/')
    page.base(location.pathname);

page({ hashbang: true });
window.addEventListener('hashchange', () => {
    scrollTo(0, 0);
    page.redirect(location.hash);
});
window.addEventListener('popstate', () => {
    scrollTo(0, 0);
    page.redirect(location.hash);
});
