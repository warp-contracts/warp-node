import {Knex} from "knex";

export async function createBalancesDbTables(knex: Knex) {
  const hasBalancesTable = await knex.schema.hasTable('balances');
  if (!hasBalancesTable) {
    await knex.schema.createTable('balances', function(t) {
      t.string('wallet_address').index();
      t.string('contract_tx_id').index();
      t.string('token_ticker').index();
      t.string('token_name');
      t.string('balance');
      t.unique(['wallet_address', 'contract_tx_id'])
    });
  }
}

