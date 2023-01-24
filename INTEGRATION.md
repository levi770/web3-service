# Microservice API methods description

All web3-related operations, such as contract deployment and contract calls, will be processed in queue order. After a request for an operation is received, the microservice will register a job and return an observable object. It will then start to process the job and pipe all stages of this process to the observable.

There are three types of job results from the web3 service:

- `"received"`, object contains `jobId` and job input data.
- `"completed"`, object contains `jobId` and job output data.
- `"failed"`, object contains `jobId` and error message.

### Table of contents:

1. [Create a new encrypted wallet keystore in DB](#create-a-new-encrypted-wallet-keystore-in-db)
2. [Deploy any collection (contract)](#deploy-any-collection-contract)
3. [Process any contract method (common call)](#process-any-contract-method-common-call)
4. [Operation specified options DTOs](#operation-specified-options-dtos)
   1. [Mint options](#mint-options)
   2. [Whitelist options](#whitelist-options)
5. [Get merkle proof for address](#get-merkle-proof-for-address)
6. [Update object status if blockchain operation was executed on client side](#update-object-status-if-blockchain-operation-was-executed-on-client-side)
7. [Get all objects from DB](#get-all-objects-from-db)
8. [Get one object from DB](#get-one-object-from-db)
9. [Get specified job from queue](#get-specified-job-from-queue)
10. [Update token metadata](#update-token-metadata)
11. [REST API endpoint to get token metadata from DB](#rest-api-endpoint-to-get-token-metadata-from-db)
12. [REST API endpoint to get server status](#rest-api-endpoint-to-get-server-status)

## Create a new encrypted wallet keystore in DB

Message pattern:

```json
{
  "cmd": "createwallet"
}
```

Input example:

```json
{
  "team_id": "7a31a433-7fbe-4daf-b179-e1d19ba5988d" // team ID from CRM side
}
```

Output example:

```json
{
  "status": 201, // HTTP status code
  "message": "success", // message for the user
  "result": {
    "id": "a9761962-e193-49fb-b197-bea802528adf", // wallet ID in DB
    "address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18" // wallet address
  }
}
```

Related DTOs:

- [CreateWalletRequest](./src/modules/web3/dto/requests/createWallet.request.ts)

[Go to top](#table-of-contents)

## Deploy any collection (contract)

Message pattern:

```json
{
  "cmd": "deploycontract"
}
```

Input data:

```json
{
  "execute": "boolean",
  "network": "Networks",
  "abi": "AbiItem[]",
  "bytecode": "string",
  "arguments": "string",
  "from_address": "string",
  "asset_url": "string",
  "asset_type": "FileTypes",
  "meta_data": "MetaDataDto"
}
```

- If `"execute:true"`, the transaction will be processed on the blockchain. If `"execute:false"`, the service will only generate transaction payload data for execution on the client side.
- `"network"` specifies the Ethereum or Polygon chain ID.
- `"abi"` is the contract ABI, required for collection deployment operations and processing contract method calls.
- `"bytecode"` is required for contract deployment on the blockchain.
- `"arguments"` is a double colon (::) separated list of fields for the contract constructor (e.g. `"argItem1::argItem2::["argArrayItem1","argArrayItem2"]::argItem3"`).
- `"from_address"` is the wallet address from which the transaction will be sent.
- `"asset_url"`, `"asset_type"`, and `"meta_data"` are optional fields. If set, the service will create a common metadata object for this collection.
- `"asset_url"` is a file key in AWS S3. It will be downloaded from S3 and uploaded to the Pinata IPFS node, and the IPFS URL will be set in the metadata object.

Output data:

```json
{
  "tx": "TxResultDto"
}
```

- If `"execute:true"`, the `"tx"` will contain the transaction receipt and related data. If `"execute:false"`, the `"tx"` will contain the transaction payload for execution on the client side.

[Go to top](#table-of-contents)

## Process any contract method (common call)

Message pattern:

```json
{
  "cmd": "processcall"
}
```

Input data:

```json
{
  "execute": "boolean",
  "network": "Networks",
  "contract_id": "string",
  "method_name": "string",
  "arguments": "string",
  "from_address": "string",
  "operation_type": "OperationTypes",
  "operation_options": "Model<T>"
}
```

- If `"execute:true"`, the transaction will be processed on the blockchain. If `"execute:false"`, the service will only generate transaction payload data for execution on the client side.
- `"network"` specifies the Ethereum or Polygon chain ID.
- `"contract_id"` is the ID of an existing contract in the database for calling methods.
- `"method_name"` is the name of the contract method (e.g. `"toggleSaleActive"`, `"toggleSaleFree"`, `"editSaleRestrictions"`).
- `"arguments"` is a double colon (::) separated list of data fields for the contract method call (e.g. `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"from_address"` is the wallet address from which the transaction will be sent.
- `"operation_type"` is an operation flag (e.g. `"mint"`, `"whitelistadd"`, `"whitelistremove"`, or `"common"`).
- `"operation_options"` is a set of operation-specific options for executing the method call (e.g. an address for adding or removing from the whitelist, or token minting payload data).

Output data:

```json
{
  "tx": "TxResultDto",
  "merkleProof": "string[]",
  "merkleRoot": "string"
}
```

- If `"execute:true"`, the `"tx"` object will contain the transaction receipt and related data. If `"execute:false"`, the `"tx"` will contain the transaction payload for execution on the client side.
- `"merkleProof"` and `"merkleRoot"` are optional fields. If set, the service will generate a Merkle proof for the transaction receipt and the Merkle root for the contract.

[Go to top](#table-of-contents)

## Operation specified options DTOs

### Mint options

```json
{
  "nft_number": "string",
  "mint_to": "string",
  "asset_url": "string",
  "asset_type": "FileTypes",
  "meta_data": "MetaDataDto"
}
```

- `"nft_number"` is the quantity of tokens to mint.
- `"mint_to"` is the user's wallet address to mint the token to.
- `"asset_url"` is a file key in AWS S3. It will be downloaded from S3 and uploaded to the Pinata IPFS node, and the IPFS URL will be set in the metadata object.
- `"asset_type"` is either `"image"` or `"object"` for a 3D object.
- `"meta_data"` is the token metadata payload.

[Go to top](#table-of-contents)

### Whitelist options

```json
{
  "contract_id": "string",
  "address": "string"
}
```

- `"contract_id"` is the ID of the contract entity from the database.
- `"address"` is the user's wallet address to add or remove from the contract's whitelist.

[Go to top](#table-of-contents)

## Get merkle proof for address

Message pattern:

```json
{
  "cmd": "getmerkleproof"
}
```

Input data:

```json
{
  "address": "string"
}
```

- `"address"` is the user's wallet address to get the merkle proof for.

Output data:

```json
{
  "status": "number",
  "message": "string",
  "result": {
    "merkleProof": "string[]",
    "merkleRoot": "string"
  }
}
```

- `"merkleProof"` is an array of strings containing the merkle proof for the address.
- `"merkleRoot"` is the merkle root for the contract.

[Go to top](#table-of-contents)

## Update object status if blockchain operation was executed on client side

Message pattern:

```json
{
  "cmd": "updatestatus"
}
```

Input data:

```json
{
  "network": "Networks",
  "object_type": "ObjectTypes",
  "object_id": "string",
  "tx_hash": "string",
  "tx_receipt": "TransactionReceipt"
}
```

- `"network"` specifies the Ethereum or Polygon chain ID.
- `"object_type"` specifies the type of object (e.g. `"contract"` or `"token"`).
- `"object_id"` is the ID of the specified object.
- `"tx_hash"` is the transaction hash received after the execution of a blockchain transaction on the client side. The microservice will retrieve the transaction receipt from the blockchain using this transaction hash and will update the status of the object (contract or token) in the database depending on the results of the transaction.
- `"tx_receipt"` is an optional object containing the transaction receipt received after the execution of a blockchain transaction on the client side.

Output data:

```json
{
  "status": "number",
  "message": "string",
  "result": "string"
}
```

- `"status"` is the status code of the operation.
- `"message"` is the message of the operation `"status updated"` or `"status not updated"`.
- `"result"` is `null`.

[Go to top](#table-of-contents)

## Get all objects from DB

Message pattern:

```json
{
  "cmd": "getallobjects"
}
```

Input data:

```json
{
  "object_type": "ObjectTypes",
  "page": "number",
  "limit": "number",
  "order": "string",
  "order_by": "string",
  "include_child": "boolean"
}
```

- `"object_type"` specifies the type of object (e.g. `"contract"` or `"token"`).
- `"page"` and `"limit"` are standard pagination options.
- `"order"` specifies the sorting direction.
- `"order_by"` specifies the field to sort by.
- If `"include_child:true"`, all relations for each entity will be included.

Output data:

```json
{
  "count": "number",
  "rows": "Model<T>[]"
}
```

- `"count"`, number of rows.
- `"rows"`, array of requested objects.

[Go to top](#table-of-contents)

## Get one object from DB

Message pattern:

```json
{
  "cmd": "getoneobject"
}
```

Input data:

```json
{
  "object_type": "ObjectTypes",
  "id": "string",
  "token_id": "string",
  "address": "string",
  "contract_id": "string",
  "include_child": "boolean"
}
```

- `"object_type"` specifies the type of object (e.g. `"contract"` or `"token"`).
- `"id"`, `"token_id"`, `"address"`, and `"contract_id"` are optional fields for filtering objects.
- If `"include_child:true"`, all relations for this entity will be included.

Output data:
`Model<T>[]`, requested object

[Go to top](#table-of-contents)

## Get specified job from queue

Message pattern:

```json
{
  "cmd": "getjobbyid"
}
```

Input data:

```json
{
  "jobId": "string"
}
```

Output data:

```json
{
  "jobId": "string",
  "status": "string",
  "data": "object"
}
```

`"received"`, `"completed"`, or `"failed"` objects can be retrieved from the operations queue.

[Go to top](#table-of-contents)

## Update token metadata

Message pattern:

```json
{
  "cmd": "updatemetadata"
}
```

Input data:

```json
{
  "id": "string",
  "meta_data": "object"
}
```

- `"id"` is the token ID in the contract state on the blockchain (`"token_id"` in the database).
- `"meta_data"` is the metadata payload.

Output data:

```json
{
  "status": "number",
  "message": "string",
  "result": "string"
}
```

- `"status"` is the status code of the operation.
- `"message"` is the message of the operation `"metadata updated"` or `"metadata not updated"`.
- `"result"` is `null`.

[Go to top](#table-of-contents)

## REST API endpoint to get token metadata from DB

`GET /metadata/:token_id`

This endpoint requires the `"id"` parameter, which is the token ID in the contract state on the blockchain (`"token_id"` in the database). The response will contain the metadata payload for the specified token.

Output data:

```json
{
  "name": "string",
  "description": "string",
  "image": "string",
  "animation_url": "string",
  "external_url": "string",
  "preview_url": "string",
  "concept_and_design": "string",
  "model_url": "string",
  "skybox_url": "string",
  "spatial_thumbnail_url": "string",
  "spatial_space_name": "string",
  "spatial_portal_url": "string",
  "attributes": [
    {
      "trait_type": "string",
      "value": "string"
    }
  ]
}
```

[Go to top](#table-of-contents)

## REST API endpoint to get server status

`GET /health`

The response will contain server status.

Output data:

```json
{
  "status": "number",
  "message": "string",
  "result": null
}
```

[Go to top](#table-of-contents)
