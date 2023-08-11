# WEB3-SERVICE

Microservice for blockchain-related operations such as deploying contracts, minting tokens, and querying token data. The microservice is a NestJS application that uses a Postgres database, Redis and AWS SQS pub/sub messaging transport protocol, a local IPFS node, and an AWS S3 client.

Supported blockchains:

- Ethereum
- Polygon

Supported operations:

- Collection contract deploy
- Creating blockchain wallets
- ABI-agnostic contract calls and transactions
- Reading/updating NFT metadata

## Requirements

- redis server
- postgres server
- nodejs
- aws s3 bucket
- aws sqs fifo queue for consumer
- aws sqs fifo queue for producer
- pinata ipfs node
- web3 provider for ethereum
- web3 provider for polygon

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

The following applications will be available to manage the the project after launch with docker-compose:

- PgAdmin [http://localhost:8080/](http://localhost:8080/)
- Redis Commander [http://localhost:8081/](http://localhost:8081/)

## e2e tests

```bash
$ npm run test:e2e
```

## Database migrations

```bash
$ npm run migration:up
$ npm run migration:down
```

### Microservice API methods description in [INTEGRATION.md](INTEGRATION.md)
