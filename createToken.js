const {
  Client,
  TokenCreateTransaction,
  Hbar,
  PrivateKey,
  TokenType,
} = require("@hashgraph/sdk");

module.exports = async function () {
  const operatorPrivateKey = PrivateKey.fromString(
    "302e020100300506032b657004220420bd48a77cb20375f6311353d5208ef41175e30c6e962fe59577334b09d69dd4a6"
  );
  const operatorAccountId = "0.0.3892535";

  const client = Client.forTestnet();
  client.setOperator(operatorAccountId, operatorPrivateKey);

  const tokenCreateTransaction = new TokenCreateTransaction()
    .setTokenType(TokenType.FUNGIBLE_COMMON)
    .setTokenName("MyToken")
    .setTokenSymbol("MTK")
    .setDecimals(0)
    .setInitialSupply(1000)
    .setTreasuryAccountId(operatorAccountId)
    .setMaxTransactionFee(new Hbar(100))
    .setAdminKey(operatorPrivateKey.publicKey)
    .setKycKey(operatorPrivateKey.publicKey)
    .setFreezeKey(operatorPrivateKey.publicKey)
    .setWipeKey(operatorPrivateKey.publicKey)
    .setSupplyKey(operatorPrivateKey.publicKey);

  const response = await tokenCreateTransaction.execute(client);
  const receipt = await response.getReceipt(client);
  const tokenId = receipt.tokenId;

  console.log("Token created with Token ID:", tokenId.toString());
  return tokenId.toString();
};
