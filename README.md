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

- redis server
- postgres server
- nodejs
- aws s3 bucket
- pinata ipfs node
- web3 provider

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

## e2e tests

For testing you need to setup a privaate key from blockchain account with some testETH or testMATIC on it.

```bash
$ npm run test:e2e
```

### Microservice API methods description in [INTEGRATION.md](INTEGRATION.md)
