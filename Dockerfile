FROM ubuntu

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get upgrade -y 
RUN apt-get install -y nodejs



COPY package.json package.json
COPY package-lock.json package-lock.json
COPY Drive-backend.js Drive-backend.js
COPY Drive-frontend.html Drive-frontend.html
COPY index.js index.js
COPY ./views ./views
COPY report.txt report.txt


FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENTRYPOINT ["node", "index.js"]
