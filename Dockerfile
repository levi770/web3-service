FROM node:16-alpine
RUN mkdir -p /usr/src/crm-web3-svc
WORKDIR /usr/src/crm-web3-svc
ADD . /usr/src/crm-web3-svc
RUN npm install
CMD npm run start