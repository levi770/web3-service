# CRM-WEB3-SERVICE

Microservice for blockchain-related operations such as deploying contracts, minting tokens, and querying token data. The microservice is a NestJS application that uses a Postgres database, Redis pub/sub messaging transport protocol, a local IPFS node, and an AWS S3 client.

Supported blockchains:

- Ethereum
- Polygon

Supported operations:

- Collection contract deploy
- ABI-agnostic contract calls
- Reading/updating NFT metadata

The following applications will be available to manage the the project after launch:

- PgAdmin [http://localhost:8080/](http://localhost:8080/)
- Redis Commander [http://localhost:8081/](http://localhost:8081/)

## Requirements

- git,
- docker-compose

## Installation

```bash
$ git clone https://github.com/Exclusible/crm-web3-svc.git
$ cd crm-web3-svc
$ mv .env-example .env
```

Fill the missed variables in .env file with actual values. All variables is required.

```bash
$ docker-compose build
$ docker-compose up
```

# Microservice API methods description

All web3-related operations, such as contract deployment and contract calls, will be processed in queue order. After a request for an operation is received, the microservice will register a job and return an observable object. It will then start to process the job and pipe all stages of this process to the observable.

There are three types of job results from the web3 service:

- `"received"`, object contains `jobId` and job input data.
- `"completed"`, object contains `jobId` and job output data.
- `"failed"`, object contains `jobId` and error message.

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
- `"asset_url"`, `"asset_type"`, and `"meta_data"` are optional fields. If set, the service will create a common metadata object for this collection.
- `"asset_url"` is a file key in AWS S3. It will be downloaded from S3 and uploaded to the Pinata IPFS node, and the IPFS URL will be set in the metadata object.

Output data:

```json
{
  "deployTx": "TxResultDto",
  "meta_data": "MetaDataDto",
  "metadataObj": "MetadataModel",
  "contractObj": "ContractModel"
}
```

- If `"execute:true"`, the `"deployTx"` will contain the transaction receipt and related data. If `"execute:false"`, the `"deployTx"` will contain the transaction payload for execution on the client side.
- If the input fields `"asset_url"`, `"asset_type"`, and `"meta_data"` were not empty, the `"meta_data"` output will contain metadata from the payload.
- If the input fields `"asset_url"`, `"asset_type"`, and `"meta_data"` were not empty, a `"metadataObj"` will be created in the database and linked to the contract as a related object.
- `"contractObj"` is the contract entity created in the database.

## Read any contract data (common call)

Message pattern:

```json
{
  "cmd": "processcall"
}
```

Input data:

```json
{
  "network": "Networks",
  "contract_id": "string",
  "method_name": "string",
  "arguments": "string",
  "operation_type": "OperationTypes"
}
```

- `"network"` specifies the Ethereum or Polygon chain ID.
- `"contract_id"` is the ID of an existing contract in the database for calling methods.
- `"method_name"` is the name of the contract method (e.g. `"name"`).
- `"arguments"` is a double colon (::) separated list of data fields for the contract method call (e.g. `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"operation_type"` is an operation flag (should be: `"readcontract"`).

Output data:

```json
{
  "status": "number",
  "message": "string",
  "data": {
    "[method_name]": "data"
  }
}
```

- `"[method_name]"` is a result of read contract operation (e.g. `"name": "contract_name"`).

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
  "operation_type": "OperationTypes",
  "operation_options": "Model<T>"
}
```

- If `"execute:true"`, the transaction will be processed on the blockchain. If `"execute:false"`, the service will only generate transaction payload data for execution on the client side.
- `"network"` specifies the Ethereum or Polygon chain ID.
- `"contract_id"` is the ID of an existing contract in the database for calling methods.
- `"method_name"` is the name of the contract method (e.g. `"toggleSaleActive"`, `"toggleSaleFree"`, `"editSaleRestrictions"`).
- `"arguments"` is a double colon (::) separated list of data fields for the contract method call (e.g. `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"operation_type"` is an operation flag (e.g. `"mint"`, `"whitelistadd"`, `"whitelistremove"`, or `"common"`).
- `"operation_options"` is a set of operation-specific options for executing the method call (e.g. an address for adding or removing from the whitelist, or token minting payload data).

Output data:

```json
{
  "callTx": "TxResultDto",
  "meta_data": "MetaDataDto",
  "metadataObj": "MetadataModel",
  "tokenObj": "TokenModel",
  "merkleProof": "string[]"
}
```

- If `"execute:true"`, the `"callTx"` object will contain the transaction receipt and related data. If `"execute:false"`, the `"callTx"` will contain the transaction payload for execution on the client side.
- If `"operation_type"` is `"mint"`, the `"meta_data"` field will contain metadata for the token mint from the input payload.
- If `"operation_type"` is `"mint"`, a `"metadataObj"` will be created in the database and linked to the token entity as a related object. If the metadata fields in the operation-specific payload are empty, the common metadata object from the collection entity will be linked to this token entity as a related object.
- `"tokenObj"` is the token entity created in the database.
- If `"operation_type"` is `"whitelistadd"`, the `"merkleProof"` array will be created and returned after updating the merkle root for this contract.

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

### Whitelist options

```json
{
  "contract_id": "string",
  "addresses": "string"
}
```

- `"contract_id"` is the ID of the contract entity from the database.
- `"addresses"` is the comma separated wallet addresses to add or remove from the contract's whitelist.

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
`"text message"`

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
`"text message"`

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

## REST API endpoint to get merkleproof for address

`GET /merkleproof`

This endpoint requires the two query parameters: `"contract_id"` and `"address"`. The response will contain the merkle root and merkle proof for the specified address and contract.

e.g. `GET /merkleproof?contract_id=1&address=0x1234567890`

Output data:

```json
{
  "merkleRoot": "string",
  "merkleProof": "string[]"
}
```
