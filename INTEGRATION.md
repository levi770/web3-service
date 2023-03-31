# Microservice API methods description

All web3-related operations, such as contract deployment and contract calls, will be processed in queue order. After a request for an operation is received, the microservice will register a job and return an observable object. It will then start to process the job and pipe all stages of this process to the observable.

There are three types of job results from the web3 service:

- `"received"`, object contains `jobId` and job input data.
- `"completed"`, object contains `jobId` and job output data.
- `"failed"`, object contains `jobId` and error message.

### Table of contents:

1. [Create a new encrypted wallet keystore in DB](#create-a-new-encrypted-wallet-keystore-in-db)
2. [Deploy any collection (contract)](#deploy-any-collection-contract)
3. [Process mint token method](#process-mint-token-method)
4. [Process whitelist operations](#process-whitelist-operations)
   - [Whitelist add operation](#whitelist-add-operation)
   - [Whitelist remove operation](#whitelist-remove-operation)
   - [Get merkle proof for address](#get-merkle-proof-for-address)
5. [Process any contract method call on the blockchain (common call)](#process-any-contract-method-call-on-the-blockchain-common-call)
6. [Read any contract state data in the blockchain (common call)](#read-any-contract-state-data-in-the-blockchain-common-call)
7. [Get specified job from queue](#get-specified-job-from-queue)
8. [Update object status if blockchain operation was executed on client side](#update-object-status-if-blockchain-operation-was-executed-on-client-side)
9. [Get all objects from DB](#get-all-objects-from-db)
10. [Get one object from DB](#get-one-object-from-db)
11. [Update token metadata](#update-token-metadata)
12. [REST API endpoint to get token metadata from DB](#rest-api-endpoint-to-get-token-metadata-from-db)
13. [REST API endpoint to get server status](#rest-api-endpoint-to-get-server-status)
14. [Process any blockchain call using AWS SQS queue](#process-any-blockchain-call-with-aws-sqs-queue)

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
  "team_id": "8a10a295-c924-4689-9641-99084489b3f2"
}
```

- `"team_id"` is a team ID from CRM side.

Output example:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "id": "49a63085-52c7-476a-b890-5ba7ae49aa54",
    "address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18"
  }
}
```

- `"status"` is a HTTP status code.
- `"message"` is a message for the user.
- `"result"` is an object with the wallet address and the wallet ID in DB.

Related DTOs:

- [CreateWalletDto](./src/web3/dto/create-wallet.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Deploy any collection (contract)

Message pattern:

```json
{
  "cmd": "deploycontract"
}
```

Input example:

```json
{
  "execute": "true",
  "network": "80001",
  "abi": "[{\"inputs\":[...",
  "bytecode": "608060405260008055...",
  "arguments": "100::0x5de14842...::name::SYM::http://some.com/metadata/some_slug/",
  "from_address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
  "slug": "some_slug",
  "price": "1000000000000000000",
  "asset_url": "a6b1354c26c6.original.Dubai.jpg",
  "asset_type": "image",
  "meta_data": {
    "name": "meta_data_name",
    "description": "meta_data_description",
    "attributes": [
      {
        "trait_type": "attributes_trait_type",
        "value": "attributes_trait_value"
      }
    ]
  }
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
- `"slug"` is a unique slug for the metadata object. It will be used to generate the metadata URL.
- `"price"` is a price for mint token in the collection in wei.

Output example:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "tx": {
      "balance": "989201669171719570",
      "comission": "10469154000000000",
      "payload": "some tx payload data",
      "txModel": "tx object from DB"
    },
    "contract": "contract object from DB"
  }
}
```

- If `"execute:true"`, the `"tx"` will contain the transaction receipt and related data. If `"execute:false"`, the `"tx"` will contain the transaction payload for execution on the client side.
- `"result"` is an object with the transaction data and the contract object from DB.

Related DTOs:

- [DeployDto](./src/web3/dto/deploy.dto.ts)
- [TxResultDto](./src/web3/dto/txResult.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Process mint token method

Message pattern:

```json
{
  "cmd": "minttoken"
}
```

Input example:

```json
{
  "execute": true,
  "network": "80001",
  "from_address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
  "contract_id": "8a10a295-c924-4689-9641-99084489b3f2",
  "method_name": "buyFree",
  "arguments": "1::[\"0x6d54fd1de301b631205ce974fcf...\"]",
  "operation_type": "mint",
  "operation_options": {
    "mint_to": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
    "qty": 1,
    "asset_url": "a6b1354c26c6.original.Dubai.jpg",
    "asset_type": "image",
    "meta_data": {
      "name": "meta_data_name",
      "description": "meta_data_description",
      "attributes": [
        {
          "trait_type": "attributes_trait_type",
          "value": "attributes_trait_value"
        }
      ]
    }
  }
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

Output example:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "tx": {
      "balance": "989201669171719570",
      "comission": "10469154000000000",
      "payload": "some tx payload data",
      "txModel": "tx object from DB"
    },
    "token": "token object from DB"
  }
}
```

- If `"execute:true"`, the `"tx"` will contain the transaction receipt and related data. If `"execute:false"`, the `"tx"` will contain the transaction payload for execution on the client side.
- `"result"` is an object with the transaction data and the token object from DB.

Related DTOs:

- [CallDto](./src/web3/dto/call.dto.ts)
- [TxResultDto](./src/web3/dto/txResult.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

## Process whitelist operations

Message pattern:

```json
{
  "cmd": "whitelist"
}
```

there can be two different types of calls:

- whitelist add
- whitelist remove

### Whitelist add operation

Whitelist add example input:

```json
{
  "execute": true,
  "network": "80001",
  "from_address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
  "contract_id": "8a10a295-c924-4689-9641-99084489b3f2",
  "method_name": "setWhitelistFree",
  "operation_type": "whitelistadd",
  "operation_options": {
    "addresses": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18,0xBDECb110889233c987BcF0a9B24dD5ECac1D7ac8"
  }
}
```

- If `"execute:true"`, the transaction will be processed on the blockchain. If `"execute:false"`, the service will only generate transaction payload data for execution on the client side.
- `"network"` specifies the Ethereum or Polygon chain ID.
- `"contract_id"` is the ID of an existing contract in the database for calling methods.
- `"method_name"` is the name of the contract method (e.g. `"toggleSaleActive"`, `"toggleSaleFree"`, `"editSaleRestrictions"`).
- `"arguments"` is a double colon (::) separated list of data fields for the contract method call (e.g. `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"from_address"` is the wallet address from which the transaction will be sent.
- `"operation_type"` is an operation flag (e.g. `"mint"`, `"whitelistadd"`, `"whitelistremove"`, or `"common"`).
- `"operation_options"` is a set of comma separated addresses for adding to the whitelist.

Whitelist add example output:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "root": "0x3b297cc865f8497608cf20c9602e291c2c105cdca97911cd21d1e0aa19704ce4",
    "proof": [
      {
        "address": "0xBDECb110889233c987BcF0a9B24dD5ECac1D7ac8",
        "proof": ["0x6d54fd1de301b631205ce974fcf95ba8f568bb63f8c7d991ad1369697e7e999c"]
      },
      {
        "address": "0x4Fab890371F44c5040bd454EFe009D40ce3FF523",
        "proof": ["0x57d77e67e7489f322454d8784f9698a32183af492a5bf6e34950132a73d7f7d1"]
      }
    ],
    "tx": {
      "payload": "some tx payload",
      "comission": "53322000000000",
      "balance": "978409913850372781",
      "txModel": "tx object from DB"
    }
  }
}
```

- `"result"` is the result of the job.
- `"root"` is the Merkle root hash of the whitelist.
- `"proof"` is an array of addresses and their Merkle proofs.
- `"payload"` is the transaction payload data.
- `"comission"` is the transaction fee.
- `"balance"` is the balance of the wallet from which the transaction will be sent.
- `"txModel"` is the transaction object from the database.

Related DTOs:

- [CallDto](./src/web3/dto/call.dto.ts)
- [TxResultDto](./src/web3/dto/txResult.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

### Whitelist remove operation

Whitelist remove example input:

```json
{
  "execute": true,
  "network": "80001",
  "from_address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
  "contract_id": "8a10a295-c924-4689-9641-99084489b3f2",
  "method_name": "setWhitelistFree",
  "operation_type": "whitelistremove",
  "operation_options": {
    "addresses": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18"
  }
}
```

- If `"execute:true"`, the transaction will be processed on the blockchain. If `"execute:false"`, the service will only generate transaction payload data for execution on the client side.
- `"network"` specifies the Ethereum or Polygon chain ID.
- `"contract_id"` is the ID of an existing contract in the database for calling methods.
- `"method_name"` is the name of the contract method (e.g. `"toggleSaleActive"`, `"toggleSaleFree"`, `"editSaleRestrictions"`).
- `"arguments"` is a double colon (::) separated list of data fields for the contract method call (e.g. `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"from_address"` is the wallet address from which the transaction will be sent.
- `"operation_type"` is an operation flag (e.g. `"mint"`, `"whitelistadd"`, `"whitelistremove"`, or `"common"`).
- `"operation_options"` is a set of comma separated addresses for removing from the whitelist.

Output data:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "root": "0x57d77e67e7489f322454d8784f9698a32183af492a5bf6e34950132a73d7f7d1",
    "tx": {
      "payload": "some tx payload",
      "comission": "58746000000000",
      "balance": "978004916887541816",
      "txModel": "tx object from DB"
    }
  }
}
```

.

- `"result"` is the result of the job.
- If `"execute:true"`, the `"tx"` object will contain the transaction receipt and related data. If `"execute:false"`, the `"tx"` will contain the transaction payload for execution on the client side.
- `"root"` is an updated merkle root for contract.

Related DTOs:

- [CallDto](./src/web3/dto/call.dto.ts)
- [TxResultDto](./src/web3/dto/txResult.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

### Get merkle proof for address

Message pattern:

```json
{
  "cmd": "getmerkleproof"
}
```

Input example:

```json
{
  "addresses": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
  "contract_id": "8a10a295-c924-4689-9641-99084489b3f2"
}
```

- `"address"` is the user's wallet address to get the merkle proof for.
- `"contract_id"` is the ID of an existing contract in the database for calling methods.

Output example:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "root": "0x3b297cc865f8497608cf20c9602e291c2c105cdca97911cd21d1e0aa19704ce4",
    "proof": ["0x6d54fd1de301b631205ce974fcf95ba8f568bb63f8c7d991ad1369697e7e999c"]
  }
}
```

- `"proof"` is an array of strings containing the merkle proof for the address.
- `"root"` is the merkle root for the contract.

Related DTOs:

- [WhitelistOptionsDto](./src/web3/dto/whitelist-options.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Process any contract method call on the blockchain (common call)

Message pattern:

```json
{
  "cmd": "commoncall"
}
```

Input example:

```json
{
  "execute": true,
  "network": "80001",
  "from_address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
  "contract_id": "8a10a295-c924-4689-9641-99084489b3f2",
  "method_name": "toggleSaleActive",
  "operation_type": "common"
}
```

- If `"execute:true"`, the transaction will be processed on the blockchain. If `"execute:false"`, the service will only generate transaction payload data for execution on the client side.
- `"network"` specifies the Ethereum or Polygon chain ID.
- `"contract_id"` is the ID of an existing contract in the database for calling methods.
- `"method_name"` is the name of the contract method (e.g. `"toggleSaleActive"`, `"toggleSaleFree"`, `"editSaleRestrictions"`).
- `"arguments"` is an optional double colon (::) separated list of data fields for the contract method call (e.g. `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).
- `"from_address"` is the wallet address from which the transaction will be sent.
- `"operation_type"` is an operation flag (e.g. `"mint"`, `"whitelistadd"`, `"whitelistremove"`, or `"common"`).

Output example:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "payload": "some tx payload",
    "comission": "60310000000000",
    "balance": "978732261394192033",
    "txModel": "tx object from DB"
  }
}
```

- `"result"` is the result of the job.
- If `"execute:true"`, the `"tx"` object will contain the transaction receipt and related data. If `"execute:false"`, the `"tx"` will contain the transaction payload for execution on the client side.

Related DTOs:

- [CallDto](./src/web3/dto/call.dto.ts)
- [TxResultDto](./src/web3/dto/txResult.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Read any contract state data in the blockchain (common call)

Message pattern:

```json
{
  "cmd": "commoncall"
}
```

Input example:

```json
{
  "execute": false,
  "network": "80001",
  "from_address": "0x5de14842C66B97eb465F166d4f9fca5C6A724E18",
  "contract_id": "8a10a295-c924-4689-9641-99084489b3f2",
  "method_name": "tokenURI",
  "arguments": "0",
  "operation_type": "common"
}
```

- `"arguments"` is an optional double colon (::) separated list of data fields for the contract method call (e.g. `"argItem1::argItem2::[\"argArrayItem1\",\"argArrayItem2\"]::argItem3"`).

Output example:

```json
{
  "status": 201,
  "message": "success",
  "result": {
    "tokenURI": "http://some.com/metadata/some_slug/0"
  }
}
```

- `"result"` is the result of the job.

Related DTOs:

- [CallDto](./src/web3/dto/call.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)


## Update object status if blockchain operation was executed on client side

Message pattern:

```json
{
  "cmd": "updatestatus"
}
```

Input example:

```json
{
  "object_type": "token",
  "object_id": "8a10a295-c924-4689-9641-99084489b3f2",
  "status": "processed",
  "tx_hash": "some tx hash",
  "tx_receipt": "some tx receipt"
}
```

- `"object_type"` is required field specifies the type of object (e.g. `"contract"` or `"token"`).
- `"object_id"` is required field specifies the ID of the specified object.
- `"status"` is required field specifies the status of the object (e.g. `"pending"`, `"processed"`, `"failed"`).
- `"tx_hash"` is an optional string of the transaction hash received after the execution of a blockchain transaction on the client side. The microservice will retrieve the transaction receipt from the blockchain using this transaction hash and will update the status of the object (contract or token) in the database depending on the results of the transaction.
- `"tx_receipt"` is an optional object containing the transaction receipt received after the execution of a blockchain transaction on the client side.

Output example:

```json
{
  "status": 200,
  "message": "success",
  "result": 1
}
```

- `"status"` is the status code of the operation.
- `"message"` is the message of the operation `"success"` or `"failed"`.
- `"result"` is the number of affected and updated rows.

Related DTOs:

- [UpdateStatusDto](./src/repository/dto/update-status.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Get all objects from DB

Message pattern:

```json
{
  "cmd": "getallobjects"
}
```

Input example:

```json
{
  "object_type": "contract",
  "page": 1,
  "limit": 10,
  "sort": "DESC",
  "order_by": "status",
  "include_child": "false",
  "where": {
    "wallet_id": "3ba5da87-8ae0-4258-9e61-7d8019d8f976"
  }
}
```

- `"object_type"` is a required field specifies the type of object (e.g. `"contract"` or `"token"`).
- `"page"` and `"limit"` are an optional fileds for standard pagination options.
- `"sore"` is an optional field specifies the sorting direction.
- `"order_by"` is an optional field specifies the field to sort by.
- If `"include_child:true"`, all relations for each entity will be included, optional field.
- `"where"` is an optional object containing the conditions for the query.

Output example:

```json
{
  "status": 200,
  "message": "success",
  "result": {
    "count": 0,
    "rows": []
  }
}
```

- `"count"`, number of rows.
- `"rows"`, array of requested objects.

Related DTOs:

- [GetAllDto](./src/repository/dto/get-all.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Get one object from DB

Message pattern:

```json
{
  "cmd": "getoneobject"
}
```

Input example:

```json
{
  "object_type": "ObjectTypes",
  "include_child": "boolean",
  "where": {
    "id": "3ba5da87-8ae0-4258-9e61-7d8019d8f976"
  }
}
```

- `"object_type"` specifies the type of object (e.g. `"contract"` or `"token"`).
- If `"include_child:true"`, all relations for this entity will be included.
- `"where"` is an required object containing the conditions for the query.

Output example:

```json
{
  "status": 200,
  "message": "success",
  "result": "some model object"
}
```

Related DTOs:

- [GetOneDto](./src/repository/dto/get-one.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Update token metadata

Message pattern:

```json
{
  "cmd": "updatemetadata"
}
```

Input example:

```json
{
  "slug": "test",
  "token_id": "1",
  "meta_data": {
    "name": "meta_data_name_updated",
    "description": "meta_data_description_updated",
    "attributes": [
      {
        "trait_type": "attributes_trait_type_updated",
        "value": "attributes_trait_value_updated"
      }
    ]
  }
}
```

- `"slug"` is the slug of the contract.
- `"token_id"` is the token ID in the contract state on the blockchain.
- `"meta_data"` is the metadata payload.

Output example:

```json
{
  "status": 200,
  "message": "success",
  "result": "some model object"
}
```

- `"status"` is the status code of the operation.
- `"message"` is the message of the operation `"success"` or `"failed"`.
- `"result"` is the updated token metadata.

Related DTOs:

- [UpdateMetadataDto](./src/repository/dto/update-metadata.dto.ts)
- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## REST API endpoint to get token metadata from DB

`GET /metadata/:slug/:id`

This endpoint requires the `"slug"` and `"id"` parameters, which are the contract slug in DB and the token ID in the contract state on the blockchain (`"token_id"` in the database). The response will contain the metadata payload for the specified token.

Output example:

```json
{
  "status": 200,
  "message": "success",
  "data": {
    "name": "meta_data_name",
    "description": "meta_data_description",
    "attributes": [
      {
        "trait_type": "attributes_trait_type",
        "value": "attributes_trait_value"
      }
    ]
  }
}
```

Related DTOs:

- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## REST API endpoint to get server status

`GET /health`

The response will contain server status.

Output example:

```json
{
  "status": 200,
  "message": "OK",
  "data": null
}
```

Related DTOs:

- [Response](./src/common/dto/response.dto.ts)

[Go to top](#table-of-contents)

## Process any blockchain call with AWS SQS queue

For processing any blockchain call using SQS queue, you need to create two FIFO queues in AWS SQS and add the queue names to the `.env` file, one queue for consuming messages and second for returning response.

execute blockchain opertation using SQS queue

send message to SQS consumer queue

example message:

```json
{
  "requestId": "ace6ab2c-362e-4cc6-a4c1-b9169329edd7",
  "command": "deploycontract",
  "operationName": "deployContract",
  "walletAddress": "0x9eecf7ce9f57107653bf42e3014b0a7d2b68fbba",
  "data": {
    "execute": true,
    "network": 80001,
    "abi": [],
    "bytecode": "TEST",
    "arguments": "1::2",
    "from_address": "0x9eecf7ce9f57107653bf42e3014b0a7d2b68fbba",
    "slug": "test",
    "asset_type": "image",
    "asset_url": "assets/image.png",
    "meta_data": {
      "name": "AwsomeCollection",
      "description": "Awsome Collection Description"
    }
  }
}
```

the resposnce will be sent to SQS response queue.
