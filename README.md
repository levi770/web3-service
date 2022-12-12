# CRM-WEB3-SERVICE

Microservice for blockhain related operations as deploying contracts, minting tokens and querying tokens data. The microservice is a NestJS application based on the postgres database, Redis pub/sub messaging transport protocol, the local IPFS node, and the AWS S3 client.

Supported blockchains:

- Ethereum
- Polygon

Supported operations:

- Collection contract deploy
- ABI agnostic contract calls
- Read/Update NFT metadata

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

Fill missed variables in .env file with actual values. All variables is required.

```bash
$ docker-compose build
$ docker-compose up
```

# Microservice API methods description

All web3 related operations such as contract deploy and contract call will be processed in queue order. After operation request received the microservice will register a job and return an observable object and start to process a job and pipe all stages of this process to observable. 

There is three types of job results from web3 service:

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
  "meta_data": "MetaDataDto",
}
```

- if `"execute:true"`, transaction will be processed in blockchain, if `"execute:false"`, service will only generate transaction payload data for executing on clients side.
- `"network"`, is Ethereum or Polygon chainId.
- `"abi"`, is a contract ABI, required for collection deploy operation and processing contract methods calls.
- `"bytecode"`, required for contract deploy operation in blockchain.
- `"arguments"`, is double colon (::) separated arguments fields for contract constructor (ex.: `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"asset_url"`, `"asset_type"`, `"meta_data"` is optional fields, if setted, service will create common metadata object for this collection.
- `"asset_url"`, is a file key in AWS S3, it will be downloaded from S3 and uploaded to Pinata IPFS node and IPFS url will be setted to metadata object. 


Output data:
```json
{
  "deployTx": "TxResultDto",
  "meta_data": "MetaDataDto",
  "metadataObj": "MetadataModel",
  "contractObj": "ContractModel",
}
```

- if `"execute:true"` the `"deployTx"` will contain transaction receipt and related data, if `"execute:false"` the `"deployTx"` will contain transaction payload for execution on client side.
- if inputs `"asset_url"`, `"asset_type"` and `"meta_data"` was not empty, `"meta_data"` output will contains metadata from payload.
- if inputs `"asset_url"`, `"asset_type"` and `"meta_data"` was not empty, `"metadataObj"`, will be created in DB and setted to contract as related object.
- `"contractObj"`, is a contract entity created in DB.

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
  "operation_options": "Model<T>",
}
```

- if `"execute:true"`, transaction will be processed in blockchain, if `"execute:false"`, service will only generate transaction payload data for executing on clients side.
- `"network"`, is Ethereum or Polygon chainId.
- `"contract_id"`, is id of existing contract in DB for call methods.
- `"method_name"`, contract method name (ex.: `"toggleSaleActive"`, `"toggleSaleFree"`, `"editSaleRestrictions"`)
- `"arguments"`, is double colon (::) separated data fields for contract method call (ex.: `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"operation_type"`, is operation flag (ex.: `"mint"`, `"whitelistadd"`, `"whitelistremove"` or `"common"`)
- `"operation_options"`, is operation specific options for execution method call (ex.: address for adding or removing from whitelist or token minting payload data)

Output data:
```json
{
  "callTx": "TxResultDto",
  "meta_data": "MetaDataDto",
  "metadataObj": "MetadataModel",
  "tokenObj": "TokenModel",
  "merkleProof": "string[]",
}
```

- if `execute:true`, the `"callTx"` object will contains transaction receipt and related data, if `execute:false` the `"callTx"` will contains transaction payload for execution on client side.
- if `"operation_type"` was `"mint"`, `meta_data` field will contains metadata for token mint from input payload.
- if `"operation_type"` was `"mint"`, `"metadataObj"` will be created in DB and setted to token entity as a related object. if metadata fields in operation specific payload was empty, the common metadata object from collection entity will be setted to this token entity as related object.
- `"tokenObj"`, is a token entity created in DB.
- if `"operation_type"` was `"whitelistadd"`, the `"merkleProof"` array will be created and returned after updating merkle root for this contract.

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
- `"nft_number"`, qty of tokens to mint
- `"mint_to"`, user's wallet address to mint token
- `"asset_url"`, is a file key in AWS S3, it will be downloaded from S3 and uploaded to Pinata IPFS node and IPFS url will be setted to metadata object.
- `"asset_type"`, `"image"` or 3d `"object"`
- `"meta_data"`, token metadata payload 


### Whitelist options

```json
{
  "contract_id": "string",
  "address": "string"
}
```
- `"contract_id"`, id of contract entity from DB 
- `"address"`, user's wallet address to add or remove from contract's whitelist

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
  "tx_receipt": "TransactionReceipt",
}
```

- `"network"`, is Ethereum or Polygon chainId.
- `"object_type"`, specified object type (ex.: "contract", "token").
- `"object_type"`, specified object id.
- `"tx_hash"`, transaction hash, received after execution of blockchain transaction on client's side, microservice will get a transaction receipt from blockchain by this transaction hash an will set the object (contract or token) status in Db depending on the results of this transaction.
- `"tx_receipt"`, optional object, transaction receipt, received after execution of blockchain transaction on client's side

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
  "include_child": "boolean",
}
```

- `"object_type"`, specified object type (ex.: `"contract"`, `"token"`).
- `"page"` and `"limit"`, standart pagination options.
- `"order"`, sorting direction.
- `"order_by"`, sorting field.
- if `"include_child:true"`, will include all relations for each entity.

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
  "include_child": "boolean",
}
```

- `"object_type"`, specified object type (ex.: `"contract"`, `"token"`).
- `"id"`, `"token_id"`, `"address"`, `"contract_id"`, is optional fields for filtering objects.
- if `"include_child:true"`, will include all relations for this entity.

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
`"received"`, or `"completed"`, or `"failed"` objects from operations queue.

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
  "meta_data": "object",
}
```

- `"id"`, token id in contract state in blockchain (`"token_id"` in DB)
- `"meta_data"`, metadata payload

Output data:
`"text message"`

## REST API endpoint to get token metadata from DB

`GET /metadata/:token_id`

Params: `"token_id"`, token id in contract state in blockchain

Output data:

MetadataDto
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
  "attributes": [{
    "trait_type": "string",
    "value": "string",
  }],
}
```
