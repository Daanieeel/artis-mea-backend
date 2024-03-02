// Database Helpers
const getValidUnusedToken = async (connection, token) => {
  const [rows] = await connection.execute(
    `SELECT bw.token_id
    FROM bansystem_token
    LEFT JOIN s3_whitelist.bansystem_whitelist bw on bansystem_token.token_id = bw.token_id
    WHERE token = ?
    AND bw.whitelist_id IS NULL
    LIMIT 1;`, [token]);
  return rows.length > 0 ? rows[0].token_id : null;
};

const isPlayerWhitelisted = async (connection, name) => {
  const [rows] = await connection.execute(
    `SELECT 1
    FROM bansystem_whitelist
    WHERE bansystem_whitelist.player_id = ?
    LIMIT 1;`, [name]);
  return rows.length > 0;
};

const addPlayerToWhitelist = async (connection, tokenId, name) => {
  await connection.execute(
    `INSERT INTO bansystem_whitelist (token_id, player_id) VALUE (?, ?);`, [tokenId, name]);
};
