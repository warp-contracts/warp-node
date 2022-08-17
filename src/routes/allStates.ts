import Router from "@koa/router";

const MAX_STATES_PER_PAGE = 1000;

const allowedOrderingColumns = ['contract_tx_id', 'sort_key', 'contract_creation'];
const allowedOrders = ['asc', 'desc'];

export const allStates = async (ctx: Router.RouterContext) => {

  const {page, limit, validity, errors, orderBy, order, groups} = ctx.query;

  const nodeDb = ctx.nodeDb;

  if (allowedOrderingColumns.indexOf(orderBy as string) == -1) {
    ctx.body = `Wrong order column, allowed ${allowedOrderingColumns}`;
    ctx.status = 500;
    return;
  }
  if (allowedOrders.indexOf(order as string) == -1) {
    ctx.body = `Wrong order, allowed ${allowedOrders}`;
    ctx.status = 500;
    return;
  }

  const parsedPage = page ? parseInt(page as string) : 1;
  const parsedLimit = limit
    ? Math.min(parseInt(limit as string), MAX_STATES_PER_PAGE)
    : MAX_STATES_PER_PAGE;
  const offset = parsedPage ? (parsedPage - 1) * parsedLimit : 0;

  const shouldReturnValidity = validity === 'true';
  const shouldReturnErrors = errors === 'true';

  const parsedGroups = groups ? (groups as string).split(',') : null;

  const bindings: any[] = [];
  bindings.push(parsedLimit);
  bindings.push(offset);

  let parsedOrderBy = null;
  if (orderBy == 'contract_tx_id') {
    parsedOrderBy = `contract_tx_id ${order}`;
  } else if (orderBy == 'sort_key') {
    parsedOrderBy = `sort_key ${order}, contract_tx_id ${order}`;
  } else if (orderBy == 'contract_creation') {
    parsedOrderBy = `contract_creation ${order}, contract_tx_id ${order}`;
  }

  try {
    const result = await nodeDb.raw(`
        SELECT contract_tx_id,
               src_tx_id,
               contract_creation,
               sort_key,
               state
                   ${shouldReturnValidity ? ',validity' : ''}
                       ${shouldReturnErrors ? ',error_messages' : ''}
        FROM states ${parsedGroups
                ? ` WHERE src_tx_id IN (${parsedGroups.map((group) => `'${group}'`).join(', ')})`
                : ''}
        ORDER BY ${parsedOrderBy}
        LIMIT ? OFFSET ?
    `, bindings)

    ctx.body = {
      paging: {
        limit: parsedLimit,
        items: result?.length,
        page: parsedPage
      },
      states: result,
    };
    ctx.status = 200;
  } catch (e: any) {
    ctx.body = e.message;
    ctx.status = 500;
  }

};
