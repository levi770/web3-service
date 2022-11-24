# CRM-WEB3-SERVICE

Microservice for blockhain related operations as deploying contracts, minting tokens and querying tokens data. The microservice is a NestJS application based on the postgres database, Redis pub/sub messaging transport protocol, the local IPFS node, and the AWS S3 client.

Supported blockchains:

- Ethereum
- Polygon

Supported operations:

- Template agnostic contract deploy
- Template agnostic NFT mint
- Read/Update NFT metadata

The following applications will be available to manage the working infrastructure of the project after launch:

- PgAdmin [http://localhost:8880/](http://localhost:8880/)
- IPFS WebGUI [http://localhost:5555/](http://localhost:5555/)
- Redis Commander [http://localhost:8881/](http://localhost:8881/)

## Requirements

- git,
- docker,
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
