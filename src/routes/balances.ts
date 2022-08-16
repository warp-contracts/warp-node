import Router from "@koa/router";

const MAX_BALANCES_PER_PAGE = 1000;

export const walletBalances = async (ctx: Router.RouterContext) => {
  const {page, limit, walletAddress, groups} = ctx.query;
  const parsedGroups = ctx.query.groups ? (ctx.query.groups as string).split(',') : null;
  const nodeDb = ctx.nodeDb;

  const parsedPage = page ? parseInt(page as string) : 1
  const parsedLimit = limit
    ? Math.min(parseInt(limit as string), MAX_BALANCES_PER_PAGE)
    : MAX_BALANCES_PER_PAGE;
  const offset = parsedPage ? (parsedPage - 1) * parsedLimit : 0;

  try {
    const result = await nodeDb.raw(`
        SELECT contract_tx_id, src_tx_id, token_ticker, token_name, balance, sort_key
        FROM balances
        WHERE wallet_address = ?
            ${parsedGroups
                    ? ` AND src_tx_id IN (${parsedGroups.map((group) => `'${group}'`).join(', ')})`
                    : ''}
        ORDER BY sort_key desc
        LIMIT ? OFFSET ?
    `, [walletAddress, parsedLimit, offset])
    ctx.body = {
      paging: {
        limit: parsedLimit,
        items: result?.length,
        page: parsedPage
      },
      balances: result,
    };
    ctx.status = 200;
  } catch (e: any) {
    ctx.body = e.message;
    ctx.status = 500;
  }

};
