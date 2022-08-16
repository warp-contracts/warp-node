import Router from "@koa/router";

export const walletBalances = async (ctx: Router.RouterContext) => {
  const walletAddress = ctx.query.walletAddress as string;
  const nodeDb = ctx.nodeDb;

  try {
    const result = await nodeDb.raw(`
        SELECT contract_tx_id, token_ticker, token_name, balance
        FROM balances
        WHERE wallet_address = ?
    `, [walletAddress])
    ctx.body = result;
    ctx.status = 200;
  } catch (e: any) {
    ctx.body = e.message;
    ctx.status = 500;
  }

};
