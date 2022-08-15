import {Knex} from "knex";

export async function createNodeDbTables(knex: Knex) {
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

  const hasStatesTable = await knex.schema.hasTable('states');
  if (!hasStatesTable) {
    await knex.schema.createTable('states', function(t) {
      t.string('contract_tx_id').index().unique();
      t.string('sort_key').index();
      t.jsonb('state');
      t.jsonb('validity');
      t.jsonb('error_messages');
    });
  }

  const hasNodeTable = await knex.schema.hasTable('node_settings');
  if (!hasNodeTable) {
    await knex.schema.createTable('node_settings', function(t) {
      t.string('key');
      t.string('value');
    });
    await knex('node_settings')
      .insert({
        'key': 'last_empty_contract_block_height',
        'value': '1'
      });
  }
}

